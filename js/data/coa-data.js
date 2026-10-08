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

// Smart Intent Keywords Triggers untuk pencarian cepat istilah transaksi operasional sehari-hari
const intentKeywords = [
  { trigger: ['gaji', 'salary', 'salaries', 'honor', 'upah'], coa: '700.01.00.000', name: '700.01.00.000 - Salaries', score: '99%' },
  { trigger: ['penempatan', 'placement', 'mutasi'], coa: '700.02.01.000', name: '700.02.01.000 - Placement Allowance', score: '97%' },
  { trigger: ['operasional sales', 'allowance operational'], coa: '700.02.02.000', name: '700.02.02.000 - Operational Allowance', score: '96%' },
  { trigger: ['transport', 'transportation', 'ongkos'], coa: '700.02.03.000', name: '700.02.03.000 - Transportation Allowance', score: '96%' },
  { trigger: ['supir', 'driver', 'pengemudi'], coa: '700.02.04.000', name: '700.02.04.000 - Driver Allowance', score: '95%' },
  { trigger: ['perumahan', 'housing', 'sewa rumah staf'], coa: '700.02.05.000', name: '700.02.05.000 - Housing Allowance', score: '96%' },
  { trigger: ['lembur', 'overtime', 'uang lembur'], coa: '700.03.00.000', name: '700.03.00.000 - Overtime', score: '99%' },
  { trigger: ['pengobatan', 'medical', 'rawat jalan', 'dokter', 'obat', 'klinik'], coa: '700.04.00.000', name: '700.04.00.000 - Medical', score: '98%' },
  { trigger: ['seragam', 'uniform', 'baju kerja', 'wearpack'], coa: '700.05.00.000', name: '700.05.00.000 - Uniform', score: '98%' },
  { trigger: ['thr', 'hari raya', 'tunjangan raya'], coa: '700.06.00.000', name: '700.06.00.000 - Religious Allowance', score: '99%' },
  { trigger: ['bonus', 'insentif tahunan'], coa: '700.07.00.000', name: '700.07.00.000 - Bonus', score: '98%' },
  { trigger: ['pesangon', 'severance', 'kompensasi phk'], coa: '700.08.00.000', name: '700.08.00.000 - Severance Allowance', score: '97%' },
  { trigger: ['pensiun', 'dplk', 'dana pensiun'], coa: '700.09.00.000', name: '700.09.00.000 - Pension Fund', score: '98%' },
  { trigger: ['jamsostek', 'bpjs tk', 'bpjs ketenagakerjaan'], coa: '700.10.00.000', name: '700.10.00.000 - Jamsostek', score: '98%' },
  { trigger: ['bpjs kesehatan', 'askes'], coa: '700.11.00.000', name: '700.11.00.000 - BPJS Kesehatan', score: '98%' },
  { trigger: ['air galon', 'aqua galon', 'air minum staf', 'air minum showroom', 'galon'], coa: '720.01.00.000', name: '720.01.00.000 - Office Supplies', score: '99%' },
  { trigger: ['pln', 'token listrik', 'tagihan listrik', 'daya listrik showroom'], coa: '720.02.00.000', name: '720.02.00.000 - Electricity', score: '99%' },
  { trigger: ['pdam', 'tagihan air', 'air kantor'], coa: '720.03.00.000', name: '720.03.00.000 - Water', score: '99%' },
  { trigger: ['internet', 'wifi', 'biznet', 'indihome', 'telkom', 'vpn'], coa: '720.04.00.000', name: '720.04.00.000 - Telecommunication', score: '99%' },
  { trigger: ['atk', 'kertas a4', 'pulpen', 'alat tulis', 'spk', 'map folder', 'tinta printer'], coa: '720.05.00.000', name: '720.05.00.000 - Stationery', score: '99%' },
  { trigger: ['cuci ac', 'servis ac', 'freon ac showroom', 'perbaikan ac'], coa: '720.06.00.000', name: '720.06.00.000 - Repair & Maintenance AC', score: '98%' },
  { trigger: ['solar genset', 'bbm genset', 'bensin genset'], coa: '720.07.00.000', name: '720.07.00.000 - Generator Fuel', score: '97%' },
  { trigger: ['bbm sales', 'bensin operasional', 'bbm test drive', 'pertamax', 'pertalite'], coa: '710.01.00.000', name: '710.01.00.000 - Vehicle Fuel', score: '98%' },
  { trigger: ['konsumsi rapat', 'snack tamu', 'nasi kotak lembur'], coa: '720.08.00.000', name: '720.08.00.000 - Refreshment & Meeting', score: '97%' },
  { trigger: ['towing', 'car carrier', 'ongkir unit', 'ekspedisi mobil'], coa: '710.02.00.000', name: '710.02.00.000 - Car Delivery & Towing', score: '98%' },
  { trigger: ['pameran', 'booth mall', 'sewa stand pameran', 'bazaar'], coa: '711.01.00.000', name: '711.01.00.000 - Exhibition & Event', score: '98%' },
  { trigger: ['brosur', 'leaflet', 'spanduk', 'banner showroom', 'flyer'], coa: '711.02.00.000', name: '711.02.00.000 - Printing & Promotion Materials', score: '98%' }
];

// Attach to window namespace for compatibility
window.astraCoaDatabase = astraCoaDatabase;
window.astraCoaFlatDatabase = astraCoaFlatDatabase;
window.intentKeywords = intentKeywords;
