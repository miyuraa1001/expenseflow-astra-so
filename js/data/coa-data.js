/**
 * js/data/coa-data.js
 * Master Database COA Astra SO 2021
 * 
 * CATATAN PENTING:
 * Seluruh data Master COA ditarik 100% secara DINAMIS dan REALTIME langsung dari Google Spreadsheet
 * (Database: 1wLDVXInlhwaaFr9Hs7uIN2VuPlwIkKED2G9ejFn7Tik, Tab: "COA OPEX 2021 Presisi Full").
 * Tidak ada data akun yang ditulis secara manual/statis di file ini.
 * Penambahan atau penghapusan baris di Google Spreadsheet akan langsung tersinkronisasi otomatis.
 */

// Array master awal dikosongkan (100% bergantung pada penarikan database live)
const astraCoaDatabase = [];
const astraCoaFlatDatabase = [];

// Smart Intent Keywords Triggers untuk pencarian cepat istilah transaksi operasional cabang sehari-hari
// Disesuaikan 100% dengan Database COA OPEX 2021 Presisi Full (240 Akun Realtime)
const intentKeywords = [
  // Listrik & Utilitas (BAB 720)
  { trigger: ['listrik', 'pln', 'token listrik', 'tagihan listrik', 'daya listrik', 'daya listrik showroom'], coa: '720.01.00.000', name: '720.01.00.000 - Electricity', score: '99%' },
  { trigger: ['pdam', 'tagihan air', 'pam', 'air sumur', 'air tanah', 'air pam'], coa: '720.02.00.000', name: '720.02.00.000 - Water', score: '99%' },
  { trigger: ['gas', 'lpg', 'gas elpiji', 'tabung gas'], coa: '720.03.00.000', name: '720.03.00.000 - Gas', score: '98%' },

  // Air Minum Tamu & Snack Customer Lounge (BAB 711 & 730)
  { trigger: ['air galon', 'aqua galon', 'galon', 'air minum customer', 'snack tamu', 'permen customer', 'aqua lounge', 'air minum staf'], coa: '711.12.00.000', name: '711.12.00.000 - Relations Support & Customer Service', score: '99%' },
  { trigger: ['sewa dispenser', 'dispenser'], coa: '730.99.00.000', name: '730.99.00.000 - Others (Sewa Dispenser)', score: '96%' },

  // ATK & Cetakan Kantor (BAB 722 & 728)
  { trigger: ['atk', 'kertas a4', 'pulpen', 'alat tulis', 'spk', 'map ordner', 'tinta printer', 'fotocopy', 'stationary', 'kertas', 'buku tulis', 'amplop'], coa: '722.06.00.000', name: '722.06.00.000 - Office supplies', score: '99%' },
  { trigger: ['meterai', 'materai', 'bea meterai', 'e-meterai', 'kertas segel'], coa: '728.03.00.000', name: '728.03.00.000 - Documentary Tax', score: '98%' },

  // BBM & Solar Genset (BAB 713)
  { trigger: ['bbm', 'solar genset', 'bensin', 'oli', 'bbm operasional', 'pertamax', 'pertalite', 'solar', 'genset', 'bahan bakar', 'pelumas'], coa: '713.00.00.000', name: '713.00.00.000 - Fuel & Lubricant', score: '99%' },

  // BBM Test Drive / PDI / Cuci Mobil Showroom (BAB 734)
  { trigger: ['bbm test drive', 'test drive', 'cuci mobil baru', 'semir ban', 'pdi', 'bbm showroom', 'pylox', 'kanebo', 'poles mobil', 'cuci mobil showroom'], coa: '734.00.00.000', name: '734.00.00.000 - Pre Delivery Inspection', score: '99%' },

  // Servis & Pemeliharaan Aset (AC / Gedung / Lift) (BAB 712)
  { trigger: ['cuci ac', 'servis ac', 'freon ac', 'perbaikan ac', 'jasa ac', 'perawatan ac', 'service ac', 'service genset', 'servis lift', 'perbaikan lift'], coa: '712.00.01.000', name: '712.00.01.000 - Service / Jasa (Pemeliharaan Aset)', score: '99%' },
  { trigger: ['sparepart ac', 'filter genset', 'lampu showroom', 'cat tembok', 'material perbaikan gedung', 'kabel listrik', 'konektor'], coa: '712.00.00.000', name: '712.00.00.000 - Material & Bahan / Consumable Goods', score: '98%' },

  // Komunikasi & Internet Cabang (BAB 721)
  { trigger: ['internet', 'wifi', 'biznet', 'indihome', 'telkom', 'vpn', 'leased line', 'vsat', 'ip vpn', 'data cabang'], coa: '721.05.00.000', name: '721.05.00.000 - Internet & Data Communication', score: '99%' },
  { trigger: ['telepon', 'pulsa', 'voip', 'tagihan telepon', 'pulsa sales', 'facsimile', 'fax', 'paket data'], coa: '721.99.00.000', name: '721.99.00.000 - Telecommunication', score: '98%' },

  // Pengiriman & Ekspedisi (BAB 719 & 721)
  { trigger: ['towing', 'car carrier', 'ongkir mobil', 'kirim unit', 'stnk kirim', 'bbm kirim unit', 'ekspedisi unit', 'pengiriman unit'], coa: '719.02.00.000', name: '719.02.00.000 - Shipping', score: '98%' },
  { trigger: ['kurir dokumen', 'jne', 'tiki', 'pos kilat', 'kirim berkas', 'dispatcher', 'ekspedisi spk', 'pos', 'jnt'], coa: '721.04.00.000', name: '721.04.00.000 - Dispatcher', score: '97%' },

  // Promosi & Pameran Mall (BAB 711 & 740)
  { trigger: ['pameran', 'booth mall', 'sewa stand pameran', 'bazaar', 'spg pameran', 'eo pameran', 'event showroom', 'sewa booth'], coa: '711.10.01.000', name: '711.10.01.000 - Advertising & Promotion - Service', score: '98%' },
  { trigger: ['brosur', 'leaflet', 'spanduk', 'banner showroom', 'flyer', 'katalog', 'billboard', 'dekorasi', 'banner', 'spanduk promo'], coa: '711.10.00.000', name: '711.10.00.000 - Advertising & Promotion', score: '98%' },
  { trigger: ['cashback', 'campaign marketing', 'promo cashback', 'subsidi sales'], coa: '740.08.03.000', name: '740.08.03.000 - Campaign Cashback', score: '97%' },

  // Kompensasi Karyawan & Lembur (BAB 700 & 701)
  { trigger: ['lembur', 'overtime', 'uang lembur', 'upah lembur'], coa: '700.04.00.000', name: '700.04.00.000 - Overtime (Lembur)', score: '99%' },
  { trigger: ['nasi kotak lembur', 'uang makan lembur', 'konsumsi lembur', 'snack lembur', 'makan piket', 'snack lembur cabang'], coa: '701.02.00.000', name: '701.02.00.000 - Cafetaria (Makan Lembur/Piket)', score: '98%' },
  { trigger: ['gaji', 'salary', 'gaji pokok', 'upah staf', 'salaries'], coa: '700.01.00.000', name: '700.01.00.000 - Salaries', score: '99%' },
  { trigger: ['tunjangan makan', 'meal allowance', 'uang makan'], coa: '700.02.05.000', name: '700.02.05.000 - Meal Allowance', score: '98%' },
  { trigger: ['tunjangan transport', 'transport allowance', 'ongkos transport'], coa: '700.02.03.000', name: '700.02.03.000 - Transportation Allowance', score: '97%' },
  { trigger: ['tunjangan operasional', 'insentif operasional sales'], coa: '700.02.02.000', name: '700.02.02.000 - Operational Allowance', score: '97%' },
  { trigger: ['thr', 'hari raya', 'tunjangan hari raya'], coa: '700.06.00.000', name: '700.06.00.000 - T.H.R.', score: '99%' },
  { trigger: ['bonus', 'insentif tahunan'], coa: '700.05.00.000', name: '700.05.00.000 - Bonus', score: '98%' },

  // Sewa & Gedung Cabang (BAB 730)
  { trigger: ['sewa gedung', 'sewa ruko', 'sewa kantor', 'perpanjangan sewa gedung'], coa: '730.01.00.000', name: '730.01.00.000 - Building (Sewa Gedung/Ruko)', score: '98%' },
  { trigger: ['sewa fotocopy', 'rental fotocopy', 'sewa printer', 'mesin fotocopy'], coa: '730.04.00.000', name: '730.04.00.000 - Office Equipment (Sewa Alat Kantor)', score: '98%' },

  // Keamanan & Ketertiban Cabang (BAB 732)
  { trigger: ['security', 'satpam', 'keamanan', 'iuran keamanan', 'seragam satpam', 'pos satpam'], coa: '732.00.00.000', name: '732.00.00.000 - Security', score: '98%' },

  // Kesejahteraan & Operasional Lainnya (BAB 701 & 702)
  { trigger: ['seragam', 'wearpack', 'baju kerja', 'jahit seragam', 'laundry seragam', 'baju mekanik'], coa: '702.00.00.000', name: '702.00.00.000 - Uniform', score: '98%' },
  { trigger: ['p3k', 'obat', 'klinik', 'vitamin', 'vaksin', 'kotak p3k'], coa: '701.03.01.000', name: '701.03.01.000 - First Aid Medical (P3K)', score: '98%' },
  { trigger: ['kacamata', 'reimburse kacamata', 'lensa kacamata'], coa: '701.05.00.000', name: '701.05.00.000 - Glasses/Spectacles', score: '98%' }
];

// Attach to window namespace for compatibility
window.astraCoaDatabase = astraCoaDatabase;
window.astraCoaFlatDatabase = astraCoaFlatDatabase;
window.intentKeywords = intentKeywords;
