/**
 * js/modules/dashboard.js
 * Dashboard KPIs, Ledger Table, Mobile Cards, Search, and Category Filtering
 */

function renderDashboard() {
  const { transactions, proposals, activeFilter, searchQuery } = window.appState;

  const filtered = transactions.filter(item => {
    const matchesFilter = activeFilter === 'ALL' || 
      item.category === activeFilter || 
      (item.category && item.category.startsWith(activeFilter)) || 
      (item.coa && item.coa.startsWith(activeFilter));
    const matchesSearch = searchQuery === '' || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery)) ||
      (item.ref && item.ref.toLowerCase().includes(searchQuery)) ||
      (item.coa && item.coa.includes(searchQuery)) ||
      (item.costCenter && item.costCenter.toLowerCase().includes(searchQuery)) ||
      (item.coaName && item.coaName.toLowerCase().includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  // Calculate KPIs
  const totalAmount = transactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const seAmount = transactions.filter(t => (t.category && t.category.startsWith('71')) || (t.coa && t.coa.startsWith('710'))).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gaAmount = transactions.filter(t => !((t.category && t.category.startsWith('71')) || (t.coa && t.coa.startsWith('710')))).reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const kpiTotalOpex = document.getElementById('kpiTotalOpex');
  const kpiSeTotal = document.getElementById('kpiSeTotal');
  const kpiGaTotal = document.getElementById('kpiGaTotal');
  const kpiTotalEntries = document.getElementById('kpiTotalEntries');

  if (kpiTotalOpex) kpiTotalOpex.textContent = formatNumber(totalAmount);
  if (kpiSeTotal) kpiSeTotal.textContent = 'Rp ' + formatNumber(seAmount);
  if (kpiGaTotal) kpiGaTotal.textContent = 'Rp ' + formatNumber(gaAmount);
  if (kpiTotalEntries) kpiTotalEntries.textContent = transactions.length;

  // Calculate progress percentages
  const budgetCap = 85000000;
  const burnPct = Math.min(100, ((totalAmount / budgetCap) * 100)).toFixed(1);
  const kpiBurnPercent = document.getElementById('kpiBurnPercent');
  const kpiProgressBar = document.getElementById('kpiProgressBar');

  if (kpiBurnPercent) kpiBurnPercent.textContent = `${burnPct}%`;
  if (kpiProgressBar) kpiProgressBar.style.width = `${burnPct}%`;

  const totalSplit = (seAmount + gaAmount) || 1;
  const sePct = Math.round((seAmount / totalSplit) * 100);
  const gaPct = Math.round((gaAmount / totalSplit) * 100);

  const kpiSeBar = document.getElementById('kpiSeBar');
  const kpiGaBar = document.getElementById('kpiGaBar');
  if (kpiSeBar) kpiSeBar.style.width = totalAmount > 0 ? `${sePct}%` : '0%';
  if (kpiGaBar) kpiGaBar.style.width = totalAmount > 0 ? `${gaPct}%` : '0%';

  // Update Pending COA Count badge
  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;
  const pendingBadge = document.getElementById('kpiPendingBadge');
  if (pendingBadge) {
    if (pendingCount > 0) {
      pendingBadge.className = 'text-xs font-mono font-bold text-amber-500 flex items-center gap-1';
      pendingBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> ${pendingCount} Pending COA`;
    } else {
      pendingBadge.className = 'text-xs font-mono font-bold text-slate-400 flex items-center gap-1';
      pendingBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 0 Pending COA`;
    }
  }

  // Render Desktop Table
  const tbody = document.getElementById('desktopTableBody');
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center">
            <div class="max-w-xs mx-auto space-y-2">
              <div class="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
              </div>
              <h4 class="font-bold text-xs text-slate-700 dark:text-slate-200">Belum Ada Transaksi Beban</h4>
              <p class="text-[11px] text-slate-400">Klik "Catat Beban" atau sinkronkan data dari spreadsheet Google Sheets.</p>
              <div class="pt-2 flex justify-center gap-2">
                <button onclick="openTransactionModal()" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm">
                  + Catat Beban Baru
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(t => `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <td class="py-3 px-4">
            <span class="font-mono text-slate-800 dark:text-slate-200 font-semibold">${t.date || '-'}</span>
            <p class="text-[10px] text-slate-400 font-mono mt-0.5">${t.ref || '-'}</p>
          </td>
          <td class="py-3 px-4">
            <span class="font-mono text-blue-600 dark:text-blue-400 font-semibold">${t.coa}</span>
            <p class="text-[11px] text-slate-700 dark:text-slate-300 font-medium">${t.coaName}</p>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-500/10 text-slate-600 dark:text-slate-300 font-medium border border-slate-500/20 whitespace-nowrap">
              ${t.costCenter || 'CC-720 General Admin'}
            </span>
          </td>
          <td class="py-3 px-4 max-w-xs truncate text-slate-800 dark:text-slate-200">
            ${t.desc}
          </td>
          <td class="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            ${t.source || 'Petty Cash'}
          </td>
          <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
            Rp ${formatNumber(t.amount)}
          </td>
          <td class="py-3 px-4 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              POSTED
            </span>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Mobile Cards
  const mobContainer = document.getElementById('mobileCardsContainer');
  if (mobContainer) {
    if (filtered.length === 0) {
      mobContainer.innerHTML = `
        <div class="p-8 text-center glass-panel rounded-2xl space-y-2">
          <div class="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100">Belum Ada Transaksi</h4>
          <p class="text-[11px] text-slate-400">Tekan tombol bulat (+) di bawah untuk mencatat transaksi beban.</p>
        </div>
      `;
    } else {
      mobContainer.innerHTML = filtered.map(t => `
        <div class="p-4 rounded-2xl glass-panel space-y-2.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-mono text-blue-600 dark:text-blue-400 font-bold">${t.coa}</span>
            <span class="font-mono text-slate-400 text-[10px]">${t.date || '-'} &bull; ${t.ref || '-'}</span>
          </div>
          <div>
            <h4 class="font-bold text-xs text-slate-900 dark:text-white">${t.coaName}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${t.desc}</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/10 text-xs">
            <span class="text-slate-400 text-[11px] font-mono">${t.costCenter || 'CC-720 GA'} &bull; ${t.source || 'Ops'}</span>
            <span class="font-mono font-bold text-sm text-slate-900 dark:text-white">Rp ${formatNumber(t.amount)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Summary footer in table
  const filteredTotal = filtered.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const countEl = document.getElementById('tableSummaryCount');
  const totalEl = document.getElementById('tableSummaryTotal');
  if (countEl) countEl.textContent = `Menampilkan ${filtered.length} transaksi`;
  if (totalEl) totalEl.textContent = `Rp ${formatNumber(filteredTotal)}`;
}

function handleSearch(val) {
  window.appState.searchQuery = val.trim().toLowerCase();
  renderDashboard();
}

function setFilter(cat, btn) {
  window.appState.activeFilter = cat;
  document.querySelectorAll('.filter-pill').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white');
    b.classList.add('glass-panel', 'text-slate-600', 'dark:text-slate-300');
  });
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('glass-panel', 'text-slate-600', 'dark:text-slate-300');
  }
  renderDashboard();
}

// Expose globally
window.renderDashboard = renderDashboard;
window.handleSearch = handleSearch;
window.setFilter = setFilter;

