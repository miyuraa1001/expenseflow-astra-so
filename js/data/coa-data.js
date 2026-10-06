/**
 * js/data/coa-data.js
 * Chart of Accounts (COA) Master Data & Smart Intent Matcher Triggers
 * Based on: COA Operating Expenses SO 2021 ASTRA International
 */

// Standard COA Master Structure according to COA_Operating_Expenses_SO_2021_ASTRA
const astraCoaDatabase = [
  {
    groupCode: '71000000',
    groupName: 'SELLING EXPENSES (SE) - BEBAN PENJUALAN',
    color: 'indigo',
    subgroups: [
      {
        code: '71100000',
        name: 'Biaya Pengiriman & Logistik Unit',
        accounts: [
          { 
            code: '71101000', 
            name: 'Ekspedisi & Car Carrier Pengiriman Unit', 
            cc: 'CC-740 Warehouse',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya jasa ekspedisi pihak ketiga atau car carrier pengiriman unit mobil/motor dari logistik pusat ke cabang atau antar cabang.',
            example: 'Jasa car carrier pengiriman 5 unit Avanza dari Pool Sunter ke Cabang'
          },
          { 
            code: '71102000', 
            name: 'Jasa Towing & Storing Kendaraan', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya mobil derek (towing) unit mogok, evakuasi storing, atau pengantaran khusus langsung ke alamat konsumen.',
            example: 'Jasa derek towing storing darurat unit customer dari tol ke bengkel cabang'
          }
        ]
      },
      {
        code: '71200000',
        name: 'Promosi, Iklan & Event Display',
        accounts: [
          { 
            code: '71201000', 
            name: 'Pameran, Mall Exhibition & Event Display', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 4(2) / PPh 23',
            detail: 'Sewa space booth mall, dekorasi pameran, backdrop event display, dan partisipasi Astra Auto Fest.',
            example: 'Sewa atrium mall pameran weekend exhibition & dekorasi booth SPK'
          },
          { 
            code: '71202000', 
            name: 'Iklan Media Digital, Cetak & Billboard', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya penayangan iklan Meta/Google Ads, billboard reklame jalan raya, koran lokal, dan spanduk promosi cabang.',
            example: 'Pasang banner promosi diskon akhir tahun & iklan berbayar Facebook Ads'
          },
          { 
            code: '71203000', 
            name: 'Brosur, Flyer, Merchandise & Souvenir SPK', 
            cc: 'CC-710 Showroom',
            tax: 'Non-Objek PPh / PPN',
            detail: 'Pencetakan brosur spesifikasi unit, flyer sales, merchandise souvenir hadiah SPK (payung, gantungan kunci, pouch).',
            example: 'Cetak 2.000 lembar brosur spesifikasi unit baru & souvenir payung SPK konsumen'
          }
        ]
      },
      {
        code: '71300000',
        name: 'Beban Armada & Sales Lapangan',
        accounts: [
          { 
            code: '71301000', 
            name: 'BBM, Tol & Parkir Armada Test Drive Sales', 
            cc: 'CC-710 Showroom',
            tax: 'Non-Objek PPh',
            detail: 'Pembelian bensin (Pertamax/Solar), pengisian saldo e-toll, dan karcis parkir untuk operasional unit test drive calon pembeli.',
            example: 'Reimburse bensin Pertamax & top-up saldo e-toll armada test drive customer'
          },
          { 
            code: '71302000', 
            name: 'Service & Pemeliharaan Mobil Sales', 
            cc: 'CC-730 Workshop',
            tax: 'PPh 23 (Jasa)',
            detail: 'Perawatan berkala, ganti oli mesin, salon mobil display, dan cuci mobil armada sales & unit display showroom.',
            example: 'Cuci mobil rutin armada showroom & service ganti oli mobil operasional sales'
          }
        ]
      },
      {
        code: '71400000',
        name: 'Komisi & Insentif Tenaga Penjual',
        accounts: [
          { 
            code: '71401000', 
            name: 'Insentif Pencapaian Target Sales Force', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 21',
            detail: 'Insentif pencapaian target volume penjualan bulanan (SPK/DO) wiraniaga dan supervisor penjualan.',
            example: 'Bonus insentif penjualan pencapaian target 15 DO sales executive bulan ini'
          }
        ]
      }
    ]
  },
  {
    groupCode: '72000000',
    groupName: 'GENERAL & ADMINISTRATIVE (G&A) - BEBAN UMUM & ADMINISTRASI',
    color: 'blue',
    subgroups: [
      {
        code: '72100000',
        name: 'Beban Ketenagakerjaan & Personalia',
        accounts: [
          { 
            code: '72101000', 
            name: 'Gaji Pokok, Tunjangan & Lembur Staf', 
            cc: 'CC-720 GA',
            tax: 'PPh 21',
            detail: 'Gaji pokok, tunjangan fungsional, dan kompensasi upah lembur resmi staf administrasi, finance, dan back-office cabang.',
            example: 'Pembayaran upah lembur staf admin finance saat closing akhir bulan'
          },
          { 
            code: '72102000', 
            name: 'BPJS Ketenagakerjaan & Kesehatan SO', 
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh',
            detail: 'Iuran jaminan sosial ketenagakerjaan (JKK, JKM, JHT, JP) dan iuran BPJS Kesehatan porsi tanggungan perusahaan.',
            example: 'Setoran bulanan iuran BPJS Ketenagakerjaan & Kesehatan cabang'
          },
          { 
            code: '72103000', 
            name: 'Konsumsi Lembur & Kesejahteraan Karyawan', 
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh',
            detail: 'Nasi kotak/snack konsumsi lembur staf, kopi/teh pantry karyawan, obat P3K, dan kegiatan kebersamaan cabang.',
            example: 'Beli makanan nasi kotak konsumsi lembur stock opname gudang & closing admin'
          }
        ]
      },
      {
        code: '72200000',
        name: 'Perlengkapan & Cetakan Kantor',
        accounts: [
          { 
            code: '72201000', 
            name: 'Alat Tulis Kantor (ATK) & Form SPK', 
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh / PPN',
            detail: 'Kertas HVS A4/F4, pulpen, map ordner, tinta printer, form SPK standar, amplop surat, dan perlengkapan meja kerja.',
            example: 'Pembelian 5 rim kertas A4, tinta printer Epson, dan binder map ordner finance'
          },
          { 
            code: '72202000', 
            name: 'Fotokopi & Penggandaan Dokumen', 
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya sewa mesin fotokopi per bulan atau ongkos fotokopi berkas faktur leasing, BPKB, dan arsip perpajakan.',
            example: 'Biaya pemakaian klik mesin sewa fotokopi & fotokopi berkas faktur BPKB'
          }
        ]
      },
      {
        code: '72300000',
        name: 'Beban Utilitas & Komunikasi',
        accounts: [
          { 
            code: '72301000', 
            name: 'Listrik PLN Gardu Cabang & Showroom', 
            cc: 'CC-720 GA',
            tax: 'PPN Bebas',
            detail: 'Tagihan listrik pascabayar PLN atau pembelian token listrik prabayar gedung showroom, workshop, dan kantor cabang.',
            example: 'Pembayaran tagihan rekening listrik PLN ID Pelanggan 54120009812 bulan berjalan'
          },
          { 
            code: '72302000', 
            name: 'Air Bersih PDAM & Air Minum Galon', 
            cc: 'CC-720 GA',
            tax: 'Non-Objek PPh',
            detail: 'Tagihan air bersih PDAM bulanan dan pembelian isi ulang air galon (Aqua, Cleo, dll) untuk dispenser ruang tamu & staf.',
            example: 'Beli 15 galon air minum Aqua/Cleo untuk dispenser showroom & tagihan PDAM'
          },
          { 
            code: '72303000', 
            name: 'Internet Fiber Optic, Bandwidth & VPN', 
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%) / PPN',
            detail: 'Langganan internet fiber optic (IndiHome/Biznet/Lintasarta), dedicated bandwidth, dan link VPN koneksi SAP ke Head Office.',
            example: 'Tagihan bulanan internet dedicated fiber optic Biznet & koneksi VPN SAP ECC'
          }
        ]
      },
      {
        code: '72400000',
        name: 'Pemeliharaan Gedung & Fasilitas',
        accounts: [
          { 
            code: '72401000', 
            name: 'Perawatan Gedung & Fasilitas Showroom', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 4(2) / PPh 23',
            detail: 'Pengecatan ulang, perbaikan plafon bocor, penggantian lampu LED showroom, kunci pintu, dan perbaikan toilet.',
            example: 'Jasa perbaikan kebocoran atap kanopi & penggantian lampu spotlight showroom'
          },
          { 
            code: '72402000', 
            name: 'Service Berkala AC Ducting Showroom', 
            cc: 'CC-710 Showroom',
            tax: 'PPh 23 (2%)',
            detail: 'Cuci berkala AC split/cassette/ducting, penambahan gas freon, dan perbaikan kompresor pendingin ruangan.',
            example: 'Jasa cuci berkala 8 unit AC cassette showroom & isi ulang gas freon R32'
          },
          { 
            code: '72403000', 
            name: 'Servis & Sparepart Genset Cadangan', 
            cc: 'CC-720 GA',
            tax: 'PPh 23 (Jasa)',
            detail: 'Ganti oli genset diesel, ganti filter solar/oli, pemanasan rutin, aki starter, dan servis darurat daya listrik cabang.',
            example: 'Penggantian oli mesin & filter solar genset cadangan darurat 100 kVA'
          }
        ]
      },
      {
        code: '72500000',
        name: 'IT, Software License & Cloud',
        accounts: [
          { 
            code: '72501000', 
            name: 'Lisensi Sistem SAP ECC & Database', 
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Alokasi biaya lisensi user SAP ECC, database Oracle/SQL, dan maintenance fee sistem core ERP Astra.',
            example: 'Alokasi biaya perpanjangan lisensi user SAP ECC cabang periode Q3'
          },
          { 
            code: '72502000', 
            name: 'Langganan Cloud SaaS, Zoom & Security', 
            cc: 'CC-720 GA',
            tax: 'PPN PMSE / PPh 23',
            detail: 'Langganan software cloud Zoom meeting, Google Workspace/Microsoft 365, antivirus endpoint, dan sertifikat SSL.',
            example: 'Perpanjangan tahunan langganan Zoom Pro & antivirus endpoint laptop staf'
          }
        ]
      },
      {
        code: '72600000',
        name: 'Jasa Outsourcing & Profesional',
        accounts: [
          { 
            code: '72601000', 
            name: 'Jasa Security & Cleaning Service Cabang', 
            cc: 'CC-720 GA',
            tax: 'PPh 23 (2%)',
            detail: 'Biaya manajemen jasa keamanan satpam 24 jam dan tenaga kebersihan cleaning service/OB kantor cabang.',
            example: 'Tagihan bulanan invoice vendor jasa pengamanan satpam & cleaning service cabang'
          }
        ]
      }
    ]
  }
];

// Smart Intent Keywords tailored to Astra SO 2021 operational expenses
const intentKeywords = [
  { trigger: ['air', 'galon', 'pdam', 'aqua', 'minum', 'cleo', 'le minerale', 'dispenser'], coa: '72302000', name: '72302000 - Air Bersih PDAM & Air Minum Galon', score: '99%' },
  { trigger: ['listrik', 'pln', 'token', 'gardu', 'kwh', 'daya'], coa: '72301000', name: '72301000 - Listrik PLN Gardu Cabang & Showroom', score: '98%' },
  { trigger: ['oli', 'genset', 'generator', 'filter solar', 'aki genset'], coa: '72403000', name: '72403000 - Servis & Sparepart Genset Cadangan', score: '97%' },
  { trigger: ['wifi', 'internet', 'fiber', 'indihome', 'biznet', 'vpn', 'bandwidth'], coa: '72303000', name: '72303000 - Internet Fiber Optic, Bandwidth & VPN', score: '95%' },
  { trigger: ['ac', 'ducting', 'freon', 'cuci ac', 'dingin', 'cassette', 'split'], coa: '72402000', name: '72402000 - Service Berkala AC Ducting Showroom', score: '96%' },
  { trigger: ['gedung', 'cat', 'lampu', 'plafon', 'pintu', 'renovasi', 'bocor', 'kunci', 'toilet'], coa: '72401000', name: '72401000 - Perawatan Gedung & Fasilitas Showroom', score: '93%' },
  { trigger: ['pameran', 'mall', 'booth', 'event', 'display', 'auto fest', 'atrium'], coa: '71201000', name: '71201000 - Pameran, Mall Exhibition & Event Display', score: '96%' },
  { trigger: ['iklan', 'billboard', 'spanduk', 'banner', 'ads', 'reklame', 'koran'], coa: '71202000', name: '71202000 - Iklan Media Digital, Cetak & Billboard', score: '92%' },
  { trigger: ['brosur', 'flyer', 'merchandise', 'souvenir', 'goodie bag', 'payung', 'gantungan'], coa: '71203000', name: '71203000 - Brosur, Flyer, Merchandise & Souvenir SPK', score: '94%' },
  { trigger: ['bbm', 'bensin', 'pertamax', 'tol', 'solar', 'parkir', 'test drive', 'e-toll'], coa: '71301000', name: '71301000 - BBM, Tol & Parkir Armada Test Drive Sales', score: '97%' },
  { trigger: ['carrier', 'towing', 'ekspedisi', 'ongkir', 'kirim unit', 'storing', 'derek'], coa: '71101000', name: '71101000 - Ekspedisi & Car Carrier Pengiriman Unit', score: '95%' },
  { trigger: ['atk', 'kertas', 'pulpen', 'form spk', 'tinta', 'ordner', 'hvs', 'map'], coa: '72201000', name: '72201000 - Alat Tulis Kantor (ATK) & Form SPK', score: '95%' },
  { trigger: ['fotokopi', 'copy', 'jilid', 'cetak berkas', 'faktur', 'bpkb'], coa: '72202000', name: '72202000 - Fotokopi & Penggandaan Dokumen', score: '94%' },
  { trigger: ['makan', 'snack', 'konsumsi', 'katering', 'lemburan', 'nasi kotak', 'kopi', 'teh'], coa: '72103000', name: '72103000 - Konsumsi Lembur & Kesejahteraan Karyawan', score: '95%' },
  { trigger: ['gaji', 'honor', 'lembur', 'staff', 'karyawan', 'upah'], coa: '72101000', name: '72101000 - Gaji Pokok, Tunjangan & Lembur Staf', score: '96%' },
  { trigger: ['bpjs', 'jamsostek', 'kesehatan', 'ketenagakerjaan'], coa: '72102000', name: '72102000 - BPJS Ketenagakerjaan & Kesehatan SO', score: '97%' },
  { trigger: ['sap', 'erp', 'ecc', 'oracle', 'database', 'license'], coa: '72501000', name: '72501000 - Lisensi Sistem SAP ECC & Database', score: '98%' },
  { trigger: ['zoom', 'cloud', 'antivirus', 'endpoint', 'office 365', 'google workspace', 'ssl'], coa: '72502000', name: '72502000 - Langganan Cloud SaaS, Zoom & Security', score: '96%' },
  { trigger: ['security', 'satpam', 'cleaning', 'kebersihan', 'ob', 'office boy', 'jasa jaga'], coa: '72601000', name: '72601000 - Jasa Security & Cleaning Service Cabang', score: '94%' }
];

// Attach to window namespace for compatibility
window.astraCoaDatabase = astraCoaDatabase;
window.intentKeywords = intentKeywords;
