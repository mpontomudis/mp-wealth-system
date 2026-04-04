import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env helper — returns undefined (not throws) so health check still works
// ---------------------------------------------------------------------------
function env(key: string): string {
  return process.env[key] ?? '';
}

// Lazy supabase client — created on first DB call, not at module load
// This prevents FUNCTION_INVOCATION_FAILED when env vars aren't set yet
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = env('SUPABASE_URL');
    const key = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

// ---------------------------------------------------------------------------
// Fonnte payload — supports v1 and v2 field names
// Full payload reference: https://docs.fonnte.com/webhook
// ---------------------------------------------------------------------------
interface FonntePayload {
  sender?: string;        // v1
  from?: string;          // v2
  message?: string;       // v1 text
  text?: string;          // v2 text
  id?: string;
  messageId?: string;
  type?: string;          // 'text' | 'image' | 'audio' | 'video' | 'document'
  timestamp?: string | number;
  date?: string | number;
  url?: string;
  mimeType?: string;
  mimetype?: string;
  device?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Normalise phone numbers for comparison
// Strips +, spaces, dashes. e.g. "+62 822-2765-3512" → "6282227653512"
// ---------------------------------------------------------------------------
function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, '');
}

// ---------------------------------------------------------------------------
// Lookup user_id by phone number.
// Strategy:
//   1. Query user_preferences.whatsapp_number (normalised match)
//   2. Fallback: if OWNER_PHONE_NUMBER env matches sender → fetch first user
// ---------------------------------------------------------------------------
async function findUserByPhone(senderRaw: string): Promise<string | null> {
  const sender = normalisePhone(senderRaw);

  // Step 1: check user_preferences table
  const { data, error } = await getSupabase()
    .from('user_preferences')
    .select('user_id, whatsapp_number')
    .not('whatsapp_number', 'is', null);

  if (error) {
    console.error('user_preferences lookup error:', error.message);
  }

  const match = (data ?? []).find((row) => {
    const stored = normalisePhone(row.whatsapp_number ?? '');
    // Match exact, or handle 0xxx → 62xxx conversion
    return stored === sender || stored === `62${sender.replace(/^0/, '')}`;
  });

  if (match?.user_id) return match.user_id;

  // Step 2: fallback via OWNER_PHONE_NUMBER env var
  const ownerPhone = process.env['OWNER_PHONE_NUMBER'];
  if (ownerPhone && normalisePhone(ownerPhone) === sender) {
    // Fetch the first (and likely only) user in the system
    const { data: users } = await getSupabase()
      .from('user_preferences')
      .select('user_id')
      .limit(1)
      .single();
    if (users?.user_id) {
      console.log(`📌 Matched via OWNER_PHONE_NUMBER env fallback → ${users.user_id}`);
      return users.user_id;
    }
  }

  return null;
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
          SUPABASE_URL:              !!process.env['SUPABASE_URL'],
          SUPABASE_SERVICE_ROLE_KEY: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
          OWNER_PHONE_NUMBER:        !!process.env['OWNER_PHONE_NUMBER'],
        },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body = req.body as FonntePayload;
    console.log('📱 Incoming WA webhook:', JSON.stringify(body, null, 2));

    // Normalise fields across Fonnte versions
    const sender      = (body?.sender    ?? body?.from      ?? '').trim();
    const message     = (body?.message   ?? body?.text      ?? '').trim();
    const whatsappId  = (body?.id        ?? body?.messageId ?? '').trim();
    const messageType = (body?.type                         ?? 'text').trim();
    const mediaUrl    = body?.url   ?? null;
    const mediaType   = body?.mimeType ?? body?.mimetype ?? null;

    // Parse timestamp → ISO string; fall back to now()
    const rawTs      = body?.timestamp ?? body?.date;
    const receivedAt = rawTs
      ? new Date(typeof rawTs === 'number' ? rawTs * 1000 : rawTs).toISOString()
      : new Date().toISOString();

    console.log('📝 Parsed:', { sender, message, whatsappId, messageType });

    if (!sender || !message) {
      console.warn('WA webhook: empty sender or message — ignored');
      return res.status(400).json({ success: false, error: 'Missing sender or message' });
    }

    // Lookup user_id by phone number
    const userId = await findUserByPhone(sender);
    if (!userId) {
      console.warn(`⚠️  No user found for phone: ${sender} — message stored without user`);
    } else {
      console.log(`✅ Matched user_id: ${userId} for phone: ${sender}`);
    }

    // Insert into whatsapp_messages
    const { data: inserted, error } = await getSupabase()
      .from('whatsapp_messages')
      .insert({
        user_id:           userId,          // null if phone not registered
        from_number:       sender,
        text_content:      message,
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
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ WA message stored — ID: ${inserted?.id} | from: ${sender}`);
    return res.status(200).json({
      success: true,
      message_id: inserted?.id ?? null,
      user_id: userId,
      processing: 'queued',
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('💥 WA webhook unhandled error:', err);
    return res.status(500).json({ success: false, error: message });
  }
}

