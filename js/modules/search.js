/**
 * js/modules/search.js
 * Smart Spotlight Search Modal for Astra SO COA Dictionary
 * Memungkinkan pencarian bahasa alami (contoh: "beli air galon", "token listrik", "servis ac")
 * dan menampilkan informasi akun lengkap beserta kelengkapan audit, pajak, & cost center.
 */

function openSearchModal(initialQuery = '') {
  const modal = document.getElementById('searchModal');
  const input = document.getElementById('smartSearchInput');
  if (!modal) return;

  modal.classList.remove('hidden');
  if (input) {
    input.value = initialQuery;
    setTimeout(() => input.focus(), 50);
  }
  handleSmartSearch(initialQuery);
}

function closeSearchModal() {
  const modal = document.getElementById('searchModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Ekstraksi seluruh akun leaf dari hierarki atau flat list
 */
function getAllLeafAccounts() {
  const allAccounts = [];

  const flatList = (typeof getActiveCoaFlatList === 'function') ? getActiveCoaFlatList() : [];
  if (flatList.length > 0) {
    flatList.forEach(item => {
      let code = '';
      let name = '';
      if (item.kodeSubSubBab && item.kodeSubSubBab !== '-') {
        code = item.kodeSubSubBab;
        name = item.namaSubSubBab;
      } else if (item.kodeSubBab && item.kodeSubBab !== '-' && (!item.catatanPosting || !item.catatanPosting.toLowerCase().includes('sub-bab'))) {
        code = item.kodeSubBab;
        name = item.namaSubBab;
      }

      if (!code || !name) return;

      const bab = item.kodeBab || '720';
      const color = bab.startsWith('70') ? 'emerald' : bab.startsWith('71') ? 'indigo' : 'blue';
      allAccounts.push({
        code: code,
        name: name,
        groupCode: bab,
        groupName: item.kategoriBab || 'OPEX',
        subgroupCode: item.kodeSubBab || bab,
        subgroupName: item.namaSubBab || 'Beban Operasional',
        color: color,
        cc: item.catatanPosting || 'Opex',
        tax: item.statusPajak || '-',
        detail: item.detailPenjelasan || '',
        example: item.contohRedaksi || ''
      });
    });
    return allAccounts;
  }

  // Jika ada masterCoaTree (dari spreadsheet atau fallback)
  const tree = window.appState.masterCoaTree || window.astraCoaDatabase || [];
  tree.forEach(group => {
    group.subgroups.forEach(sg => {
      sg.accounts.forEach(acc => {
        allAccounts.push({
          code: acc.code,
          name: acc.name,
          groupCode: group.groupCode,
          groupName: group.groupName,
          subgroupCode: sg.code,
          subgroupName: sg.name,
          color: group.color || 'blue',
          cc: acc.cc || 'CC-720 GA',
          tax: acc.tax || '-',
          detail: acc.detail || '',
          example: acc.example || ''
        });
      });
    });
  });

  return allAccounts;
}

/**
 * Mesin pencarian cerdas berbasis intent dan keyword
 */
function handleSmartSearch(rawQuery) {
  const container = document.getElementById('smartSearchResultsContainer');
  const statsEl = document.getElementById('searchResultStats');
  if (!container) return;

  const query = (rawQuery || '').trim().toLowerCase();
  const allAccounts = getAllLeafAccounts();
  const keywords = window.intentKeywords || [];

  // Tampilan Awal / Saat query kosong
  if (!query) {
    if (statsEl) statsEl.textContent = 'Ketik pengeluaran atau pilih topik cepat di bawah:';
    container.innerHTML = `
      <div class="space-y-4 py-2">
        <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
          <div class="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 mb-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
            <span>Pencarian Cerdas Kamus Akun Astra SO</span>
          </div>
          <p class="text-slate-600 dark:text-slate-300">
            Ketik kata sehari-hari transaksi Anda (seperti <em>"air galon"</em>, <em>"servis ac"</em>, <em>"token pln"</em>, <em>"bbm sales"</em>, atau <em>"ongkir towing"</em>). Sistem akan mencocokkan kode akun COA, cost center, status pajak, dan redaksi bakunya.
          </p>
        </div>

        <div>
          <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Pencarian Populer Cabang:</h4>
          <div class="flex flex-wrap gap-1.5 text-xs">
            <button onclick="selectQuickSearchTag('air galon')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">💧 Air Galon</button>
            <button onclick="selectQuickSearchTag('token listrik pln')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">⚡ Listrik PLN</button>
            <button onclick="selectQuickSearchTag('cuci ac showroom')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">❄️ Service AC</button>
            <button onclick="selectQuickSearchTag('filter solar genset')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">⚙️ Sparepart Genset</button>
            <button onclick="selectQuickSearchTag('bbm bensin test drive')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">⛽ BBM Test Drive</button>
            <button onclick="selectQuickSearchTag('kertas atk form spk')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">📝 Kertas ATK</button>
            <button onclick="selectQuickSearchTag('nasi kotak lembur')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">🍱 Konsumsi Lembur</button>
            <button onclick="selectQuickSearchTag('wifi biznet internet')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">🌐 Internet & VPN</button>
            <button onclick="selectQuickSearchTag('car carrier towing')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">🚚 Ekspedisi Towing</button>
            <button onclick="selectQuickSearchTag('pameran mall booth')" class="px-3 py-1.5 rounded-xl glass-panel hover:bg-blue-600 hover:text-white transition-all text-slate-700 dark:text-slate-300">🎪 Pameran Mall</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 1. Cek Pencocokan Smart Intent
  const matchedIntents = [];
  keywords.forEach(item => {
    if (item.trigger.some(t => query.includes(t) || t.includes(query))) {
      matchedIntents.push(item);
    }
  });

  // 2. Filter Database Lengkap
  const scoredResults = allAccounts.map(acc => {
    let score = 0;
    let matchReason = '';

    // Cek kecocokan intent
    const intentMatch = matchedIntents.find(m => m.coa === acc.code);
    if (intentMatch) {
      score += 60;
      matchReason = 'Kecocokan Bahasa Alami Smart Matcher';
    }

    // Cek kecocokan nama akun
    if (acc.name.toLowerCase().includes(query)) {
      score += 40;
      matchReason = matchReason || 'Nama Akun COA';
    }

    // Cek kecocokan kode COA
    if (acc.code.includes(query)) {
      score += 50;
      matchReason = matchReason || 'Kode Akun COA';
    }

    // Cek kecocokan detail penjelasan
    if (acc.detail && acc.detail.toLowerCase().includes(query)) {
      score += 25;
      matchReason = matchReason || 'Detail Ruang Lingkup Akun';
    }

    // Cek kecocokan contoh transaksi
    if (acc.example && acc.example.toLowerCase().includes(query)) {
      score += 30;
      matchReason = matchReason || 'Contoh Redaksi Transaksi';
    }

    // Cek sub-bab / bab
    if (acc.subgroupName.toLowerCase().includes(query)) {
      score += 15;
    }

    // Cek cost center / pajak
    if (acc.cc.toLowerCase().includes(query) || (acc.tax && acc.tax.toLowerCase().includes(query))) {
      score += 10;
    }

    return { ...acc, score, matchReason };
  }).filter(item => item.score > 0);

  // Urutkan dari skor tertinggi
  scoredResults.sort((a, b) => b.score - a.score);

  if (statsEl) {
    statsEl.textContent = `Ditemukan ${scoredResults.length} akun yang relevan dengan kata kunci "${rawQuery}":`;
  }

  // Tampilan saat tidak ada hasil
  if (scoredResults.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center glass-panel rounded-2xl space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl">
          🔍
        </div>
        <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Akun Tidak Ditemukan</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Tidak ditemukan kode akun COA yang sesuai untuk <em>"${rawQuery}"</em>. Coba gunakan istilah umum atau ajukan penambahan akun leaf baru.
        </p>
        <div class="pt-2 flex justify-center gap-2">
          <button onclick="closeSearchModal(); openProposalDrawer();" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md">
            + Ajukan Akun Baru ke Controller
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Render hasil lengkap dengan format kartu specular glass
  container.innerHTML = scoredResults.map(item => `
    <div class="p-4 sm:p-5 rounded-2xl glass-panel space-y-3 border border-slate-200/50 dark:border-white/10 hover:border-blue-500/40 transition-all">
      
      <!-- Baris 1: Header Kode, Badge Group, Pajak, dan Cost Center -->
      <div class="flex items-start justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl font-mono font-bold text-sm ${item.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'}">
            ${item.code}
          </span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
            ${item.groupCode.startsWith('71') ? 'SELLING (SE)' : 'GENERAL & ADMIN (G&A)'}
          </span>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          ${item.tax && item.tax !== '-' ? `
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25" title="Aspek Perpajakan">
              Pajak: ${item.tax}
            </span>
          ` : ''}
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold" title="Rekomendasi Cost Center">
            ${item.cc}
          </span>
        </div>
      </div>

      <!-- Baris 2: Nama Akun & Rute Hierarki Induk -->
      <div>
        <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          ${item.name}
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          ${item.groupName} &rsaquo; ${item.subgroupName}
        </p>
      </div>

      <!-- Baris 3: Detail Ruang Lingkup & Penjelasan -->
      ${item.detail ? `
        <div class="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
            <span>Ruang Lingkup Beban:</span>
          </div>
          <p class="leading-relaxed">${item.detail}</p>
        </div>
      ` : ''}

      <!-- Baris 4: Contoh Redaksi Transaksi Audit -->
      ${item.example ? `
        <div class="px-3 py-2 rounded-xl bg-slate-500/5 border border-slate-500/15 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <span class="font-bold text-slate-800 dark:text-slate-200 font-sans">Contoh Redaksi Voucher:</span> "${item.example}"
        </div>
      ` : ''}

      <!-- Baris 5: Action Buttons -->
      <div class="pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div class="text-[11px] text-slate-400 font-mono">
          ${item.matchReason ? `<span class="text-blue-500 font-semibold">⚡ ${item.matchReason}</span>` : 'Leaf Akun Standar SAP'}
        </div>

        <div class="flex items-center gap-2">
          <button onclick="copyAccountCode('${item.code}')" class="px-3 py-1.5 rounded-xl glass-panel hover:text-blue-500 font-semibold flex items-center gap-1 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>
            <span>Salin Kode</span>
          </button>

          <button onclick="jumpToCoaDictionary('${item.code}')" class="px-3 py-1.5 rounded-xl glass-panel hover:text-blue-500 font-semibold flex items-center gap-1 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            <span>Buka di Kamus</span>
          </button>

          <button onclick="selectAccountForTransaction('${item.code}')" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 shadow-sm transition-all">
            <span>Pakai Catat Beban &rarr;</span>
          </button>
        </div>
      </div>

    </div>
  `).join('');
}

function selectQuickSearchTag(tag) {
  const input = document.getElementById('smartSearchInput');
  if (input) {
    input.value = tag;
    input.focus();
  }
  handleSmartSearch(tag);
}

function copyAccountCode(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Kode akun ${code} disalin ke clipboard!`, 'success');
    }).catch(() => {
      fallbackCopy(code);
    });
  } else {
    fallbackCopy(code);
  }
}

function jumpToCoaDictionary(code) {
  closeSearchModal();
  switchView('coa');
  const coaFilter = document.getElementById('coaFilterInput');
  if (coaFilter) {
    coaFilter.value = code;
    filterCoaTree(code);
  }
  showToast(`Membuka Book COA untuk kode ${code}`, 'info');
}

function selectAccountForTransaction(code) {
  closeSearchModal();
  openTransactionModal();
  const select = document.getElementById('fAkunCoa');
  if (select) {
    select.value = code;
  }
  const nominalInput = document.getElementById('fNominal');
  if (nominalInput) nominalInput.focus();
  showToast(`Akun ${code} terpilih untuk pencatatan beban.`, 'info');
}

// Expose globally
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.handleSmartSearch = handleSmartSearch;
window.selectQuickSearchTag = selectQuickSearchTag;
window.copyAccountCode = copyAccountCode;
window.jumpToCoaDictionary = jumpToCoaDictionary;
window.selectAccountForTransaction = selectAccountForTransaction;

