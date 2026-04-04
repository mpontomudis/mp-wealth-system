// src/pages/GuidePage.tsx
import { useState } from 'react';
import {
  BookOpen,
  LogIn,
  LayoutDashboard,
  Landmark,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  content: React.ReactNode;
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300">
      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
      <span>{children}</span>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-300">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
      <span>{children}</span>
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-mp-primary/20 border border-mp-primary/40 flex items-center justify-center text-xs font-bold text-mp-primary">
        {num}
      </div>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-mp-text-primary mb-0.5">{title}</p>
        {children && <div className="text-sm text-mp-text-secondary">{children}</div>}
      </div>
    </div>
  );
}

function FieldTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 my-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-4 py-2 text-left text-xs font-semibold text-mp-text-muted uppercase tracking-wide">Field</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-mp-text-muted uppercase tracking-wide">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, desc], i) => (
            <tr key={i} className="border-b border-white/[0.05] last:border-0">
              <td className="px-4 py-2.5 font-mono text-xs text-mp-primary whitespace-nowrap">{field}</td>
              <td className="px-4 py-2.5 text-mp-text-secondary">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExampleBox({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5 my-2">
      <p className="text-xs font-semibold text-mp-text-muted uppercase tracking-wide mb-2">{title}</p>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex gap-2 text-sm">
          <span className="text-mp-text-muted min-w-[120px]">{k}:</span>
          <span className="text-white font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

function WACmd({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start text-sm">
      <code className="bg-white/[0.06] border border-white/10 rounded-md px-2 py-0.5 text-green-300 font-mono text-xs whitespace-nowrap shrink-0">{cmd}</code>
      <span className="text-mp-text-secondary">{desc}</span>
    </div>
  );
}

// ─── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ section, defaultOpen = false }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-white/15 bg-white/[0.04]' : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
          <Icon className="w-4.5 h-4.5" size={18} />
        </div>
        <span className="flex-1 font-semibold text-mp-text-primary">{section.title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-mp-text-muted" />
          : <ChevronRight className="w-4 h-4 text-mp-text-muted" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 text-mp-text-secondary border-t border-white/[0.05]">
          {section.content}
        </div>
      )}
    </div>
  );
}

// ─── Sections content ──────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: 'login',
    icon: LogIn,
    title: '1. Login',
    color: 'bg-blue-500/20 text-blue-400',
    content: (
      <div className="space-y-3 pt-2">
        <div className="flex flex-col gap-2">
          <Step num={1} title="Buka aplikasi">Akses <span className="font-mono text-blue-400 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">mp-wealth-system.vercel.app</span></Step>
          <Step num={2} title="Masukkan Email & Password">Email dan password yang sudah terdaftar</Step>
          <Step num={3} title='Klik "Sign In"'>Berhasil → masuk ke Dashboard</Step>
        </div>
        <Warning>Aplikasi ini bersifat private. Hanya akun yang sudah dibuat yang bisa login.</Warning>
      </div>
    ),
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: '2. Dashboard',
    color: 'bg-purple-500/20 text-purple-400',
    content: (
      <div className="space-y-3 pt-2">
        <p>Halaman utama setelah login. Menampilkan gambaran besar keuangan kamu secara real-time.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['Portfolio Value', 'Total equity semua akun trading (USD)'],
            ["Today's P&L", 'Floating profit/loss trading hari ini'],
            ['Total Assets', 'Semua aset dalam IDR (bank + cash + e-wallet)'],
            ['Monthly Net', 'Pemasukan − Pengeluaran bulan ini'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <p className="text-xs font-semibold text-mp-text-primary">{title}</p>
              <p className="text-xs text-mp-text-muted mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
        <Tip>Dashboard otomatis update saat kamu menambah transaksi atau aset baru.</Tip>
      </div>
    ),
  },
  {
    id: 'assets',
    icon: Landmark,
    title: '3. Assets — Rekening & Dompet',
    color: 'bg-emerald-500/20 text-emerald-400',
    content: (
      <div className="space-y-4 pt-2">
        <Warning>
          <strong>Lakukan ini PERTAMA KALI</strong> sebelum mencatat transaksi Transfer — agar dropdown From/To Account terisi.
        </Warning>
        <div>
          <p className="text-sm font-semibold text-mp-text-primary mb-2">Cara Menambah Aset:</p>
          <div className="flex flex-col gap-2">
            <Step num={1} title='Klik menu "Assets" di sidebar' />
            <Step num={2} title='Klik "+ Add Asset"' />
            <Step num={3} title="Isi form dan klik Save" />
          </div>
        </div>
        <FieldTable rows={[
          ['Name', 'Nama bebas, misal: "BRI Utama", "GoPay", "Cash Dompet"'],
          ['Asset Type', 'Pilih tipe (lihat di bawah)'],
          ['Balance', 'Saldo saat ini'],
          ['Currency', 'IDR atau USD'],
        ]} />
        <div>
          <p className="text-sm font-semibold text-mp-text-primary mb-2">Tipe Aset:</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Cash', 'bg-green-500/20 text-green-400', 'Uang tunai fisik'],
              ['Bank', 'bg-blue-500/20 text-blue-400', 'BRI, BCA, Mandiri...'],
              ['E-Wallet', 'bg-sky-500/20 text-sky-400', 'GoPay, OVO, DANA...'],
              ['Trading', 'bg-purple-500/20 text-purple-400', 'Akun broker'],
              ['Investment', 'bg-yellow-500/20 text-yellow-400', 'Reksa dana, saham'],
              ['Crypto', 'bg-orange-500/20 text-orange-400', 'BTC, ETH...'],
            ].map(([name, color, desc]) => (
              <div key={name} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5">
                <Badge color={color}>{name}</Badge>
                <span className="text-xs text-mp-text-muted">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <Tip>Untuk edit aset klik ikon ✏️, untuk hapus klik ikon 🗑️ pada kartu aset.</Tip>
      </div>
    ),
  },
  {
    id: 'transactions',
    icon: Receipt,
    title: '4. Transactions — Catat Aliran Uang',
    color: 'bg-rose-500/20 text-rose-400',
    content: (
      <div className="space-y-5 pt-2">
        <p>Semua aliran uang dicatat di sini: pemasukan, pengeluaran, dan transfer antar rekening.</p>

        {/* Income */}
        <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge color="bg-green-500/20 text-green-400">INCOME</Badge>
            <span className="text-sm text-mp-text-secondary">Uang masuk (gaji, bonus, dll)</span>
          </div>
          <FieldTable rows={[
            ['Amount', 'Jumlah uang masuk'],
            ['To Account', 'Rekening tujuan (dari daftar Assets)'],
            ['Description', 'Keterangan, misal: "Gaji April 2026"'],
          ]} />
          <ExampleBox title="Contoh: Gaji masuk ke BRI" rows={[
            ['Type', 'Income'],
            ['Amount', '5.000.000'],
            ['To Account', 'Bank BRI'],
            ['Description', 'Gaji April 2026'],
          ]} />
        </div>

        {/* Expense */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge color="bg-red-500/20 text-red-400">EXPENSE</Badge>
            <span className="text-sm text-mp-text-secondary">Uang keluar (makan, belanja, tagihan)</span>
          </div>
          <FieldTable rows={[
            ['Amount', 'Jumlah pengeluaran'],
            ['From Account', 'Rekening/dompet yang dipakai bayar'],
            ['Description', 'Keterangan, misal: "Makan siang"'],
          ]} />
          <ExampleBox title="Contoh: Bayar makan via GoPay" rows={[
            ['Type', 'Expense'],
            ['Amount', '80.000'],
            ['From Account', 'GoPay'],
            ['Description', 'Makan siang'],
          ]} />
        </div>

        {/* Transfer */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge color="bg-blue-500/20 text-blue-400">TRANSFER</Badge>
            <span className="text-sm text-mp-text-secondary">Pindah dana antar rekening sendiri</span>
          </div>
          <FieldTable rows={[
            ['Amount', 'Jumlah yang ditransfer'],
            ['From Account', 'Rekening asal'],
            ['To Account', 'Rekening tujuan'],
            ['Transfer Fee', 'Biaya admin (opsional, misal: 2500)'],
            ['Description', 'Keterangan'],
          ]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ExampleBox title="Top-up GoPay dari BRI" rows={[
              ['Type', 'Transfer'],
              ['Amount', '200.000'],
              ['From', 'Bank BRI'],
              ['To', 'GoPay'],
              ['Fee', '0'],
            ]} />
            <ExampleBox title="Transfer BRI → BCA (ada fee)" rows={[
              ['Type', 'Transfer'],
              ['Amount', '500.000'],
              ['From', 'Bank BRI'],
              ['To', 'Bank BCA'],
              ['Fee', '2.500'],
            ]} />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-mp-text-primary">Tips tambahan:</p>
          <div className="flex items-start gap-2 text-sm text-mp-text-secondary">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-mp-green" />
            <span><strong>Edit transaksi:</strong> Klik baris di tabel → ubah data → klik Update</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-mp-text-secondary">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-mp-green" />
            <span><strong>Hapus transaksi:</strong> Klik baris → klik tombol Delete (merah)</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-mp-text-secondary">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-mp-green" />
            <span><strong>Summary bar:</strong> Di atas tabel terlihat Total Income, Total Expenses, dan Net otomatis</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'trading',
    icon: TrendingUp,
    title: '5. Trading — Akun Broker',
    color: 'bg-violet-500/20 text-violet-400',
    content: (
      <div className="space-y-4 pt-2">
        <p>Kelola akun broker MT4/MT5 dan pantau performa portofolio trading kamu.</p>

        <div>
          <p className="text-sm font-semibold text-mp-text-primary mb-2">Cara Menambah Akun Broker:</p>
          <div className="flex flex-col gap-2">
            <Step num={1} title='Klik menu "Trading"' />
            <Step num={2} title='Klik "+ Add Account"' />
            <Step num={3} title="Isi form" />
            <Step num={4} title='Klik "Save"'>Balance otomatis terisi dari Initial Deposit</Step>
          </div>
        </div>
        <FieldTable rows={[
          ['Broker', 'Pilih broker (Exness, FBS, dll)'],
          ['Account Number', 'Nomor akun MT4/MT5 kamu'],
          ['Account Type', 'LIVE atau DEMO'],
          ['Currency', 'Mata uang akun (USD, IDR, dll)'],
          ['Leverage', 'Contoh: 1:100, 1:500'],
          ['Initial Deposit', 'Modal awal yang disetor'],
        ]} />

        <div>
          <p className="text-sm font-semibold text-mp-text-primary mb-2">Lihat Detail Akun:</p>
          <div className="flex items-center gap-2 text-sm text-mp-text-secondary">
            <ArrowRight className="w-4 h-4 shrink-0 text-violet-400" />
            <span>Klik kartu broker → panel detail terbuka dari kanan</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Balance', 'Equity', 'Free Margin', 'Floating P/L', 'Margin Level', 'Open Positions', 'Win Rate', 'Grafik Equity', 'Trade History'].map(m => (
              <span key={m} className="text-xs bg-white/[0.06] border border-white/10 rounded-md px-2 py-0.5 text-mp-text-secondary">{m}</span>
            ))}
          </div>
        </div>
        <Tip>Jika menghapus akun lalu ingin menambah lagi dengan nomor yang sama — diizinkan, sistem mendukung soft-delete.</Tip>
      </div>
    ),
  },
  {
    id: 'wealth',
    icon: Wallet,
    title: '6. Wealth — Ringkasan Kekayaan',
    color: 'bg-teal-500/20 text-teal-400',
    content: (
      <div className="space-y-3 pt-2">
        <p>Halaman Wealth menampilkan ringkasan kekayaan bersih secara menyeluruh.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Balance Overview', 'Saldo per tipe aset'],
            ['Monthly Income', 'Total pemasukan bulan ini'],
            ['Monthly Expenses', 'Total pengeluaran bulan ini'],
            ['Net Cashflow', 'Income − Expenses'],
            ['Total Assets', 'Semua aset dalam IDR'],
            ['Monthly Net', 'Net cashflow bulan ini'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-xs font-semibold text-mp-text-primary">{t}</p>
              <p className="text-xs text-mp-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: '7. Reports — Laporan Bulanan',
    color: 'bg-amber-500/20 text-amber-400',
    content: (
      <div className="space-y-3 pt-2">
        <p>Lihat laporan income vs expenses per bulan dalam bentuk grafik batang dan tabel.</p>
        <div className="flex flex-col gap-2">
          <Step num={1} title='Klik menu "Reports"' />
          <Step num={2} title="Pilih Bulan dan Tahun di kanan atas" />
          <Step num={3} title="Grafik dan tabel ringkasan tampil otomatis" />
        </div>
        <FieldTable rows={[
          ['Income vs Expenses', 'Grafik batang dalam juta rupiah'],
          ['Total Income', 'Dalam IDR & USD'],
          ['Total Expenses', 'Dalam IDR & USD'],
          ['Net Cashflow', 'Selisih income dan expense'],
        ]} />
      </div>
    ),
  },
  {
    id: 'settings',
    icon: Settings,
    title: '8. Settings — Pengaturan',
    color: 'bg-gray-500/20 text-gray-400',
    content: (
      <div className="space-y-3 pt-2">
        <FieldTable rows={[
          ['Display Name', 'Nama yang muncul di greeting Dashboard'],
          ['Primary Currency', 'IDR atau USD sebagai mata uang tampilan utama'],
          ['Sign Out', 'Keluar dari aplikasi'],
        ]} />
        <Tip>Ubah Display Name → klik "Save Name" → nama langsung berubah di Dashboard.</Tip>
      </div>
    ),
  },
  {
    id: 'setup',
    icon: CheckCircle2,
    title: '9. Urutan Setup yang Benar',
    color: 'bg-green-500/20 text-green-400',
    content: (
      <div className="space-y-3 pt-2">
        <p className="text-sm">Ikuti urutan ini saat <strong>pertama kali</strong> menggunakan aplikasi:</p>
        <div className="flex flex-col gap-3">
          {[
            ['Login', 'Masuk dengan email & password'],
            ['Tambah Assets', 'Daftarkan semua rekening bank, e-wallet, dan cash yang kamu punya'],
            ['Tambah Akun Trading', 'Jika punya akun broker — tambahkan di menu Trading'],
            ['Catat Transaksi', 'Mulai catat Income, Expense, dan Transfer harian'],
            ['Cek Dashboard', 'Lihat ringkasan otomatis di Dashboard & Wealth'],
          ].map(([title, desc], i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">{i + 1}</div>
              <div>
                <p className="text-sm font-semibold text-mp-text-primary">{title}</p>
                <p className="text-xs text-mp-text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'whatsapp',
    icon: MessageSquare,
    title: '10. WhatsApp Chatbot — Catat via WA',
    color: 'bg-green-500/20 text-green-400',
    content: (
      <div className="space-y-5 pt-2">
        <p>Catat transaksi langsung dari WhatsApp tanpa buka aplikasi. Kirim pesan ke <span className="font-mono text-green-400 text-xs bg-green-500/10 px-1.5 py-0.5 rounded">6282227653512</span> dengan format berikut:</p>

        <Warning>
          <strong>Penting:</strong> Tulis nama aset dengan kata kunci <code className="bg-black/20 px-1 rounded">dari</code> / <code className="bg-black/20 px-1 rounded">pakai</code> (expense) atau <code className="bg-black/20 px-1 rounded">ke</code> (income) agar saldo aset otomatis terupdate. Nama aset harus sesuai yang ada di menu <strong>Assets</strong>.
        </Warning>

        {/* Expense */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Badge color="bg-red-500/20 text-red-400">EXPENSE</Badge>
            <span className="text-sm text-mp-text-secondary">Format: [deskripsi] [nominal] dari [aset]</span>
          </div>
          <WACmd cmd="beli kopi 15rb dari gopay"     desc="Expense Rp 15.000, dari aset GoPay" />
          <WACmd cmd="makan siang 35rb dari bri"     desc="Expense Rp 35.000, dari aset BRI" />
          <WACmd cmd="bayar listrik 500rb pakai bca" desc="Expense Rp 500.000, dari aset BCA" />
          <WACmd cmd="jajan snack 20rb"              desc="Expense Rp 20.000 (tanpa update saldo)" />
        </div>

        {/* Income */}
        <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Badge color="bg-green-500/20 text-green-400">INCOME</Badge>
            <span className="text-sm text-mp-text-secondary">Format: [deskripsi] [nominal] ke [aset]</span>
          </div>
          <WACmd cmd="gaji masuk 5jt ke bri"   desc="Income Rp 5.000.000, masuk ke aset BRI" />
          <WACmd cmd="dapat 1jt ke gopay"       desc="Income Rp 1.000.000, masuk ke GoPay" />
          <WACmd cmd="bonus 500rb ke cash"      desc="Income Rp 500.000, masuk ke Cash" />
        </div>

        {/* Transfer */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Badge color="bg-blue-500/20 text-blue-400">TRANSFER</Badge>
            <span className="text-sm text-mp-text-secondary">Format: transfer [nominal] dari [aset] ke [aset]</span>
          </div>
          <WACmd cmd="transfer 1jt dari bri ke bca"    desc="Transfer Rp 1.000.000 dari BRI ke BCA" />
          <WACmd cmd="kirim 200rb dari bri ke gopay"   desc="Transfer Rp 200.000 dari BRI ke GoPay" />
        </div>

        {/* Info commands */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
          <p className="text-sm font-semibold text-mp-text-primary mb-1">📊 Perintah Info:</p>
          <WACmd cmd="saldo"   desc="Tampilkan saldo semua aset" />
          <WACmd cmd="laporan" desc="Rekap transaksi hari ini (income, expense, net)" />
          <WACmd cmd="bantu"   desc="Tampilkan panduan lengkap perintah WA" />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-mp-text-primary">Format nominal yang didukung:</p>
          <div className="flex flex-wrap gap-1.5">
            {['15000', '15rb', '15k', '15ribu', '1.5jt', '15jt', '15juta', '15.000'].map(f => (
              <code key={f} className="bg-white/[0.06] border border-white/10 rounded px-2 py-0.5 text-xs text-green-300 font-mono">{f}</code>
            ))}
          </div>
        </div>

        <Tip>Jika nama aset tidak ditemukan, bot akan menampilkan daftar aset yang tersedia. Pastikan nama aset di command cocok dengan yang didaftarkan di menu Assets.</Tip>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: '11. FAQ & Troubleshooting',
    color: 'bg-red-500/20 text-red-400',
    content: (
      <div className="space-y-3 pt-2">
        {[
          {
            q: 'From Account / To Account kosong?',
            a: 'Kamu belum menambahkan aset. Buka menu Assets terlebih dahulu dan tambahkan rekening/dompet kamu.',
          },
          {
            q: 'Balance di kartu broker menampilkan $0.00?',
            a: 'Pastikan sudah menjalankan SQL Section 6 di Supabase (INSERT policy untuk account_metrics_snapshots). Lihat file database/runsql.md.',
          },
          {
            q: 'Dashboard Total Assets masih Rp 0?',
            a: 'Belum ada aset yang ditambahkan. Tambahkan aset terlebih dahulu di menu Assets.',
          },
          {
            q: 'Monthly Income / Expenses masih Rp 0?',
            a: 'Belum ada transaksi bulan ini. Tambahkan transaksi dengan tanggal di bulan yang sedang berjalan.',
          },
          {
            q: 'Error 409 saat menambah akun broker yang pernah dihapus?',
            a: 'Jalankan SQL Section 5 di database/runsql.md untuk mengganti constraint lama dengan partial unique index.',
          },
          {
            q: 'Tipe E-Wallet tidak ada di pilihan Asset Type?',
            a: 'Jalankan SQL Section 8 di database/runsql.md: ALTER TYPE asset_type ADD VALUE IF NOT EXISTS \'e_wallet\'.',
          },
          {
            q: 'Kolom from_asset_id / to_asset_id / fee belum ada?',
            a: 'Jalankan SQL Section 7 & Section 8 di database/runsql.md untuk menambahkan kolom-kolom tersebut.',
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 space-y-1">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
              <p className="text-sm font-semibold text-mp-text-primary">{q}</p>
            </div>
            <p className="text-sm text-mp-text-secondary pl-6">{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Panduan Aplikasi</h1>
          <p className="text-sm text-mp-text-muted mt-0.5">
            Panduan lengkap pemakaian MP Wealth System dari awal hingga mahir.
            Klik setiap bagian untuk membaca detail.
          </p>
        </div>
      </div>

      {/* Quick jump chips */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => {
                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-mp-text-secondary hover:text-white transition-colors"
            >
              <Icon size={12} />
              {s.title.replace(/^\d+\.\s/, '')}
            </button>
          );
        })}
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-2.5">
        {sections.map((section, i) => (
          <div id={`section-${section.id}`} key={section.id}>
            <AccordionItem section={section} defaultOpen={i === 0} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-mp-text-muted">
        MP Wealth System — Panduan v2.0 · Diperbarui April 2026
      </div>
    </div>
  );
}
