/**
 * js/modules/api.js
 * Google Apps Script (GAS) Cloud Integration & Two-Way Sync
 */

function saveGasConfig() {
  const url = document.getElementById('cfgGasUrl').value.trim();
  const token = document.getElementById('cfgApiToken').value.trim();
  
  StorageManager.setGasUrl(url);
  StorageManager.setApiToken(token);
  showToast('Konfigurasi API Google Sheets disimpan!', 'success');
  
  if (url) {
    fetchFromGoogleSheets(true);
  }
}

async function testGasConnection() {
  const url = document.getElementById('cfgGasUrl').value.trim();
  if (!url) {
    showToast('Masukkan URL Apps Script terlebih dahulu', 'error');
    return;
  }
  showToast('Menguji koneksi ke Google Apps Script...', 'info');

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'online') {
      showToast(`Koneksi Sukses! Backend Astra SO online (v${data.version || '2.2'}).`, 'success');
      const dot = document.getElementById('sidebarSyncDot');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    } else {
      showToast('Backend merespons namun format berbeda.', 'info');
    }
  } catch (err) {
    showToast('Koneksi gagal. Pastikan deploy Web App: Anyone.', 'error');
  }
}

async function fetchFromGoogleSheets(showNotification = true) {
  const url = StorageManager.getGasUrl();
  if (!url) return;

  const syncIcon = document.getElementById('syncIconSvg');
  const statusLabel = document.getElementById('syncStatusLabel');
  if (syncIcon) syncIcon.classList.add('animate-spin', 'text-blue-500');
  if (statusLabel) statusLabel.textContent = 'Menyinkronkan...';

  let txSuccess = false;
  let coaSuccess = false;

  try {
    // 1. Tarik Data Transaksi Beban
    try {
      const fetchTxUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_TRANSACTIONS';
      const resTx = await fetch(fetchTxUrl);
      const jsonTx = await resTx.json();

      if (jsonTx.status === 'success' && Array.isArray(jsonTx.data)) {
        window.appState.transactions = jsonTx.data;
        StorageManager.saveTransactions(window.appState.transactions);
        renderDashboard();
        txSuccess = true;
      }
    } catch (eTx) {
      console.warn('Gagal menarik transaksi:', eTx);
    }

    // 2. Tarik Master Data COA Database
    try {
      const fetchCoaUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_MASTER_COA';
      const resCoa = await fetch(fetchCoaUrl);
      const jsonCoa = await resCoa.json();

      if (jsonCoa.status === 'success' && Array.isArray(jsonCoa.data) && jsonCoa.data.length > 0) {
        StorageManager.saveMasterCoa(jsonCoa.data);
        if (typeof updateCoaFromData === 'function') {
          updateCoaFromData(jsonCoa.data, jsonCoa.tree || null);
        }
        coaSuccess = true;
      }
    } catch (eCoa) {
      console.warn('Gagal menarik master COA:', eCoa);
    }

    const dot = document.getElementById('sidebarSyncDot');
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    if (statusLabel) statusLabel.textContent = 'Tersinkron';

    if (showNotification) {
      if (txSuccess && coaSuccess) {
        showToast(`Sinkronisasi sukses: ${window.appState.transactions.length} transaksi & seluruh akun COA berhasil dimuat!`, 'success');
      } else if (txSuccess) {
        showToast(`Berhasil memuat ${window.appState.transactions.length} transaksi dari Google Sheets!`, 'success');
      } else if (coaSuccess) {
        showToast('Berhasil memuat data Master COA dari Google Sheets!', 'success');
      }
    }
  } catch (err) {
    console.warn('Sync read error:', err);
    if (statusLabel) statusLabel.textContent = 'Tersimpan Lokal';
    if (showNotification) {
      showToast('Gagal menarik data dari Google Sheets. Menampilkan cache lokal.', 'info');
    }
  } finally {
    if (syncIcon) syncIcon.classList.remove('animate-spin');
  }
}

async function syncToGoogleSheets(item) {
  const url = StorageManager.getGasUrl();
  const token = StorageManager.getApiToken();
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        token,
        action: 'ADD_TRANSACTION',
        payload: item
      })
    });
    showToast('Tercatat di Google Sheets Astra SO!', 'success');
    const dot = document.getElementById('sidebarSyncDot');
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
  } catch (e) {
    console.warn('Sync background pending:', e);
  }
}

function triggerManualSync() {
  const url = StorageManager.getGasUrl();
  if (!url) {
    showToast('URL Google Apps Script belum diisi di menu Akun & API', 'info');
    switchView('account');
    return;
  }
  fetchFromGoogleSheets(true);
}

// Expose globally
window.saveGasConfig = saveGasConfig;
window.testGasConnection = testGasConnection;
window.fetchFromGoogleSheets = fetchFromGoogleSheets;
window.syncToGoogleSheets = syncToGoogleSheets;
window.triggerManualSync = triggerManualSync;
