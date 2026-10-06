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
}

/**
 * Toggle between Dark and Light mode
 */
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    StorageManager.setTheme('light');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    StorageManager.setTheme('dark');
  }
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

// Expose to window for global access
window.formatNumber = formatNumber;
window.showToast = showToast;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.exportToCsv = exportToCsv;

