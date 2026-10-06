# ExpenseFlow — Astra SO Operating Expenses

Sistem pencatatan dan tata kelola beban operasional (*Operating Expenses / Opex*) standar Astra Sales Operation (SO 2021) berbasis web dengan arsitektur modular, antarmuka modern berbahan kaca (*specular glassmorphism*), dan integrasi cloud Google Sheets via Google Apps Script.

---

## 📁 Struktur Proyek Modular

```
expenseflow-astra-so/
├── api/
│   └── proxy.js               # Vercel Serverless Function Proxy (CORS & Token handling)
├── css/
│   └── style.css              # Styling kustom (Glassmorphism tokens, backdrop mesh canvas)
├── gas/
│   └── Code.gs                # Backend Google Apps Script untuk Google Sheets
├── js/
│   ├── data/
│   │   └── coa-data.js        # Master Database COA Astra SO 2021 & Smart Intent Keywords
│   ├── modules/
│   │   ├── storage.js         # State management & persistensi LocalStorage
│   │   ├── utils.js           # Formatter angka, toast notifications, tema, ekspor CSV
│   │   ├── modals.js          # Controller dialog modal & slide-over drawer
│   │   ├── api.js             # Integrasi Google Apps Script & sinkronisasi data cloud
│   │   ├── coa.js             # Hierarki pohon COA & pencarian akun leaf
│   │   ├── approvals.js       # Antrean otorisasi dual-control untuk proposal akun baru
│   │   ├── transactions.js    # Form entri transaksi & engine smart intent auto-match
│   │   ├── dashboard.js       # Kalkulasi KPI, tabel ledger desktop, card mobile, filter
│   │   └── search.js          # Spotlight smart search modal (pencarian bahasa alami & kelengkapan akun)
│   └── app.js                 # Entry point aplikasi, router navigasi, & event lifecycle
├── index.html                 # Struktur markup semantik HTML yang bersih & modular
├── vercel.json                # Konfigurasi deployment & rewrite Vercel
└── README.md                  # Dokumentasi proyek
```

---

## 🚀 Fitur Utama

1. **Spotlight Smart Search (Pencarian Cerdas)**: Cari pengeluaran menggunakan bahasa alami (contoh: *"beli air galon"*, *"token pln"*, *"servis ac"*, *"bbm test drive"*). Sistem langsung menampilkan:
   - Kode Akun & Nama Akun COA 8-digit standar Astra SO 2021
   - Kelompok Induk BAB (SE / G&A) & Sub-Bab
   - Rekomendasi Cost Center
   - Status Perpajakan (PPh 21, PPh 23, PPN, Non-Objek PPh)
   - Ruang Lingkup & Penjelasan Audit
   - Contoh Redaksi Transaksi Baku
2. **Kamus COA Astra SO 2021**: Hierarki standar SAP ECC 8-digit terbagi atas:
   - **71000000**: *Selling Expenses* (SE) — Beban Penjualan & Ekspedisi
   - **72000000**: *General & Administrative* (G&A) — Beban Umum & Operasional
3. **Dukungan Dua Arah Google Sheets**: Sinkronisasi data real-time menggunakan Google Apps Script (`gas/Code.gs`) atau serverless proxy Vercel.
4. **Pintasan Keyboard**:
   - `Ctrl+K` atau `/`: Buka Spotlight Pencarian Cerdas
   - `D`: Buka Buku Beban (Dashboard)
   - `K`: Buka Kamus COA
   - `Esc`: Tutup modal / drawer yang aktif

---

## 🛠️ Panduan Penggunaan & Deploy

### 1. Menjalankan secara Lokal
Buka file `index.html` langsung di browser Anda atau gunakan server lokal seperti Live Server / `npx serve`.

### 2. Setup Google Sheets & Apps Script
1. Buka spreadsheet Google Sheets baru atau yang sudah ada.
2. Buka menu **Extensions > Apps Script**.
3. Salin kode dari `gas/Code.gs` dan tempelkan.
4. Klik **Deploy > New deployment**, pilih tipe **Web app**:
   - **Execute as**: *Me*
   - **Who has access**: *Anyone*
5. Salin URL Web App yang dihasilkan.
6. Masuk ke aplikasi ExpenseFlow di menu **API & Google Sheet**, masukkan URL Web App dan Token Keamanan (`astra-secret-token-2026`), lalu klik **Simpan Konfigurasi**.

