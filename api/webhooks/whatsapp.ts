import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env helper — returns '' (not throws) so health check still works
// ---------------------------------------------------------------------------
function env(key: string): string {
  return process.env[key] ?? '';
}

// Lazy supabase client — created on first DB call, not at module load
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
    const key = env('SUPABASE_SERVICE_ROLE_KEY')
             || env('VITE_SUPABASE_SERVICE_ROLE_KEY')
             || env('VITE_SUPABASE_ROLE_KEY');
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

// ---------------------------------------------------------------------------
// Fonnte payload — supports v1 and v2 field names
// ---------------------------------------------------------------------------
interface FonntePayload {
  sender?: string;
  from?: string;
  message?: string;
  text?: string;
  id?: string;
  messageId?: string;
  type?: string;
  timestamp?: string | number;
  date?: string | number;
  url?: string;
  mimeType?: string;
  mimetype?: string;
  device?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Parsed command from WhatsApp message
// ---------------------------------------------------------------------------
interface ParsedCommand {
  intent: 'expense' | 'income' | 'transfer' | 'balance' | 'report' | 'help' | 'unknown';
  amount?: number;
  description?: string;
  categoryHint?: string;
  fromAssetHint?: string;  // "dari gopay" / "pakai bri"
  toAssetHint?: string;    // "ke bri" / "ke tabungan"
}

// ─────────────────────────────────────────────────────────────────────────────
// AMOUNT PARSER
// Handles: 15000, 15rb, 15k, 15ribu, 15jt, 15juta, 1.5jt, 15.000
// ─────────────────────────────────────────────────────────────────────────────
function parseAmount(raw: string): number | null {
  const s = raw.toLowerCase().replace(/rp\.?\s*/g, '').trim();
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m(?:iliar)?|b(?:iliar)?)?/);
  if (!m) return null;

  let num: number;
  const digits = m[1].replace(',', '.');

  // "15.000" with 3 decimal digits → thousands separator in Indonesian
  if (digits.includes('.') && digits.split('.')[1]?.length === 3) {
    num = parseInt(digits.replace('.', ''));
  } else {
    num = parseFloat(digits);
  }

  const unit = m[2] ?? '';
  if (['rb', 'ribu', 'k'].includes(unit))   num *= 1_000;
  else if (['jt', 'juta'].includes(unit))   num *= 1_000_000;
  else if (/^m/.test(unit) || /^b/.test(unit)) num *= 1_000_000_000;

  return num > 0 ? num : null;
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET LOOKUP  — match user's typed asset name against DB records
// ─────────────────────────────────────────────────────────────────────────────
async function findAssetId(userId: string, hint: string): Promise<string | null> {
  if (!hint?.trim()) return null;
  const { data } = await getSupabase()
    .from('assets')
    .select('id, name')
    .eq('user_id', userId)
    .is('deleted_at', null);

  const lower = hint.toLowerCase().trim();
  const match = (data ?? []).find(a => {
    const name = (a.name ?? '').toLowerCase();
    return name.includes(lower) || lower.includes(name);
  });
  return match?.id ?? null;
}

async function getAssetNames(userId: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from('assets')
    .select('name')
    .eq('user_id', userId)
    .is('deleted_at', null);
  return (data ?? []).map(a => a.name as string);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND PARSER  (Indonesian natural language → intent)
// ─────────────────────────────────────────────────────────────────────────────
function parseCommand(text: string): ParsedCommand {
  const t = text.toLowerCase().trim();

  // Info intents
  if (/^(saldo|cek\s*saldo|balance|cek\s*balance)$/.test(t)) return { intent: 'balance' };
  if (/^(laporan|report|rekap\w*|summary|ringkasan)/.test(t))  return { intent: 'report' };
  if (/^(help|bantuan|bantu|panduan|cara|perintah|menu)$/.test(t)) return { intent: 'help' };

  // Extract asset hints from prepositions BEFORE stripping amount
  // "dari [X]" or "pakai [X]" or "via [X]" → fromAssetHint
  const fromAssetHint = t.match(/\b(?:dari|pakai|pake|via|lewat)\s+([\w\s]+?)(?:\s+ke\s|\s+untuk\s|\s*$)/i)?.[1]?.trim();
  // "ke [X]" at or near end → toAssetHint
  const toAssetHint = t.match(/\bke\s+([\w]+(?:\s[\w]+)?)\s*$/i)?.[1]?.trim();

  // Find amount anywhere in the text
  const amtMatch = t.match(/(\d[\d.,]*\s*(?:rb|ribu|k|jt|juta|m(?:iliar)?|b(?:iliar)?)?)/);
  const amount = amtMatch ? parseAmount(amtMatch[1]) : null;
  if (!amount) return { intent: 'unknown' };

  // Strip amount + asset prepositions to isolate description
  let withoutAmt = t.replace(amtMatch![0], '').replace(/\s+/g, ' ').trim();
  if (fromAssetHint) withoutAmt = withoutAmt.replace(new RegExp(`(?:dari|pakai|pake|via|lewat)\\s+${fromAssetHint}`, 'i'), '').trim();
  if (toAssetHint)   withoutAmt = withoutAmt.replace(new RegExp(`ke\\s+${toAssetHint}\\s*$`, 'i'), '').trim();

  // Income
  const incomeKw = ['gaji', 'terima', 'dapat', 'pemasukan', 'masuk', 'diterima', 'bonus', 'thr', 'profit', 'dividen', 'income'];
  for (const kw of incomeKw) {
    if (t.includes(kw)) {
      const desc = withoutAmt.replace(new RegExp(kw, 'g'), '').replace(/\s+/g, ' ').trim();
      return { intent: 'income', amount, description: desc || kw, categoryHint: kw, fromAssetHint, toAssetHint };
    }
  }

  // Transfer
  const transferKw = ['transfer', 'kirim', 'pindah', 'send'];
  for (const kw of transferKw) {
    if (t.includes(kw)) {
      const dest = withoutAmt.replace(new RegExp(kw, 'g'), '').replace(/^ke\s+/, '').trim();
      const desc = dest ? `Transfer${fromAssetHint ? ` dari ${fromAssetHint}` : ''}${toAssetHint ? ` ke ${toAssetHint}` : ''}` : 'Transfer';
      return { intent: 'transfer', amount, description: desc, categoryHint: dest, fromAssetHint, toAssetHint };
    }
  }

  // Expense (default when amount is found)
  const removeWords = /\b(beli|bayar|bayarin|makan|minum|jajan|keluar|habis|spend|untuk|buat|di|ke)\b/g;
  const categoryHint = withoutAmt;
  const description  = withoutAmt.replace(removeWords, '').replace(/\s+/g, ' ').trim() || withoutAmt;
  return { intent: 'expense', amount, description: description || 'Pengeluaran', categoryHint, fromAssetHint, toAssetHint };
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY LOOKUP
// ─────────────────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORY_MAP: Record<string, string[]> = {
  'Food & Dining':     ['kopi', 'makan', 'minum', 'resto', 'warung', 'cafe', 'nasi', 'soto', 'bakso', 'gorengan', 'jajan', 'snack', 'makanan', 'minuman', 'mie', 'ayam', 'sate', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'sarapan', 'siang', 'malam'],
  'Transportation':    ['bensin', 'bbm', 'taksi', 'grab', 'gojek', 'ojek', 'parkir', 'tol', 'bus', 'motor', 'mobil', 'sopir', 'bahan bakar', 'ojol'],
  'Shopping':          ['shopee', 'tokopedia', 'lazada', 'mall', 'supermarket', 'indomaret', 'alfamart', 'belanja', 'toko'],
  'Entertainment':     ['netflix', 'film', 'bioskop', 'game', 'hiburan', 'spotify', 'youtube', 'nonton'],
  'Healthcare':        ['dokter', 'obat', 'apotek', 'rumah sakit', 'klinik', 'vitamin', 'kesehatan', 'rs '],
  'Education':         ['kursus', 'buku', 'sekolah', 'kuliah', 'les', 'seminar', 'training', 'kelas'],
  'Bills & Utilities': ['listrik', 'air', 'pln', 'internet', 'wifi', 'pulsa', 'token', 'tagihan', 'cicilan', 'kredit'],
};
const INCOME_CATEGORY_MAP: Record<string, string[]> = {
  'Salary':              ['gaji', 'salary', 'upah', 'thr', 'bonus'],
  'Trading Profit':      ['trading', 'profit', 'saham', 'forex', 'crypto', 'dividen'],
  'Business Income':     ['bisnis', 'usaha', 'jualan', 'klien', 'client', 'freelance', 'proyek', 'orderan'],
  'Investment Returns':  ['investasi', 'return', 'bunga', 'deposito', 'reksadana'],
};

async function findCategoryId(userId: string, type: 'income' | 'expense', hint: string): Promise<string | null> {
  const lower = (hint ?? '').toLowerCase();
  const map = type === 'income' ? INCOME_CATEGORY_MAP : EXPENSE_CATEGORY_MAP;
  const fallback = type === 'income' ? 'Other Income' : 'Other Expenses';

  let bestName = fallback;
  for (const [catName, keywords] of Object.entries(map)) {
    if (keywords.some(kw => lower.includes(kw))) { bestName = catName; break; }
  }

  const { data } = await getSupabase()
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .eq('type', type)
    .is('deleted_at', null);

  const rows = data ?? [];
  const exact = rows.find(r => r.name?.toLowerCase() === bestName.toLowerCase());
  if (exact) return exact.id;

  // Fallback to the "Other" category
  const other = rows.find(r => r.name?.toLowerCase().includes('other'));
  return other?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONNTE REPLY
// ─────────────────────────────────────────────────────────────────────────────
async function sendWAReply(to: string, message: string): Promise<void> {
  const token = env('FONNTE_TOKEN') || env('VITE_WHATSAPP_VERIFY_TOKEN');
  if (!token) { console.warn('⚠️ No FONNTE_TOKEN — cannot send reply'); return; }

  try {
    const resp = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ target: to, message, delay: '1', countryCode: '62' }).toString(),
    });
    const result = await resp.json() as Record<string, unknown>;
    console.log('📤 WA reply sent:', result);
  } catch (err) {
    console.error('❌ Failed to send WA reply:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BALANCE SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
async function getBalanceSummary(userId: string): Promise<string> {
  console.log(`📊 getBalanceSummary for userId: ${userId}`);
  const { data: assets, error } = await getSupabase()
    .from('assets')
    .select('name, balance, currency')
    .eq('user_id', userId)
    .is('deleted_at', null);

  console.log(`📊 assets found: ${assets?.length ?? 0}`, error?.message ?? '');
  if (!assets?.length) return '📊 Belum ada aset yang terdaftar.\n\nTambahkan aset di app MP Wealth System.';

  const lines = assets.map(a => {
    const val = Number(a.balance);
    const fmt = a.currency === 'USD'
      ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatRupiah(val);
    return { line: `• ${a.name}: ${fmt}`, currency: a.currency as string, val };
  });

  const totalIDR = assets.filter(a => a.currency !== 'USD').reduce((s, a) => s + Number(a.balance), 0);

  return [
    `💰 *Saldo Aset Kamu:*`,
    ``,
    ...lines.map(l => l.line),
    ``,
    `━━━━━━━━━━━━`,
    `🟡 Total IDR  : ${formatRupiah(totalIDR)}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY REPORT
// ─────────────────────────────────────────────────────────────────────────────
async function getDailyReport(userId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const { data: txns } = await getSupabase()
    .from('transactions')
    .select('type, amount, description, transaction_date')
    .eq('user_id', userId)
    .eq('transaction_date', today)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(15);

  if (!txns?.length) return `📅 *Laporan Hari Ini (${today}):*\n\nBelum ada transaksi hari ini.`;

  let income = 0, expense = 0;
  const lines = txns.map(tx => {
    const amt = Number(tx.amount);
    const emoji = tx.type === 'income' ? '🟢' : tx.type === 'expense' ? '🔴' : '🔵';
    if (tx.type === 'income')  income  += amt;
    if (tx.type === 'expense') expense += amt;
    return `${emoji} ${tx.description ?? '-'}: ${formatRupiah(amt)}`;
  });

  const net = income - expense;
  const netStr = net >= 0 ? `+${formatRupiah(net)}` : `-${formatRupiah(Math.abs(net))}`;

  return [
    `📅 *Laporan Hari Ini (${today}):*`, '',
    lines.join('\n'), '',
    `━━━━━━━━━━━━`,
    `🟢 Pemasukan : ${formatRupiah(income)}`,
    `🔴 Pengeluaran: ${formatRupiah(expense)}`,
    `📈 Net        : ${netStr}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELP MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
const HELP_MSG = `📱 *Panduan Perintah WA:*

💸 *Pengeluaran:*
• beli kopi 15rb dari gopay
• makan siang 35rb dari bri
• bayar listrik 500rb pakai bca
• jajan snack 20rb

💰 *Pemasukan:*
• gaji masuk 5jt ke bri
• dapat 1jt ke gopay
• bonus 500rb ke cash

🔄 *Transfer:*
• transfer 1jt dari bri ke bca
• kirim 200rb dari bri ke gopay

📊 *Info:*
• saldo → cek semua aset
• laporan → rekap hari ini
• bantu → panduan ini

💡 *Tips:*
Tulis "dari/pakai" + nama aset untuk update saldo otomatis.
Nama aset sesuai yang didaftarkan di menu Assets.`;

// ---------------------------------------------------------------------------
// Normalise phone numbers for comparison
// Strips +, spaces, dashes. e.g. "+62 822-2765-3512" → "6282227653512"
// ---------------------------------------------------------------------------
function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, '');
}

// ---------------------------------------------------------------------------
// Get device owner's user_id.
// For single-user app: try phone match first, fall back to first user.
// ---------------------------------------------------------------------------
async function getDeviceOwnerUserId(): Promise<string | null> {
  const ownerPhone = normalisePhone(process.env['OWNER_PHONE_NUMBER'] ?? '');

  const { data, error } = await getSupabase()
    .from('user_preferences')
    .select('user_id, whatsapp_number');

  if (error) { console.error('user_preferences lookup error:', error.message); return null; }

  const rows = data ?? [];
  console.log(`🔍 user_preferences rows: ${rows.length}`, rows.map(r => ({ uid: r.user_id?.slice(0,8), wa: r.whatsapp_number })));

  // Try to match by phone (any stored number vs owner phone)
  if (ownerPhone && rows.length > 0) {
    const match = rows.find(row => {
      const stored = normalisePhone(row.whatsapp_number ?? '');
      // Match in both directions (stored contains owner or owner contains stored)
      return stored === ownerPhone
          || stored === `62${ownerPhone.replace(/^0/, '')}`
          || ownerPhone === `62${stored.replace(/^0/, '')}`;
    });
    if (match?.user_id) { console.log(`✅ Device owner matched by phone → ${match.user_id}`); return match.user_id; }
  }

  // Single-user app fallback: always use first user
  if (rows.length > 0) {
    console.log(`📌 Single-user fallback → ${rows[0].user_id}`);
    return rows[0].user_id;
  }

  // Last resort: query auth.users via service role
  const { data: anyUser } = await getSupabase().auth.admin.listUsers();
  const firstUser = anyUser?.users?.[0];
  if (firstUser) { console.log(`📌 auth fallback → ${firstUser.id}`); return firstUser.id; }

  return null;
}

// ---------------------------------------------------------------------------
// Process a parsed command: create transaction / check balance / etc.
// Returns the reply message string.
// ---------------------------------------------------------------------------
async function processCommand(
  parsed: ParsedCommand,
  userId: string,
  waMessageId: string | null,
): Promise<string> {
  if (parsed.intent === 'balance') return getBalanceSummary(userId);
  if (parsed.intent === 'report')  return getDailyReport(userId);
  if (parsed.intent === 'help')    return HELP_MSG;
  if (parsed.intent === 'unknown') return `❓ Perintah tidak dikenali.\n\nKetik *bantu* untuk melihat daftar perintah.`;

  if (!parsed.amount) return `⚠️ Nominal tidak ditemukan. Coba: "beli kopi 15rb dari gopay"`;

  const type = parsed.intent === 'transfer' ? 'transfer'
             : parsed.intent === 'income'   ? 'income'
             : 'expense';

  // Resolve asset IDs from hints
  const [fromAssetId, toAssetId] = await Promise.all([
    parsed.fromAssetHint ? findAssetId(userId, parsed.fromAssetHint) : Promise.resolve(null),
    parsed.toAssetHint   ? findAssetId(userId, parsed.toAssetHint)   : Promise.resolve(null),
  ]);

  const categoryId = type !== 'transfer'
    ? await findCategoryId(userId, type as 'income' | 'expense', parsed.categoryHint ?? parsed.description ?? '')
    : null;

  const today = new Date().toISOString().split('T')[0];

  const { data: tx, error } = await getSupabase()
    .from('transactions')
    .insert({
      user_id:              userId,
      type,
      amount:               parsed.amount,
      currency:             'IDR',
      description:          parsed.description ?? (type === 'income' ? 'Pemasukan' : type === 'transfer' ? 'Transfer' : 'Pengeluaran'),
      category_id:          categoryId,
      from_asset_id:        fromAssetId,
      to_asset_id:          toAssetId,
      source:               'whatsapp',
      whatsapp_message_id:  waMessageId,
      transaction_date:     today,
    })
    .select('id, type, amount, description')
    .single();

  if (error) {
    console.error('❌ Transaction insert error:', error);
    return `❌ Gagal menyimpan transaksi.\nError: ${error.message}`;
  }

  const typeEmoji = type === 'income' ? '🟢' : type === 'expense' ? '🔴' : '🔵';
  const typeLabel = type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer';

  // Show which asset was used (or warning if missing)
  const assetLines: string[] = [];
  if (type === 'expense' || type === 'transfer') {
    if (fromAssetId) assetLines.push(`💳 Dari: ${parsed.fromAssetHint}`);
    else {
      const names = await getAssetNames(userId);
      const hint = names.length ? `\nAset tersedia: ${names.join(', ')}` : '';
      assetLines.push(`⚠️ Aset tidak ditemukan — saldo tidak berubah.${hint}`);
    }
  }
  if (type === 'income' || type === 'transfer') {
    if (toAssetId) assetLines.push(`🏦 Ke: ${parsed.toAssetHint}`);
    else if (type === 'income') {
      const names = await getAssetNames(userId);
      const hint = names.length ? `\nAset tersedia: ${names.join(', ')}` : '';
      assetLines.push(`⚠️ Aset tujuan tidak ditemukan — saldo tidak berubah.${hint}`);
    }
  }

  return [
    `${typeEmoji} *${typeLabel} Tersimpan!*`,
    ``,
    `📝 ${tx?.description}`,
    `💰 ${formatRupiah(parsed.amount)}`,
    ...assetLines,
    `📅 ${today}`,
    ``,
    `Ketik *laporan* untuk melihat ringkasan hari ini.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // GET — health check + env var diagnostics
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        endpoint: '/api/webhooks/whatsapp',
        message: 'WhatsApp webhook is live. Send POST to receive messages.',
        timestamp: new Date().toISOString(),
        env_check: {
          SUPABASE_URL:              !!(env('SUPABASE_URL') || env('VITE_SUPABASE_URL')),
          SUPABASE_SERVICE_ROLE_KEY: !!(env('SUPABASE_SERVICE_ROLE_KEY') || env('VITE_SUPABASE_SERVICE_ROLE_KEY') || env('VITE_SUPABASE_ROLE_KEY')),
          OWNER_PHONE_NUMBER:        !!env('OWNER_PHONE_NUMBER'),
          FONNTE_TOKEN:              !!(env('FONNTE_TOKEN') || env('VITE_WHATSAPP_VERIFY_TOKEN')),
        },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Fonnte sometimes sends application/x-www-form-urlencoded, not JSON
    let rawBody: Record<string, unknown> = {};
    if (typeof req.body === 'string') {
      try { rawBody = JSON.parse(req.body); } catch { rawBody = {}; }
    } else if (req.body && typeof req.body === 'object') {
      rawBody = req.body as Record<string, unknown>;
    }

    const body = rawBody as FonntePayload;
    console.log('📱 RAW Fonnte payload:', JSON.stringify(body, null, 2));

    // Fonnte field normalisation
    const sender      = String(body?.sender ?? body?.from ?? body?.phone ?? body?.number ?? body?.device ?? '').trim();
    const message     = String(body?.message ?? body?.text ?? body?.body ?? body?.content ?? '').trim();
    const whatsappId  = String(body?.id ?? body?.messageId ?? body?.message_id ?? '').trim();
    const messageType = String(body?.type ?? body?.message_type ?? 'text').trim();
    const mediaUrl    = (body?.url ?? body?.media_url ?? null) as string | null;
    const mediaType   = (body?.mimeType ?? body?.mimetype ?? body?.media_type ?? null) as string | null;

    const rawTs      = body?.timestamp ?? body?.date;
    const receivedAt = rawTs
      ? new Date(typeof rawTs === 'number' ? rawTs * 1000 : rawTs).toISOString()
      : new Date().toISOString();

    const effectiveSender  = sender  || 'unknown';
    const effectiveMessage = message || JSON.stringify(body);

    console.log('📝 Parsed:', { sender: effectiveSender, message: effectiveMessage, messageType });

    // user_id = device owner (all messages to this Fonnte device belong to the owner)
    const userId = await getDeviceOwnerUserId();
    if (!userId) console.warn(`⚠️  No device owner found`);
    else         console.log(`✅ User: ${userId}`);

    // Store message
    const { data: inserted, error } = await getSupabase()
      .from('whatsapp_messages')
      .insert({
        user_id:           userId,
        from_number:       effectiveSender,
        text_content:      effectiveMessage,
        whatsapp_id:       whatsappId || null,
        message_type:      messageType,
        media_url:         mediaUrl,
        media_type:        mediaType,
        processing_status: 'pending',
        received_at:       receivedAt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(200).json({ success: false, stored: false, error: error.message });
    }

    const waMessageId = inserted?.id ?? null;
    console.log(`✅ WA message stored — ID: ${waMessageId}`);

    // Process command from any sender (single-user personal app)
    // If OWNER_PHONE_NUMBER is set, verify sender; otherwise allow all
    const ownerPhone = normalisePhone(env('OWNER_PHONE_NUMBER'));
    const isOwner    = !ownerPhone || normalisePhone(effectiveSender) === ownerPhone;

    if (userId && isOwner && messageType === 'text') {
      const parsed = parseCommand(effectiveMessage);
      console.log('🤖 Parsed command:', parsed);

      const reply = await processCommand(parsed, userId, waMessageId);

      // Update processing_status
      const status = parsed.intent === 'unknown' ? 'failed' : 'processed';
      await getSupabase()
        .from('whatsapp_messages')
        .update({ processing_status: status })
        .eq('id', waMessageId);

      // Send reply back via Fonnte
      await sendWAReply(effectiveSender, reply);
    }

    return res.status(200).json({ success: true, message_id: waMessageId, user_id: userId });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('💥 WA webhook unhandled error:', err);
    return res.status(500).json({ success: false, error: message });
  }
}

