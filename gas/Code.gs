/**
 * ExpenseFlow Astra SO 2021 - Google Apps Script Backend (kode.gs)
 * Aligned with COA Operating Expenses SO 2021 ASTRA
 *
 * Instruksi Setup:
 * 1. Buka Google Sheets baru atau spreadsheet pembukuan SO Anda.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus kode bawaan dan tempel kode ini.
 * 4. Klik Deploy > New deployment > Select type: Web app.
 * 5. Set 'Execute as': Me, dan 'Who has access': Anyone.
 * 6. Salin Web App URL dan tempelkan ke aplikasi ExpenseFlow (Menu API & Integrasi Cloud).
 */

const API_TOKEN = "astra-secret-token-2026"; // Sesuaikan dengan token di aplikasi frontend
const SHEET_NAME = "OpexLedger_SO2021";

/**
 * Endpoint POST: Menangani penambahan entri transaksi baru
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    if (postData.token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Unauthorized token" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Kolom Header sesuai database Astra SO 2021
      sheet.appendRow([
        "Timestamp",
        "ID_Transaksi",
        "Tanggal",
        "No_Ref",
        "Kode_COA",
        "Nama_Akun",
        "Kategori_COA",
        "Cost_Center",
        "Keterangan",
        "Nominal",
        "Sumber_Dana",
        "Operator"
      ]);
    }
    
    if (postData.action === "ADD_TRANSACTION") {
      const item = postData.payload;
      sheet.appendRow([
        new Date(),
        item.id,
        item.date,
        item.ref,
        item.coa,
        item.coaName,
        item.category,
        item.costCenter || "CC-720 General Admin",
        item.desc,
        item.amount,
        item.source,
        item.operator || "Operator SO"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Tercatat di Sheet Astra SO" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Aksi tidak dikenal" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint GET: Memeriksa status service dan menarik seluruh baris data transaksi
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : null;
    
    // Tarik seluruh baris data dari Google Sheet ke Frontend
    if (action === "GET_TRANSACTIONS") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "success", 
          data: [] 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "success", 
          data: [] 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const rows = [];
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[1]) {
          rows.push({
            id: String(row[1]),
            date: row[2] ? Utilities.formatDate(new Date(row[2]), "GMT+7", "yyyy-MM-dd") : "",
            ref: String(row[3] || ""),
            coa: String(row[4] || ""),
            coaName: String(row[5] || ""),
            category: String(row[6] || ""),
            costCenter: String(row[7] || ""),
            desc: String(row[8] || ""),
            amount: Number(row[9] || 0),
            source: String(row[10] || ""),
            operator: String(row[11] || ""),
            status: "POSTED"
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        data: rows 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Health check / info endpoint
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "online", 
      system: "ExpenseFlow Astra SO 2021 Backend",
      version: "2.2-Astra"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

