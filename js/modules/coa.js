/**
 * js/modules/coa.js
 * Chart of Accounts (COA) Master Database Renderer & Controller
 * Mendukung Tampilan Tabel Database Presisi 10-Kolom yang Cepat, Mulus,
 * Dilengkapi Paginasi Ringan (Bebas Crash), Expandable Details, Debounced Search,
 * serta Integrasi Cepat ke Form Pencatatan Beban
 */

// State internal tampilan Kamus COA
const coaViewState = {
  mode: 'table',          // 'table' (default) atau 'tree'
  keyword: '',
  activeBab: 'ALL',        // 'ALL', '700', '710', '720'
  page: 1,
  pageSize: 25,           // 25, 50, 100, atau 9999 (Semua)
  expandedIndices: new Set() // Set of indices yang sedang terbuka detailnya
};

let coaSearchDebounceTimer = null;
let currentRenderedRows = [];

/**
 * Mengambil daftar data flat COA (dari Google Sheets cache atau database baku Astra)
 */
function getActiveCoaFlatList() {
  if (Array.isArray(window.appState.masterCoa) && window.appState.masterCoa.length > 0) {
    return window.appState.masterCoa;
  }
  return [];
}

/**
 * Mengubah flat list dari Google Spreadsheet menjadi hierarki pohon COA bertingkat
 */
function buildCoaTreeFromFlatList(flatList) {
  if (!Array.isArray(flatList) || flatList.length === 0) return null;

  const subBabsWithChildren = new Set();
  flatList.forEach(item => {
    const subSub = item.kodeSubSubBab && String(item.kodeSubSubBab).trim() !== '-' ? String(item.kodeSubSubBab).trim() : '';
    const sub = item.kodeSubBab && String(item.kodeSubBab).trim() !== '-' ? String(item.kodeSubBab).trim() : '';
    if (subSub && sub) {
      subBabsWithChildren.add(sub);
    }
  });

  const babGroups = {};

  flatList.forEach(item => {
    const rawBabCode = String(item.kodeBab || '').trim();
    const rawBabName = String(item.kategoriBab || '').trim();
    const rawSubBabCode = String(item.kodeSubBab || '').trim();
    const rawSubBabName = String(item.namaSubBab || '').trim();
    const rawSubSubCode = String(item.kodeSubSubBab || '').trim();
    const rawSubSubName = String(item.namaSubSubBab || '').trim();

    if ((!rawSubBabCode || rawSubBabCode === '-') && (!rawSubSubCode || rawSubSubCode === '-')) {
      return;
    }

    const babCode = rawBabCode || '720';
    const babName = rawBabName || (babCode.startsWith('70') ? 'EMPLOYEE COMPENSATION' : babCode.startsWith('71') ? 'SELLING EXPENSES (SE)' : 'GENERAL & ADMINISTRATIVE (G&A)');
    const color = babCode.startsWith('70') ? 'emerald' : babCode.startsWith('71') ? 'indigo' : 'blue';

    if (!babGroups[babCode]) {
      babGroups[babCode] = {
        groupCode: babCode,
        groupName: babName,
        color: color,
        subgroupsMap: {}
      };
    }

    const subBabCode = rawSubBabCode && rawSubBabCode !== '-' ? rawSubBabCode : babCode;
    const subBabName = rawSubBabName && rawSubBabName !== '-' ? rawSubBabName : 'Beban Operasional';

    if (!babGroups[babCode].subgroupsMap[subBabCode]) {
      babGroups[babCode].subgroupsMap[subBabCode] = {
        code: subBabCode,
        name: subBabName,
        accounts: []
      };
    }

    let accCode = '';
    let accName = '';

    if (rawSubSubCode && rawSubSubCode !== '-') {
      accCode = rawSubSubCode;
      accName = rawSubSubName;
    } else if (rawSubBabCode && rawSubBabCode !== '-') {
      if (subBabsWithChildren.has(rawSubBabCode)) {
        return;
      }
      accCode = rawSubBabCode;
      accName = rawSubBabName;
    }

    if (accCode && accName) {
      const exists = babGroups[babCode].subgroupsMap[subBabCode].accounts.some(a => a.code === accCode);
      if (!exists) {
        babGroups[babCode].subgroupsMap[subBabCode].accounts.push({
          code: accCode,
          name: accName,
          cc: item.catatanPosting || 'Opex',
          tax: item.statusPajak || '-',
          detail: item.detailPenjelasan || '',
          example: item.contohRedaksi || ''
        });
      }
    }
  });

  return Object.values(babGroups).map(group => ({
    groupCode: group.groupCode,
    groupName: group.groupName,
    color: group.color,
    subgroups: Object.values(group.subgroupsMap).filter(sg => sg.accounts.length > 0)
  }));
}

/**
 * Update state master COA dan refresh tampilan UI
 */
function updateCoaFromData(coaList, coaTree = null) {
  if (Array.isArray(coaList)) {
    window.appState.masterCoa = coaList;
  }

  if (coaTree && Array.isArray(coaTree) && coaTree.length > 0) {
    window.appState.masterCoaTree = coaTree;
  } else if (Array.isArray(coaList) && coaList.length > 0) {
    window.appState.masterCoaTree = buildCoaTreeFromFlatList(coaList);
  }

  coaViewState.page = 1;
  coaViewState.expandedIndices.clear();
  renderCoaView();
  populateCoaDropdown(coaList);
}

/**
 * Sinkronkan dropdown pilihan akun pada formulir Catat Beban (#fAkunCoa)
 */
function populateCoaDropdown(coaList) {
  const selectEl = document.getElementById('fAkunCoa');
  if (!selectEl) return;

  const flatList = getActiveCoaFlatList();
  const currentValue = selectEl.value;

  if (flatList.length > 0) {
    const babGroups = {};
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
      const babName = item.kategoriBab || 'OPEX';
      if (!babGroups[bab]) {
        babGroups[bab] = { name: babName, accounts: [] };
      }
      if (!babGroups[bab].accounts.some(a => a.code === code)) {
        babGroups[bab].accounts.push({ code, name });
      }
    });

    let html = '<option value="">-- Pilih Akun COA Astra SO --</option>';
    Object.keys(babGroups).sort().forEach(bab => {
      html += `<optgroup label="${bab} - ${babGroups[bab].name}">`;
      babGroups[bab].accounts.forEach(acc => {
        html += `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`;
      });
      html += `</optgroup>`;
    });

    selectEl.innerHTML = html;
    if (currentValue) selectEl.value = currentValue;
    return;
  }

  const tree = window.appState.masterCoaTree || window.astraCoaDatabase;
  if (!tree || tree.length === 0) return;

  let html = '<option value="">-- Pilih Akun COA Astra SO --</option>';
  tree.forEach(group => {
    html += `<optgroup label="${group.groupCode} - ${group.groupName}">`;
    group.subgroups.forEach(sg => {
      sg.accounts.forEach(acc => {
        html += `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`;
      });
    });
    html += `</optgroup>`;
  });

  selectEl.innerHTML = html;
  if (currentValue) selectEl.value = currentValue;
}

/**
 * Render Kamus COA Utama
 */
function renderCoaView() {
  const container = document.getElementById('coaMainContainer') || document.getElementById('coaTreeContainer');
  if (!container) return;

  if (typeof updateCoaLiveStatusUi === 'function') {
    updateCoaLiveStatusUi();
  }

  if (coaViewState.mode === 'table') {
    renderCoaTable(container, coaViewState.keyword, coaViewState.activeBab);
  } else {
    renderCoaTree(container, coaViewState.keyword, coaViewState.activeBab);
  }
}

/**
 * Render Tampilan Tabel Database Interaktif & Ringan (Paginasi 25 Baris, Bebas Freeze/Crash)
 */
function renderCoaTable(container, filterKeyword = '', babFilter = 'ALL') {
  const kw = (filterKeyword || '').toLowerCase().trim();
  const rawList = getActiveCoaFlatList();

  // 1. Filter Data
  const filteredList = rawList.filter(row => {
    if (babFilter !== 'ALL') {
      const rowBab = String(row.kodeBab || '').trim();
      if (babFilter === '700' && !rowBab.startsWith('70')) return false;
      if (babFilter === '710' && !rowBab.startsWith('71')) return false;
      if (babFilter === '720' && !(rowBab.startsWith('72') || rowBab.startsWith('73') || rowBab.startsWith('74') || rowBab.startsWith('79'))) return false;
      if (!['700', '710', '720'].includes(babFilter) && !rowBab.startsWith(babFilter)) return false;
    }

    if (kw === '') return true;

    return (
      String(row.kodeBab || '').toLowerCase().includes(kw) ||
      String(row.kategoriBab || '').toLowerCase().includes(kw) ||
      String(row.kodeSubBab || '').toLowerCase().includes(kw) ||
      String(row.namaSubBab || '').toLowerCase().includes(kw) ||
      String(row.kodeSubSubBab || '').toLowerCase().includes(kw) ||
      String(row.namaSubSubBab || '').toLowerCase().includes(kw) ||
      String(row.detailPenjelasan || '').toLowerCase().includes(kw) ||
      String(row.contohRedaksi || '').toLowerCase().includes(kw) ||
      String(row.statusPajak || '').toLowerCase().includes(kw) ||
      String(row.catatanPosting || '').toLowerCase().includes(kw)
    );
  });

  currentRenderedRows = filteredList;

  if (rawList.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center glass-panel rounded-2xl space-y-3">
        <svg class="w-10 h-10 mx-auto text-blue-500 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Menyinkronkan Database dari Google Spreadsheet...</p>
        <p class="text-xs text-slate-500">Menghubungkan langsung ke tab "COA OPEX 2021 Presisi Full". Data akan muncul dalam sekejap.</p>
        <button onclick="fetchFromGoogleSheets(true)" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all">Muat Ulang Sekarang</button>
      </div>
    `;
    return;
  }

  if (filteredList.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center glass-panel rounded-2xl space-y-3">
        <svg class="w-10 h-10 mx-auto text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Tidak ada data COA yang cocok</p>
        <p class="text-xs text-slate-500">Kata kunci "${filterKeyword}" tidak ditemukan pada database COA Astra SO.</p>
        <button onclick="handleCoaSearchInput(''); document.getElementById('coaFilterInput').value='';" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all">Reset Pencarian</button>
      </div>
    `;
    return;
  }

  // 2. Hitung Paginasi
  const totalItems = filteredList.length;
  const pageSize = coaViewState.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (coaViewState.page > totalPages) {
    coaViewState.page = totalPages;
  }
  const currentPage = coaViewState.page;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);
  const pageItems = filteredList.slice(startIndex, endIndex);

  // 3. Render Baris-baris Tabel
  const tableRowsHtml = pageItems.map((row, idxOnPage) => {
    const globalIdx = startIndex + idxOnPage;
    const isBabHeader = (!row.kodeSubBab || row.kodeSubBab === '-') && (!row.kodeSubSubBab || row.kodeSubSubBab === '-');
    const isSubBabHeader = row.kodeSubBab && row.kodeSubBab !== '-' && (!row.kodeSubSubBab || row.kodeSubSubBab === '-') && String(row.catatanPosting || '').toLowerCase().includes('sub-bab');
    const isLeaf = (row.kodeSubSubBab && row.kodeSubSubBab !== '-') || (!isBabHeader && !isSubBabHeader);

    const postingCode = (row.kodeSubSubBab && row.kodeSubSubBab !== '-') ? row.kodeSubSubBab : (row.kodeSubBab && row.kodeSubBab !== '-' ? row.kodeSubBab : '');
    const postingName = (row.namaSubSubBab && row.namaSubSubBab !== '-') ? row.namaSubSubBab : (row.namaSubBab && row.namaSubBab !== '-' ? row.namaSubBab : row.kategoriBab);

    const isExpanded = coaViewState.expandedIndices.has(globalIdx);

    // Kategori BAB Pill Theme
    const babCode = String(row.kodeBab || '720').trim();
    let babBadgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (babCode.startsWith('70')) {
      babBadgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (babCode.startsWith('71')) {
      babBadgeColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }

    // Badge Pajak
    let taxBadge = `<span class="text-slate-400 text-[10px]">-</span>`;
    const tax = String(row.statusPajak || '').trim();
    if (tax && tax !== '-') {
      if (tax.toLowerCase().includes('bukan') || tax.toLowerCase().includes('non')) {
        taxBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap">${tax}</span>`;
      } else if (tax.toLowerCase().includes('pph 23') || tax.toLowerCase().includes('pph 21')) {
        taxBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">${tax}</span>`;
      } else if (tax.toLowerCase().includes('ppn') || tax.toLowerCase().includes('4(2)')) {
        taxBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">${tax}</span>`;
      } else {
        taxBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">${tax}</span>`;
      }
    }

    // Badge Posting / Tipe
    let postingBadge = `<span class="text-slate-400 text-[10px]">-</span>`;
    const posting = String(row.catatanPosting || '').trim();
    if (posting) {
      if (posting.includes('Category') || isBabHeader) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">BAB Header</span>`;
      } else if (posting.includes('SAP-HR')) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20 whitespace-nowrap">SAP-HR</span>`;
      } else if (isSubBabHeader) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">Sub-Bab</span>`;
      } else {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Opex Leaf</span>`;
      }
    }

    // Row Background Styling
    let rowBg = 'hover:bg-blue-500/5 transition-all border-b border-slate-200/40 dark:border-white/5';
    if (isBabHeader) {
      rowBg = 'bg-slate-100/70 dark:bg-white/5 font-semibold border-b border-slate-200/70 dark:border-white/10';
    } else if (isExpanded) {
      rowBg = 'bg-blue-500/10 dark:bg-blue-500/15 border-b border-blue-500/30';
    }

    // Detail Expand Content (Hanya render jika dibuka untuk hemat memori)
    let expandedDrawerHtml = '';
    if (isExpanded) {
      expandedDrawerHtml = `
        <tr class="bg-blue-500/5 dark:bg-blue-500/10 border-b border-blue-500/20 animate-fadeIn">
          <td colspan="7" class="p-4 sm:p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <!-- Detail Penjelasan & Coverage -->
              <div class="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 space-y-1.5 shadow-sm">
                <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
                  <span>Detail Penjelasan & Cakupan Beban</span>
                </div>
                <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  ${row.detailPenjelasan && row.detailPenjelasan !== '-' ? row.detailPenjelasan : 'Tidak ada catatan penjelasan khusus.'}
                </p>
                <div class="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Sub-Bab: <strong>${row.namaSubBab || '-'}</strong> (${row.kodeSubBab || '-'})</span>
                </div>
              </div>

              <!-- Contoh Redaksi Teks & Catatan Posting -->
              <div class="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 space-y-2 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    <span>Contoh Redaksi Teks Voucher / BPH Baku</span>
                  </div>
                  <p class="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/15 p-2 rounded-lg border border-blue-500/20">
                    ${row.contohRedaksi && row.contohRedaksi !== '-' ? `"${row.contohRedaksi}"` : 'Format redaksi bebas sesuai transaksi operasional cabang.'}
                  </p>
                </div>
                
                <div class="flex items-center justify-between pt-1 text-[11px]">
                  <span class="text-slate-500 font-mono">Status Pajak: <strong>${row.statusPajak || '-'}</strong></span>
                  ${postingCode ? `
                    <button 
                      type="button" 
                      onclick="useCoaRow(${globalIdx})" 
                      class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                      <span>Catat Beban dengan Akun Ini</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }

    return `
      <tr class="${rowBg} cursor-pointer group" onclick="toggleCoaRowDetail(${globalIdx})">
        <!-- 1. No -->
        <td class="py-3 px-3 text-center font-mono text-[11px] text-slate-400 select-none">${globalIdx + 1}</td>
        
        <!-- 2. Kode Akun -->
        <td class="py-3 px-3 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
          <div class="flex items-center gap-1.5">
            <span>${postingCode || row.kodeBab || '-'}</span>
            ${postingCode ? `
              <button 
                type="button" 
                onclick="event.stopPropagation(); copyCoaCode('${postingCode}')" 
                title="Salin kode" 
                class="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-500 transition-opacity"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625V7.875c0-.621.504-1.125 1.125-1.125H7.5m8.25 10.375l3.75-3.75m0 0l-3.75-3.75m3.75 3.75H10.5"/></svg>
              </button>
            ` : ''}
          </div>
        </td>

        <!-- 3. Nama Akun -->
        <td class="py-3 px-3 text-xs text-slate-900 dark:text-white font-medium min-w-[200px]">
          <div class="flex items-center gap-2">
            <span class="font-semibold">${postingName}</span>
            ${row.detailPenjelasan && row.detailPenjelasan !== '-' ? `
              <span class="text-[10px] text-slate-400 font-normal hidden lg:inline truncate max-w-[220px]">
                &bull; ${row.detailPenjelasan}
              </span>
            ` : ''}
          </div>
        </td>

        <!-- 4. Kategori BAB -->
        <td class="py-3 px-3 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${babBadgeColor}">
            BAB ${row.kodeBab || '-'}
          </span>
        </td>

        <!-- 5. Status Pajak -->
        <td class="py-3 px-3 text-center whitespace-nowrap">${taxBadge}</td>

        <!-- 6. Catatan Sistem -->
        <td class="py-3 px-3 text-center whitespace-nowrap">${postingBadge}</td>

        <!-- 7. Aksi Interaktif -->
        <td class="py-3 px-3 text-right whitespace-nowrap" onclick="event.stopPropagation()">
          <div class="flex items-center gap-1.5 justify-end">
            ${isLeaf && postingCode ? `
              <button 
                type="button" 
                onclick="useCoaRow(${globalIdx})" 
                class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                title="Gunakan akun ini untuk formulir Catat Beban"
              >
                <span>Gunakan</span>
              </button>
            ` : ''}
            
            <button 
              type="button" 
              onclick="toggleCoaRowDetail(${globalIdx})" 
              class="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[11px] flex items-center gap-1"
              title="Lihat detail penjelasan & coverage"
            >
              <svg class="w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            </button>
          </div>
        </td>
      </tr>
      ${expandedDrawerHtml}
    `;
  }).join('');

  // 4. Render Kontrol Paginasi
  let paginationControlsHtml = '';
  if (totalPages > 1 || totalItems > 25) {
    paginationControlsHtml = `
      <div class="px-4 py-3 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/5 dark:bg-white/5 text-xs font-mono">
        <!-- Info Rentang Data -->
        <div class="text-slate-500 dark:text-slate-400">
          Menampilkan <strong class="text-slate-900 dark:text-white">${startIndex + 1}</strong> - <strong class="text-slate-900 dark:text-white">${endIndex}</strong> dari <strong class="text-slate-900 dark:text-white">${totalItems}</strong> baris akun
        </div>

        <!-- Tombol Halaman & Pilihan Baris -->
        <div class="flex items-center gap-3 self-end sm:self-auto">
          <!-- Pilihan Baris per Halaman -->
          <div class="flex items-center gap-1.5 text-slate-500">
            <span>Baris:</span>
            <select 
              onchange="setCoaPageSize(Number(this.value))" 
              class="glass-input px-2 py-1 rounded-lg text-xs font-mono focus:outline-none"
            >
              <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
              <option value="9999" ${pageSize >= 9999 ? 'selected' : ''}>Semua</option>
            </select>
          </div>

          <!-- Navigasi Page -->
          <div class="flex items-center gap-1">
            <button 
              type="button" 
              onclick="setCoaPage(${currentPage - 1})" 
              ${currentPage === 1 ? 'disabled class="px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all"'}
            >
              &larr; Prev
            </button>

            <span class="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
              ${currentPage} / ${totalPages}
            </span>

            <button 
              type="button" 
              onclick="setCoaPage(${currentPage + 1})" 
              ${currentPage === totalPages ? 'disabled class="px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-all"'}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const isLiveDb = Array.isArray(window.appState.masterCoa) && window.appState.masterCoa.length > 0;

  // 5. Rakit Keseluruhan Tampilan Tabel
  container.innerHTML = `
    <div class="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-white/10">
      <!-- Top Info Bar -->
      <div class="px-5 py-3 border-b border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/5 dark:bg-white/5">
        <div class="flex items-center gap-2 text-xs font-mono">
          <span class="w-2 h-2 rounded-full ${isLiveDb ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
          <span class="font-bold text-slate-800 dark:text-slate-200">${isLiveDb ? 'Spreadsheet Realtime: Tab "COA OPEX 2021 Presisi Full"' : 'Database COA Astra SO'}</span>
          <span class="text-slate-400 dark:text-slate-500">&bull; ${totalItems} Baris Ditemukan</span>
        </div>
        <div class="text-[11px] text-slate-400 font-mono">
          Klik baris mana saja untuk melihat Detail Penjelasan & Coverage
        </div>
      </div>

      <!-- Responsive Table Grid -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200/80 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/90 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-3 whitespace-nowrap">Kode COA</th>
              <th class="py-3 px-3 whitespace-nowrap">Nama Akun & Sub-Bab</th>
              <th class="py-3 px-3 whitespace-nowrap">Kategori BAB</th>
              <th class="py-3 px-3 text-center whitespace-nowrap">Status Pajak</th>
              <th class="py-3 px-3 text-center whitespace-nowrap">Tipe Akun</th>
              <th class="py-3 px-3 text-right whitespace-nowrap w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/40 dark:divide-white/5 font-sans">
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      ${paginationControlsHtml}
    </div>
  `;
}

/**
 * Render Tampilan Kartu Pohon Hierarki (Tree View)
 */
function renderCoaTree(container, filterKeyword = '', babFilter = 'ALL') {
  const kw = (filterKeyword || '').toLowerCase().trim();
  const db = window.appState.masterCoaTree || window.astraCoaDatabase || [];

  const html = db.map(group => {
    if (babFilter !== 'ALL') {
      const gCode = String(group.groupCode || '').trim();
      if (babFilter === '700' && !gCode.startsWith('70')) return '';
      if (babFilter === '710' && !gCode.startsWith('71')) return '';
      if (babFilter === '720' && !(gCode.startsWith('72') || gCode.startsWith('73') || gCode.startsWith('74') || gCode.startsWith('79'))) return '';
      if (!['700', '710', '720'].includes(babFilter) && !gCode.startsWith(babFilter)) return '';
    }

    const colorClasses = {
      emerald: {
        text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        border: 'border-emerald-500/30'
      },
      indigo: {
        text: 'text-indigo-600 dark:text-indigo-400',
        dot: 'bg-indigo-500',
        border: 'border-indigo-500/30'
      },
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500',
        border: 'border-blue-500/30'
      }
    };

    const cTheme = colorClasses[group.color] || colorClasses.blue;

    const filteredSubgroups = group.subgroups.map(sg => {
      const matchedAccounts = sg.accounts.filter(a => 
        kw === '' || 
        a.code.toLowerCase().includes(kw) || 
        a.name.toLowerCase().includes(kw) || 
        (a.cc && a.cc.toLowerCase().includes(kw)) ||
        (a.tax && a.tax.toLowerCase().includes(kw)) ||
        (a.detail && a.detail.toLowerCase().includes(kw))
      );
      return { ...sg, accounts: matchedAccounts };
    }).filter(sg => sg.accounts.length > 0 || (kw !== '' && sg.name.toLowerCase().includes(kw)));

    if (filteredSubgroups.length === 0 && kw !== '' && !group.groupName.toLowerCase().includes(kw) && !group.groupCode.includes(kw)) {
      return '';
    }

    const subgroupsToRender = filteredSubgroups.length > 0 ? filteredSubgroups : group.subgroups;

    return `
      <div class="p-5 rounded-2xl glass-panel space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
          <div class="flex items-center gap-2 font-mono font-bold text-xs ${cTheme.text}">
            <span class="w-2.5 h-2.5 rounded-full ${cTheme.dot}"></span>
            <span>BAB ${group.groupCode} &bull; ${group.groupName}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">Level 1 Header</span>
        </div>

        <div class="space-y-4">
          ${subgroupsToRender.map(sg => `
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span class="font-mono text-slate-500 dark:text-slate-400 text-[11px]">${sg.code}</span>
                <span class="flex-1 ml-2">${sg.name}</span>
              </div>
              <div class="pl-4 border-l-2 ${cTheme.border} space-y-2 text-xs font-mono">
                ${sg.accounts.map(acc => `
                  <div class="p-3 border border-slate-200/40 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all space-y-1.5">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-blue-600 dark:text-blue-400 font-bold tracking-tight">${acc.code}</span>
                        <span class="font-sans font-semibold text-slate-800 dark:text-slate-200">${acc.name}</span>
                      </div>
                      <div class="flex items-center gap-1.5 flex-shrink-0">
                        ${acc.tax && acc.tax !== '-' ? `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">${acc.tax}</span>` : ''}
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">${acc.cc || 'Opex'}</span>
                        <button 
                          type="button" 
                          onclick="useCoaInTransaction('${acc.code}', '${acc.name.replace(/'/g, "\\'")}', '${(acc.detail || '').replace(/'/g, "\\'")}', '${acc.tax || '-'}')" 
                          class="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-all active:scale-95"
                        >Gunakan</button>
                      </div>
                    </div>
                    ${acc.detail && acc.detail !== '-' ? `<p class="font-sans text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${acc.detail}</p>` : ''}
                    ${acc.example && acc.example !== '-' ? `<p class="font-mono text-[10px] text-slate-400 dark:text-slate-500">Cth: "${acc.example}"</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  container.innerHTML = html || `<div class="p-8 text-center text-xs text-slate-400 glass-panel rounded-2xl">Tidak ada kode akun COA yang cocok dengan filter yang dipilih</div>`;
}

/**
 * Ganti View Mode antara Table dan Tree
 */
function setCoaViewMode(mode) {
  coaViewState.mode = mode;

  const btnTable = document.getElementById('coaBtnViewTable');
  const btnTree = document.getElementById('coaBtnViewTree');

  if (btnTable && btnTree) {
    if (mode === 'table') {
      btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-sm';
      btnTree.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5';
    } else {
      btnTree.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-sm';
      btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5';
    }
  }

  renderCoaView();
}

/**
 * Filter berdasarkan kategori BAB (ALL, 700, 710, 720)
 */
function setCoaBabFilter(bab) {
  coaViewState.activeBab = bab;
  coaViewState.page = 1;

  const pills = ['ALL', '700', '710', '720'];
  pills.forEach(p => {
    const el = document.getElementById(`coaBabPill-${p}`);
    if (el) {
      if (p === bab) {
        el.className = 'coa-bab-pill px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all bg-blue-600 text-white border-blue-600 shadow-sm whitespace-nowrap';
      } else {
        el.className = 'coa-bab-pill px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10 hover:border-blue-500/50 whitespace-nowrap';
      }
    }
  });

  renderCoaView();
}

/**
 * Debounced search input (mencegah freeze browser saat mengetik cepat)
 */
function handleCoaSearchInput(val) {
  if (coaSearchDebounceTimer) {
    clearTimeout(coaSearchDebounceTimer);
  }
  coaSearchDebounceTimer = setTimeout(() => {
    coaViewState.keyword = val;
    coaViewState.page = 1;
    renderCoaView();
  }, 180);
}

function filterCoaTree(val) {
  handleCoaSearchInput(val);
}

/**
 * Pindah Halaman pada Paginasi Tabel
 */
function setCoaPage(newPage) {
  if (newPage < 1) return;
  coaViewState.page = newPage;
  renderCoaView();
  const container = document.getElementById('coaMainContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Ubah Jumlah Baris per Halaman
 */
function setCoaPageSize(newSize) {
  coaViewState.pageSize = newSize;
  coaViewState.page = 1;
  renderCoaView();
}

/**
 * Buka / Tutup Detail Baris Akun
 */
function toggleCoaRowDetail(globalIdx) {
  if (coaViewState.expandedIndices.has(globalIdx)) {
    coaViewState.expandedIndices.delete(globalIdx);
  } else {
    coaViewState.expandedIndices.add(globalIdx);
  }
  renderCoaView();
}

/**
 * Menggunakan Akun dari Baris Tabel langsung ke modal Catat Beban
 */
function useCoaRow(globalIdx) {
  const row = currentRenderedRows[globalIdx];
  if (!row) return;

  const code = (row.kodeSubSubBab && row.kodeSubSubBab !== '-') ? row.kodeSubSubBab : (row.kodeSubBab && row.kodeSubBab !== '-' ? row.kodeSubBab : row.kodeBab);
  const name = (row.namaSubSubBab && row.namaSubSubBab !== '-') ? row.namaSubSubBab : (row.namaSubBab && row.namaSubBab !== '-' ? row.namaSubBab : row.kategoriBab);
  const detail = row.detailPenjelasan || '';
  const tax = row.statusPajak || '-';

  useCoaInTransaction(code, name, detail, tax);
}

/**
 * Menggunakan akun COA langsung ke modal Catat Beban
 */
function useCoaInTransaction(code, name, detail, tax) {
  if (typeof openTransactionModal === 'function') {
    openTransactionModal();
    const select = document.getElementById('fAkunCoa');
    if (select) {
      select.value = code;
      if (!select.value) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = `${code} - ${name}`;
        opt.selected = true;
        select.appendChild(opt);
      }
      select.dispatchEvent(new Event('change'));
    }

    const descInput = document.getElementById('fKeterangan');
    if (descInput && detail && detail !== '-') {
      descInput.value = detail;
    }

    if (typeof showToast === 'function') {
      showToast(`Akun ${code} (${name}) siap dicatat`, 'info');
    }
  }
}

/**
 * Salin kode COA ke clipboard
 */
function copyCoaCode(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      if (typeof showToast === 'function') {
        showToast(`Kode ${code} disalin ke clipboard`, 'info');
      }
    }).catch(() => {});
  }
}

// Expose fungsi-fungsi ke namespace global
window.coaViewState = coaViewState;
window.getActiveCoaFlatList = getActiveCoaFlatList;
window.buildCoaTreeFromFlatList = buildCoaTreeFromFlatList;
window.updateCoaFromData = updateCoaFromData;
window.populateCoaDropdown = populateCoaDropdown;
window.renderCoaView = renderCoaView;
window.renderCoaTable = renderCoaTable;
window.renderCoaTree = renderCoaTree;
window.setCoaViewMode = setCoaViewMode;
window.setCoaBabFilter = setCoaBabFilter;
window.handleCoaSearchInput = handleCoaSearchInput;
window.filterCoaTree = filterCoaTree;
window.setCoaPage = setCoaPage;
window.setCoaPageSize = setCoaPageSize;
window.toggleCoaRowDetail = toggleCoaRowDetail;
window.useCoaRow = useCoaRow;
window.useCoaInTransaction = useCoaInTransaction;
window.copyCoaCode = copyCoaCode;
