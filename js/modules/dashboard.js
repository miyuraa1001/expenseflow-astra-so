/**
 * js/modules/dashboard.js
 * ExpenseFlow Astra SO 2021 — Option 2: Executive Analytics Dashboard
 * 4 Balanced KPIs, SVG Donut Breakdown (BAB 700, 710, 720), Top 5 Expenses, Quick Shortcuts, Period Filter & Ledger
 */

// Quick expense pre-fill templates for showroom & branch operations
// Disesuaikan 100% dengan Database COA OPEX 2021 Presisi Full (Spreadsheet Realtime)
const EXPENSE_TEMPLATES = {
  galon: {
    coa: '711.12.00.000',
    coaName: 'Relations Support & Customer Service (Air Galon Lounge)',
    costCenter: 'CC-711 Selling Area',
    desc: 'Pengadaan air minum mineral galon & snack customer lounge showroom',
    source: 'Petty Cash',
    defaultAmount: 55000
  },
  listrik: {
    coa: '720.01.00.000',
    coaName: 'Electricity (Listrik PLN Operasional Cabang)',
    costCenter: 'CC-720 General Admin',
    desc: 'Pembelian token / rekening listrik PLN operasional cabang & showroom',
    source: 'Petty Cash',
    defaultAmount: 250000
  },
  ac: {
    coa: '712.00.01.000',
    coaName: 'Service / Jasa (Pemeliharaan & Cuci AC Showroom)',
    costCenter: 'CC-720 General Admin',
    desc: 'Jasa perawatan berkala cuci & servis AC showroom ruang pamer',
    source: 'Petty Cash',
    defaultAmount: 350000
  },
  bbm: {
    coa: '713.00.00.000',
    coaName: 'Fuel & Lubricant (BBM Armada Operasional & Genset)',
    costCenter: 'CC-713 Operations',
    desc: 'Pembelian BBM armada operasional / solar genset kantor cabang',
    source: 'Petty Cash',
    defaultAmount: 150000
  },
  lembur: {
    coa: '701.02.00.000',
    coaName: 'Cafetaria (Konsumsi Makan Lembur / Piket Cabang)',
    costCenter: 'CC-701 Welfare',
    desc: 'Penggantian uang makan & konsumsi lembur penutupan buku closing cabang',
    source: 'Petty Cash',
    defaultAmount: 120000
  },
  atk: {
    coa: '722.06.00.000',
    coaName: 'Office supplies (ATK, Kertas A4 & Form SPK)',
    costCenter: 'CC-722 General Admin',
    desc: 'Pengadaan kertas A4, tinta printer, map ordner & form SPK administrasi',
    source: 'Petty Cash',
    defaultAmount: 85000
  }
};

/**
 * Filter helper for time periods ('ALL', 'MONTH', 'WEEK', 'TODAY')
 */
function matchesPeriod(dateStr, period) {
  if (!period || period === 'ALL') return true;
  if (!dateStr) return false;

  const txDate = new Date(dateStr);
  if (isNaN(txDate.getTime())) return true;

  const now = new Date();
  const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'TODAY') {
    return txDay.getTime() === today.getTime();
  }
  if (period === 'WEEK') {
    const diffMs = today.getTime() - txDay.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }
  if (period === 'MONTH') {
    return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  }
  return true;
}

/**
 * Main render function for Executive Analytics Dashboard
 */
function renderDashboard() {
  const { transactions = [], proposals = [], activeFilter = 'ALL', periodFilter = 'ALL', searchQuery = '' } = window.appState;

  // 1. Transactions filtered by selected Period for Executive KPIs & Analytics
  const periodFilteredTxs = transactions.filter(item => matchesPeriod(item.date, periodFilter));

  // 2. Transactions further filtered by Category BAB & Search Query for Ledger Table
  const tableFiltered = periodFilteredTxs.filter(item => {
    const matchesCat = activeFilter === 'ALL' || 
      item.category === activeFilter || 
      (item.category && item.category.startsWith(activeFilter)) || 
      (item.coa && item.coa.startsWith(activeFilter));

    const matchesSearch = searchQuery === '' || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery)) ||
      (item.ref && item.ref.toLowerCase().includes(searchQuery)) ||
      (item.coa && item.coa.includes(searchQuery)) ||
      (item.costCenter && item.costCenter.toLowerCase().includes(searchQuery)) ||
      (item.coaName && item.coaName.toLowerCase().includes(searchQuery));

    return matchesCat && matchesSearch;
  });

  // ==========================================
  // KPI 1: Total Realisasi Opex vs Plafon Rp 85M
  // ==========================================
  const totalAmount = periodFilteredTxs.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const budgetCap = 85000000; // Plafon Rp 85.000.000 (Rp 85,0M)
  const remainingBudget = Math.max(0, budgetCap - totalAmount);
  const burnPct = Math.min(100, ((totalAmount / budgetCap) * 100)).toFixed(1);

  const kpiTotalOpex = document.getElementById('kpiTotalOpex');
  const kpiBurnPercent = document.getElementById('kpiBurnPercent');
  const kpiProgressBar = document.getElementById('kpiProgressBar');
  const kpiRemainingBudget = document.getElementById('kpiRemainingBudget');
  const kpiBurnStatus = document.getElementById('kpiBurnStatus');

  if (kpiTotalOpex) kpiTotalOpex.textContent = formatNumber(totalAmount);
  if (kpiBurnPercent) kpiBurnPercent.textContent = `${burnPct}%`;
  if (kpiProgressBar) {
    kpiProgressBar.style.width = `${burnPct}%`;
    if (burnPct >= 90) {
      kpiProgressBar.className = 'bg-rose-500 h-full rounded-full transition-all duration-500';
    } else if (burnPct >= 70) {
      kpiProgressBar.className = 'bg-amber-500 h-full rounded-full transition-all duration-500';
    } else {
      kpiProgressBar.className = 'bg-blue-600 h-full rounded-full transition-all duration-500';
    }
  }
  if (kpiRemainingBudget) kpiRemainingBudget.textContent = 'Rp ' + formatNumber(remainingBudget);
  if (kpiBurnStatus) {
    if (burnPct >= 90) {
      kpiBurnStatus.textContent = 'Mendekati Limit';
      kpiBurnStatus.className = 'text-rose-500 font-bold';
    } else if (burnPct >= 70) {
      kpiBurnStatus.textContent = 'Perhatian';
      kpiBurnStatus.className = 'text-amber-500 font-semibold';
    } else {
      kpiBurnStatus.textContent = 'Aman';
      kpiBurnStatus.className = 'text-emerald-500 font-semibold';
    }
  }

  // ==========================================
  // KPI 2: Komparasi SE vs G&A
  // ==========================================
  const seTxs = periodFilteredTxs.filter(t => (t.category && t.category.startsWith('71')) || (t.coa && t.coa.startsWith('710')));
  const gaTxs = periodFilteredTxs.filter(t => !((t.category && t.category.startsWith('71')) || (t.coa && t.coa.startsWith('710'))));
  const seAmount = seTxs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const gaAmount = gaTxs.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const totalSplit = (seAmount + gaAmount) || 1;
  const sePct = totalAmount > 0 ? Math.round((seAmount / totalSplit) * 100) : 0;
  const gaPct = totalAmount > 0 ? Math.round((gaAmount / totalSplit) * 100) : 0;

  const kpiSeTotal = document.getElementById('kpiSeTotal');
  const kpiGaTotal = document.getElementById('kpiGaTotal');
  const kpiSePercent = document.getElementById('kpiSePercent');
  const kpiGaPercent = document.getElementById('kpiGaPercent');
  const kpiSeBar = document.getElementById('kpiSeBar');
  const kpiGaBar = document.getElementById('kpiGaBar');

  if (kpiSeTotal) kpiSeTotal.textContent = 'Rp ' + formatNumber(seAmount);
  if (kpiGaTotal) kpiGaTotal.textContent = 'Rp ' + formatNumber(gaAmount);
  if (kpiSePercent) kpiSePercent.textContent = `(${sePct}%)`;
  if (kpiGaPercent) kpiGaPercent.textContent = `(${gaPct}%)`;
  if (kpiSeBar) kpiSeBar.style.width = totalAmount > 0 ? `${sePct}%` : '0%';
  if (kpiGaBar) kpiGaBar.style.width = totalAmount > 0 ? `${gaPct}%` : '0%';

  // ==========================================
  // KPI 3: Kas Operasional (Petty Cash vs Bank)
  // ==========================================
  const pettyTxs = periodFilteredTxs.filter(t => {
    const src = (t.source || '').toLowerCase();
    return src.includes('petty') || src.includes('kas');
  });
  const bankTxs = periodFilteredTxs.filter(t => {
    const src = (t.source || '').toLowerCase();
    return src.includes('bank') || src.includes('transfer') || src.includes('kliring');
  });

  const pettyTotal = pettyTxs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const bankTotal = bankTxs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const cashSplit = (pettyTotal + bankTotal) || 1;
  const pettyPct = (pettyTotal + bankTotal) > 0 ? Math.round((pettyTotal / cashSplit) * 100) : 0;
  const bankPct = (pettyTotal + bankTotal) > 0 ? Math.round((bankTotal / cashSplit) * 100) : 0;

  const kpiPettyTotal = document.getElementById('kpiPettyTotal');
  const kpiPettyCount = document.getElementById('kpiPettyCount');
  const kpiBankTotal = document.getElementById('kpiBankTotal');
  const kpiBankCount = document.getElementById('kpiBankCount');
  const kpiPettyBar = document.getElementById('kpiPettyBar');
  const kpiBankBar = document.getElementById('kpiBankBar');

  if (kpiPettyTotal) kpiPettyTotal.textContent = 'Rp ' + formatNumber(pettyTotal);
  if (kpiPettyCount) kpiPettyCount.textContent = `(${pettyTxs.length})`;
  if (kpiBankTotal) kpiBankTotal.textContent = 'Rp ' + formatNumber(bankTotal);
  if (kpiBankCount) kpiBankCount.textContent = `(${bankTxs.length})`;
  if (kpiPettyBar) kpiPettyBar.style.width = (pettyTotal + bankTotal) > 0 ? `${pettyPct}%` : '0%';
  if (kpiBankBar) kpiBankBar.style.width = (pettyTotal + bankTotal) > 0 ? `${bankPct}%` : '0%';

  // ==========================================
  // KPI 4: Tata Kelola & Otorisasi Dual-Control
  // ==========================================
  const kpiTotalEntries = document.getElementById('kpiTotalEntries');
  if (kpiTotalEntries) kpiTotalEntries.textContent = periodFilteredTxs.length;

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

  // ==========================================
  // Middle Widget 1: SVG Donut Chart & BAB Breakdown
  // ==========================================
  const bab700Txs = periodFilteredTxs.filter(t => (t.coa && t.coa.startsWith('700')) || (t.category && t.category.startsWith('700')));
  const bab710Txs = periodFilteredTxs.filter(t => (t.coa && t.coa.startsWith('710')) || (t.category && t.category.startsWith('710')));
  const bab720Txs = periodFilteredTxs.filter(t => !((t.coa && (t.coa.startsWith('700') || t.coa.startsWith('710'))) || (t.category && (t.category.startsWith('700') || t.category.startsWith('710')))));

  const bab700Amount = bab700Txs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const bab710Amount = bab710Txs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const bab720Amount = bab720Txs.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  // Circumference for r=40 is 2 * PI * 40 = 251.327
  const C = 251.327;
  const donutBab700 = document.getElementById('donutBab700');
  const donutBab710 = document.getElementById('donutBab710');
  const donutBab720 = document.getElementById('donutBab720');
  const donutCenterTotal = document.getElementById('donutCenterTotal');

  if (totalAmount > 0) {
    const pct700 = bab700Amount / totalAmount;
    const pct710 = bab710Amount / totalAmount;
    const pct720 = bab720Amount / totalAmount;

    const len700 = pct700 * C;
    const len710 = pct710 * C;
    const len720 = pct720 * C;

    if (donutBab700) {
      donutBab700.setAttribute('stroke-dasharray', `${len700.toFixed(2)} ${(C - len700).toFixed(2)}`);
      donutBab700.setAttribute('stroke-dashoffset', '0');
    }
    if (donutBab710) {
      donutBab710.setAttribute('stroke-dasharray', `${len710.toFixed(2)} ${(C - len710).toFixed(2)}`);
      donutBab710.setAttribute('stroke-dashoffset', `-${len700.toFixed(2)}`);
    }
    if (donutBab720) {
      donutBab720.setAttribute('stroke-dasharray', `${len720.toFixed(2)} ${(C - len720).toFixed(2)}`);
      donutBab720.setAttribute('stroke-dashoffset', `-${(len700 + len710).toFixed(2)}`);
    }
    if (donutCenterTotal) {
      donutCenterTotal.textContent = 'Rp ' + formatNumber(totalAmount);
    }
  } else {
    if (donutBab700) donutBab700.setAttribute('stroke-dasharray', `0 ${C}`);
    if (donutBab710) donutBab710.setAttribute('stroke-dasharray', `0 ${C}`);
    if (donutBab720) donutBab720.setAttribute('stroke-dasharray', `0 ${C}`);
    if (donutCenterTotal) donutCenterTotal.textContent = 'Rp 0';
  }

  // Update Legend Labels & Bars
  const p700Text = totalAmount > 0 ? ((bab700Amount / totalAmount) * 100).toFixed(1) + '%' : '0%';
  const p710Text = totalAmount > 0 ? ((bab710Amount / totalAmount) * 100).toFixed(1) + '%' : '0%';
  const p720Text = totalAmount > 0 ? ((bab720Amount / totalAmount) * 100).toFixed(1) + '%' : '0%';

  const elLeg700Tot = document.getElementById('legendBab700Total');
  const elLeg700Pct = document.getElementById('legendBab700Pct');
  const elLeg700Bar = document.getElementById('legendBab700Bar');
  if (elLeg700Tot) elLeg700Tot.textContent = 'Rp ' + formatNumber(bab700Amount);
  if (elLeg700Pct) elLeg700Pct.textContent = p700Text;
  if (elLeg700Bar) elLeg700Bar.style.width = p700Text;

  const elLeg710Tot = document.getElementById('legendBab710Total');
  const elLeg710Pct = document.getElementById('legendBab710Pct');
  const elLeg710Bar = document.getElementById('legendBab710Bar');
  if (elLeg710Tot) elLeg710Tot.textContent = 'Rp ' + formatNumber(bab710Amount);
  if (elLeg710Pct) elLeg710Pct.textContent = p700Text === '0%' && p710Text === '0%' ? '0%' : p710Text;
  if (elLeg710Bar) elLeg710Bar.style.width = p710Text;

  const elLeg720Tot = document.getElementById('legendBab720Total');
  const elLeg720Pct = document.getElementById('legendBab720Pct');
  const elLeg720Bar = document.getElementById('legendBab720Bar');
  if (elLeg720Tot) elLeg720Tot.textContent = 'Rp ' + formatNumber(bab720Amount);
  if (elLeg720Pct) elLeg720Pct.textContent = p720Text;
  if (elLeg720Bar) elLeg720Bar.style.width = p720Text;

  // ==========================================
  // Middle Widget 2: Top 5 Beban Operasional Terbesar
  // ==========================================
  const top5Container = document.getElementById('top5ExpensesContainer');
  if (top5Container) {
    const coaMap = {};
    periodFilteredTxs.forEach(t => {
      const code = t.coa || '720.00.00.000';
      const name = t.coaName || 'Beban Operasional';
      const cc = t.costCenter || 'CC-720 General Admin';
      const amt = Number(t.amount) || 0;
      if (!coaMap[code]) {
        coaMap[code] = { code, name, costCenter: cc, total: 0, count: 0 };
      }
      coaMap[code].total += amt;
      coaMap[code].count += 1;
    });

    const top5List = Object.values(coaMap).sort((a, b) => b.total - a.total).slice(0, 5);
    const maxTop = top5List.length > 0 ? top5List[0].total : 1;

    if (top5List.length === 0) {
      top5Container.innerHTML = `
        <div class="py-5 text-center space-y-1">
          <div class="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center mx-auto text-xs">
            📊
          </div>
          <p class="text-xs text-slate-700 dark:text-slate-300 font-semibold">Belum Ada Pengeluaran</p>
          <p class="text-[10px] text-slate-400">Belum ada transaksi beban yang dicatat pada periode ini.</p>
        </div>
      `;
    } else {
      const rankBadges = [
        'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 font-bold',
        'bg-slate-400/20 text-slate-700 dark:text-slate-200 border border-slate-400/40 font-bold',
        'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40 font-bold',
        'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold',
        'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold'
      ];

      top5Container.innerHTML = top5List.map((item, idx) => {
        const badgeCls = rankBadges[idx] || rankBadges[4];
        const barPct = Math.round((item.total / maxTop) * 100);
        const sharePct = totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : '0';

        return `
          <div class="py-1.5 sm:py-2 flex items-center justify-between gap-2.5 group hover:bg-black/5 dark:hover:bg-white/5 px-1.5 rounded-lg transition-colors">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="w-5 h-5 rounded ${badgeCls} text-[10px] font-mono flex items-center justify-center shrink-0">
                #${idx + 1}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 truncate">
                  <span class="font-mono text-blue-600 dark:text-blue-400 text-[10px] sm:text-[11px] font-bold shrink-0">${item.code}</span>
                  <span class="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">${item.name}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <span class="font-mono">${item.costCenter}</span>
                  <span>&bull;</span>
                  <span>${item.count} voucher</span>
                  <span>&bull;</span>
                  <span class="font-mono text-emerald-500 font-semibold">${sharePct}% total</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700/60 h-1 rounded-full mt-1 overflow-hidden">
                  <div class="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500" style="width: ${barPct}%;"></div>
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="font-mono font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white block">
                Rp ${formatNumber(item.total)}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ==========================================
  // Render Desktop Table (tableFiltered)
  // ==========================================
  const tbody = document.getElementById('desktopTableBody');
  if (tbody) {
    if (tableFiltered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center">
            <div class="max-w-xs mx-auto space-y-1.5">
              <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-sm">
                📋
              </div>
              <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">Tidak Ada Transaksi Beban</h4>
              <p class="text-[10px] text-slate-400">Tidak ditemukan transaksi untuk kriteria pencarian atau filter yang dipilih.</p>
              <div class="pt-1 flex justify-center gap-2">
                <button onclick="openTransactionModal()" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm">
                  + Catat Beban Baru
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = tableFiltered.map(t => `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <td class="py-2.5 px-3">
            <span class="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">${t.date || '-'}</span>
            <p class="text-[9px] text-slate-400 font-mono">${t.ref || '-'}</p>
          </td>
          <td class="py-2.5 px-3">
            <span class="font-mono text-blue-600 dark:text-blue-400 font-bold text-[11px]">${t.coa}</span>
            <p class="text-[11px] text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">${t.coaName}</p>
          </td>
          <td class="py-2.5 px-3">
            <span class="px-1.5 py-0.5 rounded font-mono text-[9px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-300/80 dark:border-white/10 whitespace-nowrap">
              ${t.costCenter || 'CC-720 GA'}
            </span>
          </td>
          <td class="py-2.5 px-3 max-w-xs truncate text-slate-800 dark:text-slate-200 text-[11px]">
            ${t.desc}
          </td>
          <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
            ${t.source || 'Petty Cash'}
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
            Rp ${formatNumber(t.amount)}
          </td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              POSTED
            </span>
          </td>
        </tr>
      `).join('');
    }
  }

  // ==========================================
  // Render Mobile Cards (tableFiltered)
  // ==========================================
  const mobContainer = document.getElementById('mobileCardsContainer');
  if (mobContainer) {
    if (tableFiltered.length === 0) {
      mobContainer.innerHTML = `
        <div class="p-6 text-center glass-panel border border-slate-200/80 dark:border-white/10 rounded-xl space-y-1.5">
          <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto text-sm">
            📋
          </div>
          <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100">Tidak Ada Transaksi</h4>
          <p class="text-[10px] text-slate-400">Tekan tombol (+) atau gunakan voucher cepat di atas.</p>
        </div>
      `;
    } else {
      mobContainer.innerHTML = tableFiltered.map(t => `
        <div class="p-2.5 sm:p-3 rounded-xl glass-panel border border-slate-200/80 dark:border-white/10 space-y-1.5 active:scale-[0.99] transition-transform">
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-mono text-blue-600 dark:text-blue-400 font-bold">${t.coa}</span>
            <span class="font-mono text-slate-500 dark:text-slate-400 text-[9px]">${t.date || '-'} &bull; ${t.ref || '-'}</span>
          </div>
          <div>
            <h4 class="font-bold text-xs text-slate-900 dark:text-white truncate">${t.coaName}</h4>
            <p class="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-1 mt-0.5">${t.desc}</p>
          </div>
          <div class="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">${t.costCenter || 'CC-720 GA'} &bull; ${t.source || 'Ops'}</span>
            <span class="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Rp ${formatNumber(t.amount)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Summary footer in table
  const filteredSubtotal = tableFiltered.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const countEl = document.getElementById('tableSummaryCount');
  const totalEl = document.getElementById('tableSummaryTotal');
  if (countEl) countEl.textContent = `Menampilkan ${tableFiltered.length} transaksi (dari ${periodFilteredTxs.length} total)`;
  if (totalEl) totalEl.textContent = `Rp ${formatNumber(filteredSubtotal)}`;
}

/**
 * 1-Click Quick Expense Voucher Entry
 */
function quickAddExpense(templateKey) {
  const tpl = EXPENSE_TEMPLATES[templateKey];
  if (!tpl) return;

  // Open transaction modal
  if (typeof openTransactionModal === 'function') {
    openTransactionModal();
  } else {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.remove('hidden');
  }

  // Pre-fill COA Leaf Dropdown
  const coaSelect = document.getElementById('fAkunCoa');
  if (coaSelect) {
    coaSelect.value = tpl.coa;
    if (!coaSelect.value) {
      // Append option dynamically if missing from initial DOM
      const opt = document.createElement('option');
      opt.value = tpl.coa;
      opt.textContent = `${tpl.coa} - ${tpl.coaName}`;
      opt.selected = true;
      coaSelect.appendChild(opt);
    }
    coaSelect.dispatchEvent(new Event('change'));
  }

  // Pre-fill Cost Center
  const costCenterSelect = document.getElementById('fCostCenter');
  if (costCenterSelect) {
    costCenterSelect.value = tpl.costCenter;
  }

  // Pre-fill Description
  const descInput = document.getElementById('fKeterangan');
  if (descInput) {
    descInput.value = tpl.desc;
  }

  // Pre-fill Source
  const sourceSelect = document.getElementById('fSumberDana');
  if (sourceSelect) {
    sourceSelect.value = tpl.source;
  }

  // Pre-fill default amount and focus
  const nominalInput = document.getElementById('fNominal');
  if (nominalInput) {
    nominalInput.value = tpl.defaultAmount || '';
    nominalInput.focus();
    nominalInput.select();
  }

  if (typeof showToast === 'function') {
    showToast(`Template "${tpl.coaName}" dimuat! Masukkan nominal transaksi.`, 'info');
  }
}

/**
 * Filter by Period: 'ALL' | 'MONTH' | 'WEEK' | 'TODAY'
 */
function setPeriodFilter(period, btn) {
  window.appState.periodFilter = period;
  document.querySelectorAll('.period-pill').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
    b.classList.add('glass-panel', 'border', 'border-slate-300/80', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-300');
  });
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
    btn.classList.remove('glass-panel', 'border', 'border-slate-300/80', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-300');
  }
  renderDashboard();
}

/**
 * Filter by Category BAB: 'ALL' | '700' | '710' | '720'
 */
function setFilter(cat, btn) {
  window.appState.activeFilter = cat;
  document.querySelectorAll('.filter-pill').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
    b.classList.add('glass-panel', 'border', 'border-slate-300/80', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-300');
  });
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
    btn.classList.remove('glass-panel', 'border', 'border-slate-300/80', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-300');
  }
  renderDashboard();
}

/**
 * Search input handler
 */
function handleSearch(val) {
  window.appState.searchQuery = val.trim().toLowerCase();
  renderDashboard();
}

// Global window exposures
window.renderDashboard = renderDashboard;
window.handleSearch = handleSearch;
window.setFilter = setFilter;
window.setPeriodFilter = setPeriodFilter;
window.quickAddExpense = quickAddExpense;
