/**
 * js/modules/coa.js
 * Chart of Accounts (COA) Hierarchy Renderer, Dynamic Sync, and Search
 * Disesuaikan persis dengan skema: COA_Operating_Expenses_SO_2021_ASTRA
 */

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

    // Lewati baris header BAB murni jika tidak memiliki sub-bab dan sub-sub-bab
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
      // Jika Sub-Bab ini memiliki anak Sub-Sub-Bab di baris lain, baris ini hanyalah header Sub-Bab
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

  // Konversi menjadi array hierarki terstruktur
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
 * Render tampilan pohon kamus COA dengan dukungan pencarian & badge detail presisi
 */
function renderCoaTree(filterKeyword = '') {
  const coaContainer = document.getElementById('coaTreeContainer');
  if (!coaContainer) return;

  const kw = filterKeyword.toLowerCase().trim();
  const db = window.appState.masterCoaTree || window.astraCoaDatabase || [];

  const html = db.map(group => {
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
                  <div class="p-2.5 border border-slate-200/40 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all space-y-1">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-blue-600 dark:text-blue-400 font-bold tracking-tight">${acc.code}</span>
                        <span class="font-sans font-semibold text-slate-800 dark:text-slate-200">${acc.name}</span>
                      </div>
                      <div class="flex items-center gap-1.5 flex-shrink-0">
                        ${acc.tax && acc.tax !== '-' ? `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">${acc.tax}</span>` : ''}
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">${acc.cc || 'Opex'}</span>
                        <span class="text-[10px] text-emerald-500 font-bold">Posting Leaf</span>
                      </div>
                    </div>
                    ${acc.detail && acc.detail !== '-' ? `<p class="font-sans text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${acc.detail}</p>` : ''}
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
