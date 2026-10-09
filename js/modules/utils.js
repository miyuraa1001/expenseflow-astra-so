/**
 * js/modules/utils.js
 * Formatting, Theme Controller, Toast Notifications, and CSV Export
 */

/**
 * Format a number to IDR standard string (e.g. 1.250.000)
 */
function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

/**
 * Displays specular glass animated toast notification
 * @param {string} msg 
 * @param {'success'|'error'|'info'} type 
 */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/80',
    error: 'border-rose-500/40 text-rose-400 bg-rose-950/80',
    info: 'border-blue-500/40 text-blue-400 bg-blue-950/80'
  };

  toast.className = `p-3 rounded-xl glass-panel border ${colors[type] || colors.info} text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all transform duration-300 opacity-0 translate-y-2 pointer-events-auto`;
  toast.innerHTML = `
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Set theme explicitly to 'dark' or 'light'
 */
function setAppTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    StorageManager.setTheme('light');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    StorageManager.setTheme('dark');
  }
  updateThemeUi();
}

/**
 * Update visual active indicators on theme cards
 */
function updateThemeUi() {
  const isDark = document.documentElement.classList.contains('dark');
  const cardLight = document.getElementById('themeCardLight');
  const cardDark = document.getElementById('themeCardDark');
  const dotLight = document.getElementById('themeIndicatorLight');
  const dotDark = document.getElementById('themeIndicatorDark');

  if (cardLight && cardDark) {
    if (isDark) {
      cardDark.className = 'p-4 rounded-2xl border-2 border-blue-500 bg-blue-500/10 text-left transition-all flex items-center justify-between shadow-sm';
      cardLight.className = 'p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 text-left transition-all flex items-center justify-between hover:border-blue-500/50';
      if (dotDark) dotDark.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-500"></span>';
      if (dotLight) dotLight.innerHTML = '<span class="w-2 h-2 rounded-full bg-transparent"></span>';
    } else {
      cardLight.className = 'p-4 rounded-2xl border-2 border-blue-500 bg-blue-500/10 text-left transition-all flex items-center justify-between shadow-sm';
      cardDark.className = 'p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 text-left transition-all flex items-center justify-between hover:border-blue-500/50';
      if (dotLight) dotLight.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-500"></span>';
      if (dotDark) dotDark.innerHTML = '<span class="w-2 h-2 rounded-full bg-transparent"></span>';
    }
  }
}

/**
 * Initialize theme based on LocalStorage or default dark mode
 */
function initTheme() {
  const isLight = StorageManager.getTheme() === 'light';
  if (isLight) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
  updateThemeUi();
}

/**
 * Toggle between Dark and Light mode
 */
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  setAppTheme(isDark ? 'light' : 'dark');
}

/**
 * Export current transactions list to CSV file conforming to Astra SO Ledger schema
 */
function exportToCsv() {
  const txList = window.appState.transactions;
  if (!txList || txList.length === 0) {
    showToast('Tidak ada transaksi untuk diekspor', 'info');
    return;
  }

  let csv = 'ID_Transaksi,Tanggal,No_Ref,Kode_COA,Nama_Akun,Cost_Center,Keterangan,Nominal,Sumber_Dana,Status\n';
  txList.forEach(t => {
    csv += `"${t.id || ''}","${t.date || ''}","${t.ref || ''}","${t.coa || ''}","${(t.coaName || '').replace(/"/g, '""')}","${t.costCenter || 'CC-720 GA'}","${(t.desc || '').replace(/"/g, '""')}","${t.amount || 0}","${t.source || ''}","${t.status || 'POSTED'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ExpenseFlow_AstraSO_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('File CSV berhasil diunduh', 'success');
}

/**
 * Reset local storage cache safely without affecting Google Sheets
 */
function resetLocalCache() {
  if (confirm('Bersihkan cache lokal transaksi dan COA di browser ini? Data di Google Spreadsheet tidak akan terhapus.')) {
    localStorage.removeItem('astra_expenseflow_transactions');
    localStorage.removeItem('astra_master_coa_cache');
    showToast('Cache lokal berhasil dibersihkan. Memuat ulang aplikasi...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }
}

// Expose to window for global access
window.formatNumber = formatNumber;
window.showToast = showToast;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.setAppTheme = setAppTheme;
window.updateThemeUi = updateThemeUi;
window.exportToCsv = exportToCsv;
window.resetLocalCache = resetLocalCache;



