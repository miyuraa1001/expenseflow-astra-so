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

function updateAccountViewStats() {
  const elCoa = document.getElementById('accStatsCoa');
  const elTx = document.getElementById('accStatsTx');
  const badge = document.getElementById('accountSyncStatusBadge');
  const url = StorageManager.getGasUrl();

  const totalCoa = (Array.isArray(window.appState.masterCoa) && window.appState.masterCoa.length > 0)
    ? window.appState.masterCoa.length
    : (window.astraCoaFlatDatabase ? window.astraCoaFlatDatabase.length : 34);

  const totalTx = Array.isArray(window.appState.transactions) ? window.appState.transactions.length : 0;

  if (elCoa) elCoa.textContent = `${totalCoa} Akun Presisi`;
  if (elTx) elTx.textContent = `${totalTx} Transaksi`;

  if (badge) {
    if (url) {
      badge.textContent = 'TERHUBUNG SPREADSHEET';
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 self-start sm:self-auto';
    } else {
      badge.textContent = 'DATABASE LOKAL';
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 self-start sm:self-auto';
    }
  }
}

function toggleGasConfigCollapsible() {
  const panel = document.getElementById('gasConfigCollapsible');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

async function fetchFromGoogleSheets(showNotification = true) {
  const url = StorageManager.getGasUrl();
  if (!url) return;

  const syncIcon = document.getElementById('syncIconSvg');
  const accSyncIcon = document.getElementById('accSyncIcon');
  const statusLabel = document.getElementById('syncStatusLabel');
  const btnAccountSync = document.getElementById('btnAccountSyncNow');

  if (syncIcon) syncIcon.classList.add('animate-spin', 'text-blue-500');
  if (accSyncIcon) accSyncIcon.classList.add('animate-spin');
  if (statusLabel) statusLabel.textContent = 'Menyinkronkan...';
  if (btnAccountSync) btnAccountSync.classList.add('opacity-75', 'pointer-events-none');

  let txSuccess = false;
  let coaSuccess = false;

  try {
    const fetchTxUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_TRANSACTIONS';
    const fetchCoaUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_MASTER_COA';

    // Eksekusi paralel untuk memangkas waktu loading 50%
    const [resTxSettled, resCoaSettled] = await Promise.allSettled([
      fetch(fetchTxUrl).then(r => r.json()),
      fetch(fetchCoaUrl).then(r => r.json())
    ]);

    // 1. Proses Data Transaksi
    if (resTxSettled.status === 'fulfilled' && resTxSettled.value && resTxSettled.value.status === 'success' && Array.isArray(resTxSettled.value.data)) {
      window.appState.transactions = resTxSettled.value.data;
      StorageManager.saveTransactions(window.appState.transactions);
      renderDashboard();
      txSuccess = true;
    }

    // 2. Proses Data Master COA
    if (resCoaSettled.status === 'fulfilled' && resCoaSettled.value && resCoaSettled.value.status === 'success' && Array.isArray(resCoaSettled.value.data) && resCoaSettled.value.data.length > 0) {
      StorageManager.saveMasterCoa(resCoaSettled.value.data);
      if (typeof updateCoaFromData === 'function') {
        updateCoaFromData(resCoaSettled.value.data, resCoaSettled.value.tree || null);
      }
      coaSuccess = true;
    }

    const dot = document.getElementById('sidebarSyncDot');
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    if (statusLabel) statusLabel.textContent = 'Tersinkron';

    updateAccountViewStats();

    if (showNotification) {
      if (txSuccess && coaSuccess) {
        showToast(`Sinkronisasi sukses: ${window.appState.transactions.length} transaksi & seluruh akun COA termuat lengkap!`, 'success');
      } else if (txSuccess) {
        showToast(`Berhasil memuat ${window.appState.transactions.length} transaksi dari Google Sheets!`, 'success');
      } else if (coaSuccess) {
        showToast('Berhasil memuat data Master COA dari Google Sheets!', 'success');
      } else {
        showToast('Respons diterima dari backend Google Sheets.', 'info');
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
    if (accSyncIcon) accSyncIcon.classList.remove('animate-spin');
    if (btnAccountSync) btnAccountSync.classList.remove('opacity-75', 'pointer-events-none');
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
    showToast('Silakan masukkan URL Google Apps Script di menu Akun', 'info');
    switchView('account');
    const panel = document.getElementById('gasConfigCollapsible');
    if (panel) panel.classList.remove('hidden');
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
window.updateAccountViewStats = updateAccountViewStats;
window.toggleGasConfigCollapsible = toggleGasConfigCollapsible;

