# 📘 Panduan Pemakaian MP Wealth System

> **MP Wealth System** adalah aplikasi manajemen keuangan pribadi + portofolio trading.  
> Akses: **https://mp-wealth-system.vercel.app**

---

## Daftar Isi

1. [Login Pertama Kali](#1-login-pertama-kali)
2. [Tampilan Umum Aplikasi](#2-tampilan-umum-aplikasi)
3. [Dashboard — Ringkasan Keuangan](#3-dashboard--ringkasan-keuangan)
4. [Assets — Kelola Rekening & Dompet](#4-assets--kelola-rekening--dompet)
5. [Transactions — Catat Pemasukan & Pengeluaran](#5-transactions--catat-pemasukan--pengeluaran)
6. [Wealth — Ringkasan Kekayaan](#6-wealth--ringkasan-kekayaan)
7. [Trading — Broker & Portofolio](#7-trading--broker--portofolio)
8. [Reports — Laporan Bulanan](#8-reports--laporan-bulanan)
9. [Settings — Pengaturan Akun](#9-settings--pengaturan-akun)
10. [WhatsApp Bot — Catat via WA](#10-whatsapp-bot--catat-via-wa)
11. [Urutan Setup yang Benar](#11-urutan-setup-yang-benar)
12. [Contoh Kasus Penggunaan](#12-contoh-kasus-penggunaan)
13. [FAQ & Troubleshooting](#13-faq--troubleshooting)

---

## 1. Login Pertama Kali

### Langkah login:
1. Buka **https://mp-wealth-system.vercel.app**
2. Masukkan **Email** dan **Password** yang sudah didaftarkan
3. Klik tombol **Sign In**
4. Jika berhasil, kamu akan masuk ke halaman **Dashboard**

### Jika lupa password:
- Saat ini belum ada fitur "Forgot Password" di UI
- Hubungi admin atau reset melalui Supabase Dashboard

> ⚠️ Aplikasi ini bersifat private — hanya akun yang sudah dibuat yang bisa login.

---

## 2. Tampilan Umum Aplikasi

Setelah login, kamu akan melihat tampilan dengan **sidebar kiri** (menu navigasi) dan **konten utama** di kanan.

### Menu Navigasi:
| Menu | Fungsi |
|------|--------|
| 🏠 **Dashboard** | Ringkasan keseluruhan: aset, trading, cashflow |
| 📈 **Trading** | Kelola akun broker MT4/MT5, lihat portofolio |
| 💰 **Wealth** | Ringkasan kekayaan, balance overview |
| 💳 **Transactions** | Catat & lihat semua transaksi |
| 🏦 **Assets** | Kelola rekening bank, e-wallet, cash |
| 📊 **Reports** | Laporan income vs expenses per bulan |
| ⚙️ **Settings** | Pengaturan profil & preferensi |

---

## 3. Dashboard — Ringkasan Keuangan

Halaman pertama setelah login. Menampilkan gambaran besar keuangan kamu.

### Kartu Statistik (Quick Overview):
| Kartu | Isi |
|-------|-----|
| **Portfolio Value** | Total equity semua akun trading (USD) |
| **Today's P&L** | Floating profit/loss trading hari ini |
| **Total Assets** | Total semua aset (bank + cash + e-wallet, dalam IDR) |
| **Monthly Net** | Pemasukan dikurang pengeluaran bulan ini |

### Grafik:
- **Trading Dashboard** — grafik equity akun broker
- **Wealth — Income vs Expenses** — grafik pemasukan & pengeluaran bulanan

> 💡 Dashboard otomatis update saat kamu menambah transaksi atau aset baru.

---

## 4. Assets — Kelola Rekening & Dompet

Halaman **Assets** digunakan untuk mendaftarkan semua rekening & dompet yang kamu miliki.  
Data Assets ini digunakan sebagai pilihan **From/To Account** saat mencatat Transfer.

### Cara Menambah Aset:
1. Klik menu **Assets** di sidebar
2. Klik tombol **+ Add Asset**
3. Isi form:

| Field | Keterangan |
|-------|------------|
| **Name** | Nama bebas, contoh: "BRI Utama", "GoPay", "Cash Dompet" |
| **Asset Type** | Pilih tipe (lihat tabel di bawah) |
| **Balance** | Saldo saat ini |
| **Currency** | IDR atau USD |

4. Klik **Save**

### Tipe Aset yang Tersedia:
| Tipe | Contoh Penggunaan |
|------|-------------------|
| **Cash** | Uang tunai fisik di dompet |
| **Bank** | Rekening bank (BRI, BCA, Mandiri, dll) |
| **E-Wallet** | GoPay, OVO, DANA, ShopeePay, dll |
| **Trading** | Akun trading (biasanya otomatis dari menu Trading) |
| **Investment** | Reksa dana, saham, obligasi |
| **Crypto** | Aset kripto (BTC, ETH, dll) |

### Cara Edit Aset:
- Klik ikon **✏️ (pensil)** di pojok kanan atas kartu aset

### Cara Hapus Aset:
- Klik ikon **🗑️ (tong sampah)** di pojok kanan atas kartu aset
- Konfirmasi dengan klik **OK**

> ⚠️ **Penting:** Tambahkan semua rekening dan dompet kamu di sini **sebelum** mencatat transaksi Transfer. Agar dropdown From/To Account terisi.

---

## 5. Transactions — Catat Pemasukan & Pengeluaran

Halaman untuk mencatat semua aliran uang: pemasukan, pengeluaran, dan transfer.

### Cara Menambah Transaksi:
1. Klik menu **Transactions**
2. Klik tombol **+ Add Transaction**
3. Isi form sesuai jenis transaksi

---

### Tipe Transaksi: INCOME (Pemasukan)

Digunakan untuk mencatat uang masuk (gaji, bonus, penjualan, dll).

| Field | Keterangan |
|-------|------------|
| **Type** | Pilih `Income` |
| **Amount** | Jumlah uang masuk |
| **Currency** | IDR atau USD |
| **To Account** | Rekening tujuan (opsional, dari daftar Assets) |
| **Description** | Keterangan, contoh: "Gaji April 2026" |
| **Date** | Tanggal transaksi |
| **Notes** | Catatan tambahan (opsional) |

**Contoh:** Gaji Rp 5.000.000 masuk ke BRI  
→ Type: Income | Amount: 5000000 | To Account: BRI Utama | Description: Gaji April 2026

---

### Tipe Transaksi: EXPENSE (Pengeluaran)

Digunakan untuk mencatat uang keluar (makan, belanja, tagihan, dll).

| Field | Keterangan |
|-------|------------|
| **Type** | Pilih `Expense` |
| **Amount** | Jumlah pengeluaran |
| **Currency** | IDR atau USD |
| **From Account** | Rekening asal pembayaran (opsional) |
| **Description** | Keterangan, contoh: "Makan siang" |
| **Date** | Tanggal transaksi |
| **Notes** | Catatan tambahan (opsional) |

**Contoh:** Bayar makan Rp 80.000 dari GoPay  
→ Type: Expense | Amount: 80000 | From Account: GoPay | Description: Makan siang

---

### Tipe Transaksi: TRANSFER (Pindah Dana)

Digunakan untuk mencatat perpindahan uang antar rekening/dompet kamu sendiri.  
Termasuk: top-up e-wallet, transfer antar bank, ambil tunai, dll.

| Field | Keterangan |
|-------|------------|
| **Type** | Pilih `Transfer` |
| **Amount** | Jumlah yang ditransfer |
| **Currency** | IDR atau USD |
| **From Account** | Rekening asal |
| **To Account** | Rekening tujuan |
| **Transfer Fee** | Biaya admin/transfer (opsional, contoh: 2500) |
| **Description** | Keterangan |
| **Date** | Tanggal transaksi |

**Contoh: Top-up GoPay dari BRI**  
→ Type: Transfer | Amount: 200000 | From: BRI Utama | To: GoPay | Fee: 0 | Description: Top-up GoPay

**Contoh: Transfer BRI ke BCA dengan fee Rp 2.500**  
→ Type: Transfer | Amount: 500000 | From: BRI Utama | To: BCA | Fee: 2500 | Description: Transfer ke BCA

**Contoh: Ambil tunai dari BRI ke dompet**  
→ Type: Transfer | Amount: 300000 | From: BRI Utama | To: Cash Dompet | Description: Ambil tunai

---

### Cara Edit Transaksi:
- Klik baris transaksi di tabel → form edit akan muncul
- Ubah data yang perlu diubah → klik **Update**

### Cara Hapus Transaksi:
- Klik baris transaksi → di form edit, klik tombol **Delete** (merah, kiri bawah)
- Konfirmasi → transaksi terhapus

### Ringkasan Otomatis (Summary Bar):
Di atas tabel transaksi terdapat 3 kartu:
- 🟢 **Total Income** — total pemasukan dari transaksi yang ditampilkan
- 🔴 **Total Expenses** — total pengeluaran
- **Net** — selisih (hijau jika positif, merah jika negatif)

> 💡 Summary bar otomatis update saat kamu filter by type atau search.

### Filter & Pencarian:
- **Search** — cari berdasarkan deskripsi
- **All Types** — filter hanya Income / Expense / Transfer

---

## 6. Wealth — Ringkasan Kekayaan

Halaman **Wealth** menampilkan ringkasan kekayaan secara menyeluruh.

### Yang ditampilkan:
- **Balance Overview** — breakdown saldo per tipe aset (Bank, Cash, E-Wallet, dll)
- **Monthly Income** — total pemasukan bulan ini
- **Monthly Expenses** — total pengeluaran bulan ini
- **Net Cashflow** — selisih income dan expense
- **Total Assets** — total semua aset dalam IDR
- **Monthly Net** — net cashflow bulan ini

---

## 7. Trading — Broker & Portofolio

Halaman untuk mengelola akun broker trading (MT4/MT5) dan melihat performa portofolio.

### Portfolio Overview:
Tampil di bagian atas halaman Trading:
| Metrik | Keterangan |
|--------|------------|
| **Total Equity** | Total equity semua akun aktif |
| **Total Balance** | Total balance semua akun |
| **Floating P/L** | Total floating profit/loss |
| **Accounts Online** | Jumlah akun yang online / total akun |

---

### Cara Menambah Akun Broker:
1. Klik tombol **+ Add Account**
2. Isi form:

| Field | Keterangan |
|-------|------------|
| **Broker** | Pilih broker (Exness, FBS, dll) |
| **Account Number** | Nomor akun MT4/MT5 |
| **Account Type** | LIVE atau DEMO |
| **Currency** | Mata uang akun (USD, IDR, dll) |
| **Leverage** | Contoh: 1:100, 1:500 |
| **Initial Deposit** | Modal awal yang disetor |

3. Klik **Save** → akun akan muncul sebagai kartu broker

> 💡 Setelah save, **balance otomatis terisi** dengan nilai Initial Deposit yang kamu masukkan.

---

### Kartu Broker:
Setiap akun broker ditampilkan sebagai kartu dengan informasi:
- Nama broker & nomor akun
- Status: **Online** / **Offline**
- Balance, Equity, Floating P/L, Margin Level

### Lihat Detail Akun Broker:
- **Klik kartu broker** → panel detail akan muncul dari kanan
- Panel berisi:
  - Semua metrik (Balance, Equity, Free Margin, dll)
  - Initial Deposit & Total Return
  - Grafik equity
  - Statistik trading (Win Rate, Net P/L)
  - Tabel posisi terbuka & history trade

### Hapus Akun Broker:
- Klik ikon **🗑️** di pojok kanan atas kartu broker
- Konfirmasi → akun terhapus (soft delete)

> ⚠️ Jika kamu menghapus akun lalu ingin menambah lagi dengan nomor akun yang sama, itu diizinkan — sistem menggunakan partial unique index untuk soft-deleted records.

---

## 8. Reports — Laporan Bulanan

Halaman untuk melihat laporan income vs expenses per bulan.

### Cara Menggunakan:
1. Klik menu **Reports**
2. Pilih **Bulan** dan **Tahun** di kanan atas
3. Grafik batang dan tabel ringkasan akan muncul

### Informasi yang ditampilkan:
- Grafik **Income vs Expenses** dalam juta rupiah
- Tabel **Monthly Summary**:
  - Total Income (IDR & USD)
  - Total Expenses (IDR & USD)
  - Net Cashflow (IDR & USD)

---

## 9. Settings — Pengaturan Akun

### Profile:
- **Email Address** — email login (tidak bisa diubah)
- **Display Name** — nama yang muncul di greeting Dashboard
  - Ubah nama → klik **Save Name**

### Preferences:
- **Primary Currency** — pilih IDR atau USD sebagai mata uang utama tampilan

### Account:
- **Sign Out** — klik untuk keluar dari aplikasi

---

## 10. WhatsApp Bot — Catat via WA

Kamu bisa mencatat transaksi langsung dari WhatsApp tanpa buka aplikasi.

### 💸 Pengeluaran
```
beli kopi 15rb dari gopay
makan siang 35rb dari bri
bayar listrik 500rb pakai bca
jajan snack 20rb
```

### 💰 Pemasukan
```
gaji masuk 5jt ke bri
dapat 1jt ke gopay
bonus 500rb ke cash
```

### 🔄 Transfer Antar Aset
Gunakan kata `transfer` atau `kirim`, dan pastikan **tujuan adalah nama aset yang terdaftar**:
```
transfer 1jt dari bri ke bca
kirim 200rb dari gopay ke bri
```
> ✅ Sistem otomatis mendeteksi ini sebagai **Transfer antar aset** karena `bca` / `bri` terdaftar di Assets.

### 💸 Kirim Uang ke Orang (Pengeluaran)
Gunakan kata `transfer` atau `kirim`, tujuan adalah nama orang/pihak lain:
```
transfer 50rb ke saudara dari bca
kirim 100rb ke mama dari gopay
transfer 200rb ke teman dari cash
```
> ✅ Sistem otomatis mendeteksi ini sebagai **Pengeluaran** karena `saudara` / `mama` bukan nama aset yang terdaftar.

### 📊 Info & Lainnya
```
saldo          → cek semua aset
laporan        → rekap pengeluaran hari ini
trading        → ringkasan semua akun trading
trading exness → khusus akun Exness
bantu          → tampilkan panduan ini
```

### 💡 Tips Penting
- **Nama aset harus sesuai** dengan yang didaftarkan di menu Assets (misal: `bca`, `gopay`, `bri`)
- Sistem **otomatis membedakan** transfer antar aset vs kirim ke orang — tidak perlu format khusus
- Deskripsi otomatis diubah ke **Title Case** (contoh: `teh pucuk` → `Teh Pucuk`)

---

## 11. Urutan Setup yang Benar

Agar semua fitur berjalan optimal, ikuti urutan setup berikut saat pertama kali menggunakan aplikasi:

```
LANGKAH 1: Login
     ↓
LANGKAH 2: Buka Assets → Tambah semua rekening
   • Bank BRI, BCA, Mandiri, dll
   • E-Wallet: GoPay, OVO, DANA
   • Cash: Uang tunai dompet
   • Ulangi untuk semua yang kamu punya
     ↓
LANGKAH 3: Buka Trading → Tambah akun broker (jika punya)
   • Isi broker, nomor akun, initial deposit
     ↓
LANGKAH 4: Buka Transactions → Mulai catat transaksi
   • Income: gaji, pemasukan lain
   • Expense: pengeluaran rutin
   • Transfer: perpindahan antar rekening
     ↓
LANGKAH 5: Cek Dashboard untuk melihat ringkasan
```

---

## 12. Contoh Kasus Penggunaan

### Kasus A: Alur Gaji Bulanan

| # | Kejadian | Type | From | To | Amount |
|---|----------|------|------|----|--------|
| 1 | Gaji masuk ke BRI | Income | — | Bank BRI | Rp 5.000.000 |
| 2 | Transfer BRI → BCA | Transfer | Bank BRI | Bank BCA | Rp 2.000.000 |
| 3 | Ambil tunai dari BRI | Transfer | Bank BRI | Cash Dompet | Rp 500.000 |
| 4 | Top-up GoPay dari BCA | Transfer | Bank BCA | GoPay | Rp 300.000 |
| 5 | Bayar makan via GoPay | Expense | GoPay | — | Rp 50.000 |
| 6 | Transfer BCA → Mandiri (fee 2500) | Transfer | Bank BCA | Bank Mandiri | Rp 1.000.000, fee: 2500 |

---

### Kasus B: Top-up E-Wallet dengan Fee

1. Klik **+ Add Transaction**
2. Type: **Transfer**
3. Amount: `200000`
4. From Account: **Bank BRI**
5. To Account: **GoPay**
6. Transfer Fee: `2500`
7. Description: `Top-up GoPay`
8. Klik **Create**

---

### Kasus C: Trading Deposit & Monitor

1. Buka menu **Trading**
2. Klik **+ Add Account**
3. Broker: Exness | Account: 123456789 | Initial Deposit: 500
4. Klik kartu Exness → panel detail terbuka
5. Lihat Balance: $500.00, Equity: $500.00

---

### Kasus D: Catat Income USD (misal profit withdrawal)

1. Klik **+ Add Transaction**
2. Type: **Income**
3. Amount: `100`
4. Currency: **USD**
5. To Account: **Bank BCA** (jika sudah masuk ke bank)
6. Description: `Withdrawal trading Exness`
7. Klik **Create**

---

## 13. FAQ & Troubleshooting

### ❓ From Account / To Account dropdown kosong
**Jawab:** Kamu belum menambahkan aset. Buka menu **Assets** terlebih dahulu dan tambahkan rekening/dompet kamu.

---

### ❓ Balance di kartu broker menampilkan $0.00
**Jawab:** Pastikan sudah menjalankan SQL Section 6 di Supabase (INSERT policy untuk account_metrics_snapshots). Lihat file `database/runsql.md`.

---

### ❓ Dashboard Total Assets masih Rp 0
**Jawab:** Belum ada aset yang ditambahkan. Tambahkan aset terlebih dahulu di menu **Assets**.

---

### ❓ Monthly Income / Expenses di Dashboard masih Rp 0
**Jawab:** Belum ada transaksi bulan ini. Tambahkan transaksi dengan tanggal di bulan yang sedang berjalan.

---

### ❓ Error 409 saat menambah akun broker yang pernah dihapus
**Jawab:** Jalankan SQL Section 5 di `database/runsql.md` untuk mengganti constraint lama dengan partial unique index.

---

### ❓ Error saat tambah aset: "record new has no field amount_usd"
**Jawab:** Jalankan SQL Section 1 di `database/runsql.md` untuk memperbaiki trigger `convert_asset_to_usd`.

---

### ❓ Kolom from_asset_id / to_asset_id / fee belum ada di database
**Jawab:** Jalankan SQL Section 7 dan Section 8 di `database/runsql.md`:
```sql
-- Section 7
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS from_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS to_asset_id   UUID REFERENCES assets(id) ON DELETE SET NULL;

-- Section 8
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee DECIMAL(15, 2) DEFAULT NULL;
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'e_wallet';
```

---

### ❓ Tipe E-Wallet tidak ada di pilihan Asset Type
**Jawab:** Jalankan SQL Section 8 di `database/runsql.md` (`ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'e_wallet'`).

---

## Daftar SQL yang Perlu Dijalankan (Checklist)

Lihat file lengkapnya di `database/runsql.md`. Pastikan semua section berikut sudah dijalankan:

| Section | Keterangan | Status |
|---------|------------|--------|
| Section 1 | Fix trigger `convert_asset_to_usd` | ✅ Wajib |
| Section 2 | Rebuild semua RLS policies | ✅ Wajib |
| Section 5 | Fix 409 conflict trading accounts | ✅ Wajib |
| Section 6 | INSERT policy account_metrics_snapshots | ✅ Wajib |
| Section 7 | Kolom from_asset_id & to_asset_id | ✅ Wajib |
| Section 8 | Kolom fee + tipe e_wallet | ✅ Wajib |

---

*Panduan ini diperbarui per: 04 April 2026*  
*Versi Aplikasi: MP Wealth System v1.0*
