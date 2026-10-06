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
          { code: '71101000', name: 'Ekspedisi & Car Carrier Pengiriman Unit', cc: 'CC-740 Warehouse' },
          { code: '71102000', name: 'Jasa Towing & Storing Kendaraan', cc: 'CC-710 Showroom' }
        ]
      },
      {
        code: '71200000',
        name: 'Promosi, Iklan & Event Display',
        accounts: [
          { code: '71201000', name: 'Pameran, Mall Exhibition & Event Display', cc: 'CC-710 Showroom' },
          { code: '71202000', name: 'Iklan Media Digital, Cetak & Billboard', cc: 'CC-710 Showroom' },
          { code: '71203000', name: 'Brosur, Flyer, Merchandise & Souvenir SPK', cc: 'CC-710 Showroom' }
        ]
      },
      {
        code: '71300000',
        name: 'Beban Armada & Sales Lapangan',
        accounts: [
          { code: '71301000', name: 'BBM, Tol & Parkir Armada Test Drive Sales', cc: 'CC-710 Showroom' },
          { code: '71302000', name: 'Service & Pemeliharaan Mobil Sales', cc: 'CC-730 Workshop' }
        ]
      },
      {
        code: '71400000',
        name: 'Komisi & Insentif Tenaga Penjual',
        accounts: [
          { code: '71401000', name: 'Insentif Pencapaian Target Sales Force', cc: 'CC-710 Showroom' }
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
          { code: '72101000', name: 'Gaji Pokok, Tunjangan & Lembur Staf', cc: 'CC-720 GA' },
          { code: '72102000', name: 'BPJS Ketenagakerjaan & Kesehatan SO', cc: 'CC-720 GA' },
          { code: '72103000', name: 'Konsumsi Lembur & Kesejahteraan Karyawan', cc: 'CC-720 GA' }
        ]
      },
      {
        code: '72200000',
        name: 'Perlengkapan & Cetakan Kantor',
        accounts: [
          { code: '72201000', name: 'Alat Tulis Kantor (ATK) & Form SPK', cc: 'CC-720 GA' },
          { code: '72202000', name: 'Fotokopi & Penggandaan Dokumen', cc: 'CC-720 GA' }
        ]
      },
      {
        code: '72300000',
        name: 'Beban Utilitas & Komunikasi',
        accounts: [
          { code: '72301000', name: 'Listrik PLN Gardu Cabang & Showroom', cc: 'CC-720 GA' },
          { code: '72302000', name: 'Air Bersih PDAM & Air Minum Galon', cc: 'CC-720 GA' },
          { code: '72303000', name: 'Internet Fiber Optic, Bandwidth & VPN', cc: 'CC-720 GA' }
        ]
      },
      {
        code: '72400000',
        name: 'Pemeliharaan Gedung & Fasilitas',
        accounts: [
          { code: '72401000', name: 'Perawatan Gedung & Fasilitas Showroom', cc: 'CC-710 Showroom' },
          { code: '72402000', name: 'Service Berkala AC Ducting Showroom', cc: 'CC-710 Showroom' },
          { code: '72403000', name: 'Servis & Sparepart Genset Cadangan', cc: 'CC-720 GA' }
        ]
      },
      {
        code: '72500000',
        name: 'IT, Software License & Cloud',
        accounts: [
          { code: '72501000', name: 'Lisensi Sistem SAP ECC & Database', cc: 'CC-720 GA' },
          { code: '72502000', name: 'Langganan Cloud SaaS, Zoom & Security', cc: 'CC-720 GA' }
        ]
      },
      {
        code: '72600000',
        name: 'Jasa Outsourcing & Profesional',
        accounts: [
          { code: '72601000', name: 'Jasa Security & Cleaning Service Cabang', cc: 'CC-720 GA' }
        ]
      }
    ]
  }
];

// Smart Intent Keywords tailored to Astra SO 2021 operational expenses
const intentKeywords = [
  { trigger: ['oli', 'genset', 'mesin', 'filter solar', 'generator'], coa: '72403000', name: '72403000 - Servis & Sparepart Genset Cadangan', score: '97%' },
  { trigger: ['listrik', 'pln', 'token', 'gardu', 'kwh'], coa: '72301000', name: '72301000 - Listrik PLN Gardu Cabang & Showroom', score: '98%' },
  { trigger: ['wifi', 'internet', 'fiber', 'indihome', 'biznet', 'vpn', 'bandwidth'], coa: '72303000', name: '72303000 - Internet Fiber Optic, Bandwidth & VPN', score: '95%' },
  { trigger: ['ac', 'ducting', 'freon', 'cuci ac', 'dingin'], coa: '72402000', name: '72402000 - Service Berkala AC Ducting Showroom', score: '94%' },
  { trigger: ['gedung', 'cat', 'lampu', 'plafon', 'pintu', 'renovasi'], coa: '72401000', name: '72401000 - Perawatan Gedung & Fasilitas Showroom', score: '93%' },
  { trigger: ['pameran', 'mall', 'booth', 'event', 'display', 'auto fest'], coa: '71201000', name: '71201000 - Pameran, Mall Exhibition & Event Display', score: '96%' },
  { trigger: ['iklan', 'billboard', 'spanduk', 'banner', 'ads'], coa: '71202000', name: '71202000 - Iklan Media Digital, Cetak & Billboard', score: '92%' },
  { trigger: ['brosur', 'flyer', 'merchandise', 'souvenir', 'goodie bag'], coa: '71203000', name: '71203000 - Brosur, Flyer, Merchandise & Souvenir SPK', score: '94%' },
  { trigger: ['bbm', 'bensin', 'pertamax', 'tol', 'solar', 'parkir', 'test drive'], coa: '71301000', name: '71301000 - BBM, Tol & Parkir Armada Test Drive Sales', score: '97%' },
  { trigger: ['carrier', 'towing', 'ekspedisi', 'ongkir', 'kirim unit', 'storing'], coa: '71101000', name: '71101000 - Ekspedisi & Car Carrier Pengiriman Unit', score: '95%' },
  { trigger: ['atk', 'kertas', 'pulpen', 'form spk', 'tinta'], coa: '72201000', name: '72201000 - Alat Tulis Kantor (ATK) & Form SPK', score: '94%' },
  { trigger: ['sap', 'erp', 'ecc', 'oracle', 'database', 'license'], coa: '72501000', name: '72501000 - Lisensi Sistem SAP ECC & Database', score: '98%' },
  { trigger: ['security', 'satpam', 'cleaning', 'kebersihan', 'ob'], coa: '72601000', name: '72601000 - Jasa Security & Cleaning Service Cabang', score: '93%' }
];

// Attach to window namespace for compatibility
window.astraCoaDatabase = astraCoaDatabase;
window.intentKeywords = intentKeywords;

