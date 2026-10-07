/**
 * js/modules/coa.js
 * Chart of Accounts (COA) Master Database Renderer & Controller
 * Mendukung Tampilan Tabel Database Presisi 10-Kolom (Google Sheet COA OPEX 2021 Presisi Full)
 * serta Tampilan Pohon Hierarki & Integrasi ke Form Catat Beban
 */

// State internal tampilan Kamus COA
const coaViewState = {
  mode: 'table',       // 'table' (default) atau 'tree'
  keyword: '',
  activeBab: 'ALL'     // 'ALL', '700', '710', '720'
};

/**
 * Mengambil daftar data flat COA (dari Google Sheets cache atau database baku Astra)
 */
function getActiveCoaFlatList() {
  if (Array.isArray(window.appState.masterCoa) && window.appState.masterCoa.length > 0) {
    return window.appState.masterCoa;
  }
  if (Array.isArray(window.astraCoaFlatDatabase) && window.astraCoaFlatDatabase.length > 0) {
    return window.astraCoaFlatDatabase;
  }
  return [];
}

/**
 * Mengubah flat list dari Google Spreadsheet menjadi hierarki pohon COA bertingkat
 * (BAB -> Sub-Bab -> Akun Leaf)
 */
function buildCoaTreeFromFlatList(flatList) {
  if (!Array.isArray(flatList) || flatList.length === 0) return null;

  // Pass 1: Identifikasi Sub-Bab yang memiliki anak Sub-Sub-Bab
  const subBabsWithChildren = new Set();
  flatList.forEach(item => {
    const subSub = item.kodeSubSubBab && String(item.kodeSubSubBab).trim() !== '-' ? String(item.kodeSubSubBab).trim() : '';
    const sub = item.kodeSubBab && String(item.kodeSubBab).trim() !== '-' ? String(item.kodeSubBab).trim() : '';
    if (subSub && sub) {
      subBabsWithChildren.add(sub);
    }
  });

  const babGroups = {};

  // Pass 2: Bangun kelompok BAB, Sub-Bab, dan Akun Leaf
  flatList.forEach(item => {
    const rawBabCode = String(item.kodeBab || '').trim();
    const rawBabName = String(item.kategoriBab || '').trim();
    const rawSubBabCode = String(item.kodeSubBab || '').trim();
    const rawSubBabName = String(item.namaSubBab || '').trim();
    const rawSubSubCode = String(item.kodeSubSubBab || '').trim();
    const rawSubSubName = String(item.namaSubSubBab || '').trim();

    // Lewati baris header BAB murni tanpa sub-bab
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

    // Tentukan kode dan nama akun leaf yang valid
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
    // Bangun optgroup berdasarkan BAB dari flat list
    const babGroups = {};
    flatList.forEach(item => {
      // Hanya masukkan akun yang bisa diposting (Sub-Sub-Bab ada atau Sub-Bab tanpa sub-sub)
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

  // Fallback ke Master Tree jika ada
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
 * Render Kamus COA Utama (memilih antara Table View atau Tree View)
 */
function renderCoaView() {
  const container = document.getElementById('coaMainContainer') || document.getElementById('coaTreeContainer');
  if (!container) return;

  if (coaViewState.mode === 'table') {
    renderCoaTable(container, coaViewState.keyword, coaViewState.activeBab);
  } else {
    renderCoaTree(container, coaViewState.keyword, coaViewState.activeBab);
  }
}

/**
 * Render Tampilan Tabel Database Presisi (Sesuai 10 Kolom Google Sheet COA Astra SO)
 */
function renderCoaTable(container, filterKeyword = '', babFilter = 'ALL') {
  const kw = (filterKeyword || '').toLowerCase().trim();
  const rawList = getActiveCoaFlatList();

  // Filter berdasarkan BAB dan Kata Kunci
  const filteredList = rawList.filter(row => {
    // 1. Filter BAB
    if (babFilter !== 'ALL') {
      const rowBab = String(row.kodeBab || '').trim();
      if (!rowBab.startsWith(babFilter)) return false;
    }

    // 2. Filter Keyword
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

  // Bangun Tabel Presisi 10 Kolom
  const tableRowsHtml = filteredList.map((row, idx) => {
    const isBabHeader = (!row.kodeSubBab || row.kodeSubBab === '-') && (!row.kodeSubSubBab || row.kodeSubSubBab === '-');
    const isSubBabHeader = row.kodeSubBab && row.kodeSubBab !== '-' && (!row.kodeSubSubBab || row.kodeSubSubBab === '-') && String(row.catatanPosting || '').toLowerCase().includes('sub-bab');
    const isLeaf = (row.kodeSubSubBab && row.kodeSubSubBab !== '-') || (!isBabHeader && !isSubBabHeader);

    // Tentukan kode posting aktif jika akun ini adalah leaf
    const postingCode = (row.kodeSubSubBab && row.kodeSubSubBab !== '-') ? row.kodeSubSubBab : (row.kodeSubBab && row.kodeSubBab !== '-' ? row.kodeSubBab : '');
    const postingName = (row.namaSubSubBab && row.namaSubSubBab !== '-') ? row.namaSubSubBab : (row.namaSubBab && row.namaSubBab !== '-' ? row.namaSubBab : row.kategoriBab);

    // Pewarnaan baris
    let rowClass = 'hover:bg-blue-500/5 transition-colors border-b border-slate-200/40 dark:border-white/5';
    if (isBabHeader) {
      rowClass = 'bg-slate-100/70 dark:bg-white/5 font-semibold border-b border-slate-200/70 dark:border-white/10';
    }

    // Badge status pajak
    let taxBadge = `<span class="text-slate-400 dark:text-slate-500">-</span>`;
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

    // Badge posting
    let postingBadge = `<span class="text-slate-400 text-[10px]">-</span>`;
    const posting = String(row.catatanPosting || '').trim();
    if (posting) {
      if (posting.includes('Category') || isBabHeader) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">BAB Header</span>`;
      } else if (posting.includes('SAP-HR')) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20 whitespace-nowrap">${posting}</span>`;
      } else if (isSubBabHeader) {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">Sub-Bab</span>`;
      } else {
        postingBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">${posting}</span>`;
      }
    }

    // Tombol Aksi
    let actionButtons = '';
    if (isLeaf && postingCode) {
      actionButtons = `
        <div class="flex items-center gap-1.5 justify-end">
          <button 
            type="button" 
            onclick="useCoaInTransaction('${postingCode}', '${postingName.replace(/'/g, "\\'")}', '${(row.detailPenjelasan || '').replace(/'/g, "\\'")}', '${tax}')" 
            title="Gunakan akun ini untuk mencatat beban"
            class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1"
          >
            <span>Gunakan</span>
          </button>
          <button 
            type="button" 
            onclick="copyCoaCode('${postingCode}')" 
            title="Salin kode COA" 
            class="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625V7.875c0-.621.504-1.125 1.125-1.125H7.5m8.25 10.375l3.75-3.75m0 0l-3.75-3.75m3.75 3.75H10.5"/></svg>
          </button>
        </div>
      `;
    }

    return `
      <tr class="${rowClass}">
        <td class="py-3 px-3 text-center font-mono text-[11px] text-slate-400 select-none">${idx + 1}</td>
        <td class="py-3 px-3 font-mono font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">${row.kodeBab || '-'}</td>
        <td class="py-3 px-3 font-semibold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">${row.kategoriBab || '-'}</td>
        <td class="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">${row.kodeSubBab && row.kodeSubBab !== '-' ? row.kodeSubBab : '<span class="text-slate-300 dark:text-slate-600">-</span>'}</td>
        <td class="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">${row.namaSubBab && row.namaSubBab !== '-' ? row.namaSubBab : '<span class="text-slate-300 dark:text-slate-600">-</span>'}</td>
        <td class="py-3 px-3 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">${row.kodeSubSubBab && row.kodeSubSubBab !== '-' ? row.kodeSubSubBab : '<span class="text-slate-300 dark:text-slate-600">-</span>'}</td>
        <td class="py-3 px-3 font-semibold text-xs text-slate-900 dark:text-white whitespace-nowrap">${row.namaSubSubBab && row.namaSubSubBab !== '-' ? row.namaSubSubBab : '<span class="text-slate-300 dark:text-slate-600">-</span>'}</td>
        <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 min-w-[240px] max-w-[360px] leading-relaxed">
          ${row.detailPenjelasan && row.detailPenjelasan !== '-' ? row.detailPenjelasan : '<span class="text-slate-400">-</span>'}
        </td>
        <td class="py-3 px-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 min-w-[200px] max-w-[300px]">
          ${row.contohRedaksi && row.contohRedaksi !== '-' ? `"${row.contohRedaksi}"` : '<span class="text-slate-400">-</span>'}
        </td>
        <td class="py-3 px-3 text-center">${taxBadge}</td>
        <td class="py-3 px-3 text-center">${postingBadge}</td>
        <td class="py-3 px-3 text-right whitespace-nowrap">${actionButtons}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="glass-panel rounded-2xl overflow-hidden shadow-sm">
      <!-- Header Info Bar -->
      <div class="px-5 py-3 border-b border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/5 dark:bg-white/5">
        <div class="flex items-center gap-2 text-xs font-mono">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-slate-800 dark:text-slate-200">Menampilkan ${filteredList.length} dari ${rawList.length} Baris Akun</span>
          <span class="text-slate-400 dark:text-slate-500">&bull; Sheet: COA OPEX 2021 Presisi Full</span>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Struktur: BAB &bull; Sub-Bab &bull; Sub-Sub-Bab (Leaf)</span>
        </div>
      </div>

      <!-- Responsive Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-3 whitespace-nowrap">Kode BAB</th>
              <th class="py-3 px-3 whitespace-nowrap">Nama Kategori BAB</th>
              <th class="py-3 px-3 whitespace-nowrap">Kode Sub-Bab</th>
              <th class="py-3 px-3 whitespace-nowrap">Nama Sub-Bab</th>
              <th class="py-3 px-3 whitespace-nowrap">Kode Sub-Sub</th>
              <th class="py-3 px-3 whitespace-nowrap">Nama Sub-Sub-Bab</th>
              <th class="py-3 px-3 min-w-[240px]">Detail Penjelasan & Coverage</th>
              <th class="py-3 px-3 min-w-[200px]">Contoh Redaksi Teks</th>
              <th class="py-3 px-3 text-center whitespace-nowrap">Status Pajak</th>
              <th class="py-3 px-3 text-center whitespace-nowrap">Catatan Sistem</th>
              <th class="py-3 px-3 text-right whitespace-nowrap w-24">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/40 dark:divide-white/5 font-sans">
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Table Summary Footer -->
      <div class="p-3.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5">
        <span>Astra Sales Operation (SO 2021) Master Database</span>
        <span>${filteredList.length} baris data aktif</span>
      </div>
    </div>
  `;
}

/**
 * Render tampilan pohon kamus COA dengan hierarki bertingkat
 */
function renderCoaTree(container, filterKeyword = '', babFilter = 'ALL') {
  const kw = (filterKeyword || '').toLowerCase().trim();
  const db = window.appState.masterCoaTree || window.astraCoaDatabase || [];

  const html = db.map(group => {
    // Filter BAB
    if (babFilter !== 'ALL' && !group.groupCode.startsWith(babFilter)) {
      return '';
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
                          class="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-all"
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
 * Pengganti view mode antara Table dan Tree
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
 * Handle input pencarian langsung di tab Kamus COA
 */
function handleCoaSearchInput(val) {
  coaViewState.keyword = val;
  renderCoaView();
}

function filterCoaTree(val) {
  handleCoaSearchInput(val);
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
      // Auto pilih jika opsi sudah ada di select
      if (!select.value) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = `${code} - ${name}`;
        opt.selected = true;
        select.appendChild(opt);
      }
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
window.useCoaInTransaction = useCoaInTransaction;
window.copyCoaCode = copyCoaCode;
