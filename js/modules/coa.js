/**
 * js/modules/coa.js
 * Chart of Accounts (COA) Hierarchy Renderer, Dynamic Sync, and Search
 */

/**
 * Mengubah flat list dari Google Spreadsheet menjadi hierarki pohon COA bertingkat
 * (BAB -> Sub-Bab -> Akun Leaf)
 */
function buildCoaTreeFromFlatList(flatList) {
  if (!Array.isArray(flatList) || flatList.length === 0) return null;

  const babGroups = {};

  flatList.forEach(item => {
    const babCode = item.kodeBab || (item.kodeCOA ? item.kodeCOA.substring(0, 2) + '000000' : '72000000');
    let babName = item.kategoriBab || (babCode.startsWith('71') ? 'SELLING EXPENSES (SE) - BEBAN PENJUALAN' : 'GENERAL & ADMINISTRATIVE (G&A) - BEBAN UMUM & ADMINISTRASI');
    const color = babCode.startsWith('71') ? 'indigo' : 'blue';

    if (!babGroups[babCode]) {
      babGroups[babCode] = {
        groupCode: babCode,
        groupName: babName,
        color: color,
        subgroupsMap: {}
      };
    }

    const subBabCode = item.kodeSubBab || (item.kodeCOA ? item.kodeCOA.substring(0, 4) + '0000' : babCode);
    const subBabName = item.namaSubBab || 'Beban Operasional Lainnya';

    if (!babGroups[babCode].subgroupsMap[subBabCode]) {
      babGroups[babCode].subgroupsMap[subBabCode] = {
        code: subBabCode,
        name: subBabName,
        accounts: []
      };
    }

    // Pastikan akun leaf memiliki kode dan nama
    const accCode = item.kodeCOA || item.kodeSubSubBab;
    const accName = item.namaAkun || item.namaSubSubBab;

    if (accCode && accName) {
      // Hindari duplikat akun
      const exists = babGroups[babCode].subgroupsMap[subBabCode].accounts.some(a => a.code === accCode);
      if (!exists) {
        babGroups[babCode].subgroupsMap[subBabCode].accounts.push({
          code: accCode,
          name: accName,
          cc: item.catatanPosting || 'CC-720 GA',
          tax: item.statusPajak || '-',
          detail: item.detailPenjelasan || '',
          example: item.contohRedaksi || ''
        });
      }
    }
  });

  // Susun kembali menjadi array
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

  if (coaTree && Array.isArray(coaTree)) {
    window.appState.masterCoaTree = coaTree;
  } else if (Array.isArray(coaList) && coaList.length > 0) {
    window.appState.masterCoaTree = buildCoaTreeFromFlatList(coaList);
  }

  renderCoaTree();
  populateCoaDropdown(coaList);
}

/**
 * Sinkronkan dropdown pilihan akun pada formulir Catat Beban (#fAkunCoa)
 */
function populateCoaDropdown(coaList) {
  const selectEl = document.getElementById('fAkunCoa');
  if (!selectEl) return;

  const tree = window.appState.masterCoaTree || window.astraCoaDatabase;
  if (!tree || tree.length === 0) return;

  const currentValue = selectEl.value;
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
 * Render tampilan pohon kamus COA dengan dukungan pencarian & badge detail
 */
function renderCoaTree(filterKeyword = '') {
  const coaContainer = document.getElementById('coaTreeContainer');
  if (!coaContainer) return;

  const kw = filterKeyword.toLowerCase().trim();
  // Prioritaskan master COA dari database Spreadsheet jika ada, fallback ke static data
  const db = window.appState.masterCoaTree || window.astraCoaDatabase || [];

  const html = db.map(group => {
    const filteredSubgroups = group.subgroups.map(sg => {
      const matchedAccounts = sg.accounts.filter(a => 
        kw === '' || 
        a.code.includes(kw) || 
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
          <div class="flex items-center gap-2 font-mono font-bold text-xs ${group.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}">
            <span class="w-2.5 h-2.5 rounded-full ${group.color === 'indigo' ? 'bg-indigo-500' : 'bg-blue-500'}"></span>
            <span>${group.groupCode} &bull; ${group.groupName}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">Header Level 1</span>
        </div>

        <div class="space-y-4">
          ${subgroupsToRender.map(sg => `
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span class="font-mono text-slate-500 dark:text-slate-400 text-[11px]">${sg.code}</span>
                <span class="flex-1 ml-2">${sg.name}</span>
              </div>
              <div class="pl-4 border-l-2 ${group.color === 'indigo' ? 'border-indigo-500/30' : 'border-blue-500/30'} space-y-2 text-xs font-mono">
                ${sg.accounts.map(acc => `
                  <div class="p-2.5 border border-slate-200/40 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all space-y-1">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-blue-600 dark:text-blue-400 font-bold">${acc.code}</span>
                        <span class="font-sans font-medium text-slate-800 dark:text-slate-200">${acc.name}</span>
                      </div>
                      <div class="flex items-center gap-1.5 flex-shrink-0">
                        ${acc.tax && acc.tax !== '-' ? `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">${acc.tax}</span>` : ''}
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">${acc.cc || 'CC-720 GA'}</span>
                        <span class="text-[10px] text-emerald-500 font-bold">Posting Leaf</span>
                      </div>
                    </div>
                    ${acc.detail ? `<p class="font-sans text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${acc.detail}</p>` : ''}
                    ${acc.example ? `<p class="font-mono text-[10px] text-slate-400 dark:text-slate-500">Cth: "${acc.example}"</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  coaContainer.innerHTML = html || `<div class="p-8 text-center text-xs text-slate-400 glass-panel rounded-2xl">Tidak ada kode akun COA yang cocok dengan kata kunci "${filterKeyword}"</div>`;
}

function filterCoaTree(val) {
  renderCoaTree(val);
}

// Expose globally
window.buildCoaTreeFromFlatList = buildCoaTreeFromFlatList;
window.updateCoaFromData = updateCoaFromData;
window.populateCoaDropdown = populateCoaDropdown;
window.renderCoaTree = renderCoaTree;
window.filterCoaTree = filterCoaTree;
