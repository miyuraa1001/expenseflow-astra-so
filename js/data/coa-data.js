/**
 * js/data/coa-data.js
 * Chart of Accounts (COA) Master Data & Smart Intent Matcher Triggers
 * Sesuai Persis dengan Database: COA_Operating_Expenses_SO_2021_ASTRA (Sheet: COA OPEX 2021 Presisi Full)
 */

// Master Database COA Astra SO 2021 (Format Baku: XXX.XX.XX.XXX)
const astraCoaDatabase = [
  {
    groupCode: '700',
    groupName: 'EMPLOYEE COMPENSATION',
    color: 'emerald',
    subgroups: [
      {
        code: '700.01.00.000',
        name: 'Salaries',
        accounts: [
          {
            code: '700.01.00.000',
            name: 'Salaries',
            cc: '[Otomatis dari sistem SAP-HR]',
            tax: 'Bukan Obyek PPh',
            detail: 'Gaji pokok yang dibayarkan kepada karyawan perusahaan.',
            example: 'Pembayaran gaji pokok bulanan staf dan wiraniaga cabang'
          }
        ]
      },
      {
        code: '700.02.00.000',
        name: 'Allowance',
        accounts: [
          {
            code: '700.02.01.000',
            name: 'Placement',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan penempatan kerja karyawan di cabang/lokasi operasional.',
            example: 'Tunjangan penempatan staf mutasi cabang baru'
          },
          {
            code: '700.02.02.000',
            name: 'Operational',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan yang diberikan kepada salesman untuk keperluan operasional harian.',
            example: 'Tunjangan operasional lapangan wiraniaga showroom'
          },
          {
            code: '700.02.03.000',
            name: 'Transportation',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan transportasi rutin karyawan.',
            example: 'Tunjangan transport bulanan staf administrasi & sales'
          },
          {
            code: '700.02.04.000',
            name: 'Driver',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan supir / pengemudi operasional cabang.',
            example: 'Tunjangan pengemudi pool kendaraan operasional cabang'
          },
          {
            code: '700.02.05.000',
            name: 'Meal',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan uang makan staf dan karyawan cabang.',
            example: 'Uang makan harian staf back-office dan front-office'
          },
          {
            code: '700.02.06.000',
            name: 'Medical',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan pengobatan rawat jalan dan kacamata karyawan.',
            example: 'Reimbursement klaim kuitansi pengobatan rawat jalan staf'
          },
          {
            code: '700.02.07.000',
            name: 'Long Leave',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan cuti panjang (cuti besar) masa kerja karyawan.',
            example: 'Kompensasi tunjangan cuti panjang 5 tahunan karyawan'
          },
          {
            code: '700.02.08.000',
            name: 'Life Insurance',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan premi asuransi jiwa tenaga kerja.',
            example: 'Premi asuransi jiwa perlindungan kecelakaan kerja'
          },
          {
            code: '700.02.09.000',
            name: 'BPJS Ketenagakerjaan',
            cc: 'Opex',
            tax: '-',
            detail: 'Tunjangan JKK (Jaminan Kecelakaan Kerja) & JKM (Jaminan Kematian) yang ditanggung perusahaan.',
            example: 'Setoran iuran JKK & JKM BPJS Ketenagakerjaan cabang'
          },
          {
            code: '700.02.10.000',
            name: 'BPJS Kesehatan',
            cc: 'Opex',
            tax: '-',
            detail: 'Iuran BPJS Kesehatan karyawan yang ditanggung oleh perusahaan.',
            example: 'Setoran premi BPJS Kesehatan porsi perusahaan 4%'
          }
        ]
      }
    ]
  },
  {
    groupCode: '710',
    groupName: 'SELLING EXPENSES (SE)',
    color: 'indigo',
    subgroups: [
      {
        code: '710.01.00.000',
        name: 'Delivery & Freight Expenses',
        accounts: [
          {
            code: '710.01.01.000',
            name: 'Ekspedisi & Car Carrier Pengiriman Unit',
            cc: 'CC-740 Warehouse',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya ekspedisi car carrier pengangkutan mobil/motor baru dari pusat logistik ke showroom atau antar cabang.',
            example: 'Ongkos car carrier pengiriman 5 unit Avanza dari Pool Sunter'
          },
          {
            code: '710.01.02.000',
            name: 'Jasa Towing & Storing Kendaraan',
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya mobil derek towing unit mogok, evakuasi storing konsumen, atau pengiriman unit khusus.',
            example: 'Jasa derek towing storing darurat unit customer dari tol ke bengkel cabang'
          }
        ]
      },
      {
        code: '710.02.00.000',
        name: 'Advertising & Promotion Expenses',
        accounts: [
          {
            code: '710.02.01.000',
            name: 'Pameran & Mall Exhibition Display',
            cc: 'CC-710 Showroom',
            tax: 'PPh 4(2) / PPh 23',
            detail: 'Sewa space atrium mall, backdrop pameran, dekorasi booth display, dan kepesertaan Astra Auto Fest.',
            example: 'Sewa atrium mall pameran weekend exhibition & dekorasi booth SPK'
          },
          {
            code: '710.02.02.000',
            name: 'Media Digital & Billboard Reklame',
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Iklan digital Facebook/Google Ads, billboard jalan raya, spanduk cabang, dan media promosi cetak.',
            example: 'Iklan berbayar Meta Ads & pasang banner promosi showroom'
          },
          {
            code: '710.02.03.000',
            name: 'Brosur, Flyer, Merchandise & Souvenir SPK',
            cc: 'CC-710 Showroom',
            tax: 'Non-Objek PPh',
            detail: 'Cetak brosur spesifikasi mobil, flyer sales promo, payung souvenir SPK, pouch, dan merchandise pelanggan.',
            example: 'Cetak 2.000 lembar brosur spesifikasi unit & souvenir payung SPK'
          }
        ]
      },
      {
        code: '710.03.00.000',
        name: 'Sales Force & Test Drive Operational',
        accounts: [
          {
            code: '710.03.01.000',
            name: 'BBM, Tol & Parkir Armada Test Drive Sales',
            cc: 'CC-710 Showroom',
            tax: 'Non-Objek PPh',
            detail: 'BBM bensin/solar, kartu e-toll, dan karcis parkir operasional mobil test drive untuk calon pembeli.',
            example: 'Beli bensin Pertamax & saldo e-toll mobil test drive showroom'
          },
          {
            code: '710.03.02.000',
            name: 'Service & Pemeliharaan Mobil Sales',
            cc: 'CC-730 Workshop',
            tax: 'PPh 23 (Jasa)',
            detail: 'Ganti oli mesin, salon mobil display, cuci mobil, dan perbaikan armada operasional sales.',
            example: 'Cuci mobil display showroom & ganti oli mobil operasional sales'
          }
        ]
      },
      {
        code: '710.04.00.000',
        name: 'Commission & Incentive Expenses',
        accounts: [
          {
            code: '710.04.01.000',
            name: 'Insentif Pencapaian Target Sales Force',
            cc: 'CC-710 Showroom',
            tax: 'PPh 21',
            detail: 'Komisi dan insentif pencapaian kuota penjualan SPK/DO bulanan tim wiraniaga.',
            example: 'Bonus insentif penjualan pencapaian 15 unit DO wiraniaga'
          }
        ]
      }
    ]
  },
  {
    groupCode: '720',
    groupName: 'GENERAL & ADMINISTRATIVE (G&A)',
    color: 'blue',
    subgroups: [
      {
        code: '720.01.00.000',
        name: 'Office Stationery & Supplies',
        accounts: [
          {
            code: '720.01.01.000',
            name: 'Alat Tulis Kantor (ATK) & Form SPK',
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh',
            detail: 'Kertas HVS A4/F4, pulpen, ordner, tinta printer, form SPK standar, amplop, dan perlengkapan administrasi.',
            example: 'Beli 5 rim kertas A4, tinta printer Epson, dan ordner map finance'
          },
          {
            code: '720.01.02.000',
            name: 'Fotokopi & Penggandaan Dokumen',
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Sewa mesin fotokopi bulanan, klik sewa, dan biaya fotokopi berkas faktur BPKB leasing.',
            example: 'Biaya sewa mesin fotokopi bulanan & penggandaan berkas faktur'
          }
        ]
      },
      {
        code: '720.02.00.000',
        name: 'Utilities & Communication Expenses',
        accounts: [
          {
            code: '720.02.01.000',
            name: 'Listrik PLN Gardu Cabang & Showroom',
            cc: 'CC-720 GA',
            tax: 'PPN Bebas',
            detail: 'Tagihan listrik pascabayar PLN atau token listrik prabayar gedung showroom dan kantor cabang.',
            example: 'Bayar rekening listrik PLN ID 54120009812 bulan berjalan'
          },
          {
            code: '720.02.02.000',
            name: 'Air Bersih PDAM & Air Minum Galon',
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh',
            detail: 'Tagihan air PDAM bulanan dan pembelian isi ulang air galon (Aqua, Cleo, dll) untuk dispenser ruang tamu & staf.',
            example: 'Beli 15 galon air minum Aqua/Cleo untuk dispenser showroom & tagihan PDAM'
          },
          {
            code: '720.02.03.000',
            name: 'Internet Fiber Optic, Bandwidth & VPN',
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Langganan internet fiber optic (IndiHome/Biznet/Lintasarta), dedicated bandwidth, dan link VPN koneksi SAP ke Head Office.',
            example: 'Tagihan bulanan internet dedicated fiber optic Biznet & koneksi VPN SAP'
          }
        ]
      },
      {
        code: '720.03.00.000',
        name: 'Building & Facilities Maintenance',
        accounts: [
          {
            code: '720.03.01.000',
            name: 'Perawatan Gedung & Fasilitas Showroom',
            cc: 'CC-710 Showroom',
            tax: 'PPh 4(2) / PPh 23',
            detail: 'Pengecatan ulang, perbaikan atap bocor, penggantian lampu LED showroom, kunci pintu, dan perbaikan toilet.',
            example: 'Jasa perbaikan kebocoran kanopi & ganti lampu spotlight showroom'
          },
          {
            code: '720.03.02.000',
            name: 'Service Berkala AC Ducting Showroom',
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Cuci berkala AC cassette/split, penambahan freon R32/R410, dan perbaikan kompresor pendingin.',
            example: 'Jasa cuci berkala 8 unit AC cassette showroom & isi ulang gas freon'
          },
          {
            code: '720.03.03.000',
            name: 'Servis & Sparepart Genset Cadangan',
            cc: 'CC-720 GA',
            tax: 'PPh 23 (Jasa)',
            detail: 'Ganti oli genset diesel, ganti filter solar/oli, pemanasan berkala, aki starter, dan servis darurat genset.',
            example: 'Penggantian oli mesin & filter solar genset cadangan darurat 100 kVA'
          }
        ]
      },
      {
        code: '720.04.00.000',
        name: 'IT, Software License & Cloud',
        accounts: [
          {
            code: '720.04.01.000',
            name: 'Lisensi Sistem SAP ECC & Database',
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Alokasi biaya lisensi user SAP ECC, database Oracle/SQL, dan maintenance fee sistem core ERP Astra.',
            example: 'Alokasi biaya perpanjangan lisensi user SAP ECC cabang'
          },
          {
            code: '720.04.02.000',
            name: 'Langganan Cloud SaaS, Zoom & Security',
            cc: 'CC-720 GA',
            tax: 'PPN PMSE / PPh 23',
            detail: 'Langganan software cloud Zoom meeting, Microsoft 365, antivirus endpoint, dan sertifikat domain/SSL.',
            example: 'Perpanjangan tahunan langganan Zoom Pro & antivirus endpoint laptop staf'
          }
        ]
      },
      {
        code: '720.05.00.000',
        name: 'Outsourcing & Professional Services',
        accounts: [
          {
            code: '720.05.01.000',
            name: 'Jasa Security & Cleaning Service Cabang',
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya manajemen jasa keamanan satpam 24 jam dan tenaga kebersihan cleaning service/OB kantor cabang.',
            example: 'Tagihan bulanan invoice vendor jasa pengamanan satpam & cleaning service'
          }
        ]
      }
    ]
  }
];

// Smart Intent Keywords yang dipetakan ke Kode Akun Presisi Astra SO
const intentKeywords = [
  // 700 - EMPLOYEE COMPENSATION
  { trigger: ['gaji', 'salary', 'salaries', 'honor', 'upah'], coa: '700.01.00.000', name: '700.01.00.000 - Salaries', score: '99%' },
  { trigger: ['penempatan', 'placement', 'mutasi'], coa: '700.02.01.000', name: '700.02.01.000 - Placement Allowance', score: '97%' },
  { trigger: ['operasional sales', 'allowance operational'], coa: '700.02.02.000', name: '700.02.02.000 - Operational Allowance', score: '96%' },
  { trigger: ['transport', 'transportation', 'ongkos'], coa: '700.02.03.000', name: '700.02.03.000 - Transportation Allowance', score: '96%' },
  { trigger: ['supir', 'driver'], coa: '700.02.04.000', name: '700.02.04.000 - Driver Allowance', score: '97%' },
  { trigger: ['makan', 'meal', 'uang makan'], coa: '700.02.05.000', name: '700.02.05.000 - Meal Allowance', score: '97%' },
  { trigger: ['obat', 'medical', 'kacamata', 'pengobatan', 'rawat jalan'], coa: '700.02.06.000', name: '700.02.06.000 - Medical Allowance', score: '98%' },
  { trigger: ['cuti besar', 'cuti panjang', 'long leave'], coa: '700.02.07.000', name: '700.02.07.000 - Long Leave Allowance', score: '98%' },
  { trigger: ['asuransi jiwa', 'life insurance'], coa: '700.02.08.000', name: '700.02.08.000 - Life Insurance Allowance', score: '98%' },
  { trigger: ['bpjs ketenagakerjaan', 'jkk', 'jkm', 'jamsostek'], coa: '700.02.09.000', name: '700.02.09.000 - BPJS Ketenagakerjaan', score: '99%' },
  { trigger: ['bpjs kesehatan', 'iuran bpjs'], coa: '700.02.10.000', name: '700.02.10.000 - BPJS Kesehatan', score: '99%' },

  // 710 - SELLING EXPENSES
  { trigger: ['carrier', 'towing', 'ekspedisi', 'ongkir', 'kirim unit', 'storing', 'derek'], coa: '710.01.01.000', name: '710.01.01.000 - Car Carrier & Ekspedisi Pengiriman Unit', score: '97%' },
  { trigger: ['pameran', 'mall', 'booth', 'event', 'display', 'auto fest', 'atrium'], coa: '710.02.01.000', name: '710.02.01.000 - Pameran & Mall Exhibition Display', score: '96%' },
  { trigger: ['iklan', 'billboard', 'spanduk', 'banner', 'ads', 'reklame', 'meta ads', 'google ads'], coa: '710.02.02.000', name: '710.02.02.000 - Media Digital & Billboard Reklame', score: '95%' },
  { trigger: ['brosur', 'flyer', 'merchandise', 'souvenir', 'goodie bag', 'payung', 'gantungan'], coa: '710.02.03.000', name: '710.02.03.000 - Brosur, Flyer & Merchandise SPK', score: '96%' },
  { trigger: ['bbm', 'bensin', 'pertamax', 'tol', 'solar', 'parkir', 'test drive', 'e-toll'], coa: '710.03.01.000', name: '710.03.01.000 - BBM, Tol & Parkir Armada Test Drive', score: '98%' },
  { trigger: ['cuci mobil', 'salon mobil', 'servis mobil sales'], coa: '710.03.02.000', name: '710.03.02.000 - Service & Cuci Mobil Armada Sales', score: '95%' },
  { trigger: ['insentif', 'komisi', 'sales force', 'bonus spk'], coa: '710.04.01.000', name: '710.04.01.000 - Insentif Wiraniaga / Sales Force', score: '97%' },

  // 720 - GENERAL & ADMINISTRATIVE (G&A)
  { trigger: ['atk', 'kertas', 'pulpen', 'form spk', 'tinta', 'ordner', 'hvs', 'map'], coa: '720.01.01.000', name: '720.01.01.000 - Alat Tulis Kantor (ATK) & Form SPK', score: '98%' },
  { trigger: ['fotokopi', 'copy', 'jilid', 'cetak dokumen', 'sewa fotokopi'], coa: '720.01.02.000', name: '720.01.02.000 - Fotokopi & Penggandaan Dokumen', score: '96%' },
  { trigger: ['listrik', 'pln', 'token', 'gardu', 'kwh', 'daya'], coa: '720.02.01.000', name: '720.02.01.000 - Listrik PLN Gardu Cabang & Showroom', score: '99%' },
  { trigger: ['air', 'galon', 'pdam', 'aqua', 'minum', 'cleo', 'le minerale', 'dispenser'], coa: '720.02.02.000', name: '720.02.02.000 - Air Bersih PDAM & Air Minum Galon', score: '99%' },
  { trigger: ['wifi', 'internet', 'fiber', 'indihome', 'biznet', 'vpn', 'bandwidth'], coa: '720.02.03.000', name: '720.02.03.000 - Internet Fiber Optic, Bandwidth & VPN', score: '97%' },
  { trigger: ['gedung', 'cat', 'lampu', 'plafon', 'pintu', 'renovasi', 'bocor', 'kunci', 'toilet'], coa: '720.03.01.000', name: '720.03.01.000 - Perawatan Gedung & Fasilitas Showroom', score: '95%' },
  { trigger: ['ac', 'ducting', 'freon', 'cuci ac', 'dingin', 'cassette', 'split'], coa: '720.03.02.000', name: '720.03.02.000 - Service Berkala AC Ducting Showroom', score: '97%' },
  { trigger: ['oli', 'genset', 'generator', 'filter solar', 'aki genset'], coa: '720.03.03.000', name: '720.03.03.000 - Servis & Sparepart Genset Cadangan', score: '98%' },
  { trigger: ['sap', 'erp', 'ecc', 'oracle', 'database', 'license'], coa: '720.04.01.000', name: '720.04.01.000 - Lisensi Sistem SAP ECC & Database', score: '99%' },
  { trigger: ['zoom', 'cloud', 'antivirus', 'endpoint', 'office 365', 'google workspace', 'ssl'], coa: '720.04.02.000', name: '720.04.02.000 - Langganan Cloud SaaS, Zoom & Security', score: '96%' },
  { trigger: ['security', 'satpam', 'cleaning', 'kebersihan', 'ob', 'office boy', 'jasa jaga'], coa: '720.05.01.000', name: '720.05.01.000 - Jasa Security & Cleaning Service Cabang', score: '97%' }
];

// Attach to window namespace for compatibility
window.astraCoaDatabase = astraCoaDatabase;
window.intentKeywords = intentKeywords;
