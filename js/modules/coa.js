/**
 * js/modules/coa.js
 * Chart of Accounts (COA) Hierarchy Renderer & Search
 */

function renderCoaTree(filterKeyword = '') {
  const coaContainer = document.getElementById('coaTreeContainer');
  if (!coaContainer) return;

  const kw = filterKeyword.toLowerCase().trim();
  const db = window.astraCoaDatabase || [];

  const html = db.map(group => {
    const filteredSubgroups = group.subgroups.map(sg => {
      const matchedAccounts = sg.accounts.filter(a => 
        kw === '' || 
        a.code.includes(kw) || 
        a.name.toLowerCase().includes(kw) || 
        a.cc.toLowerCase().includes(kw)
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
              <div class="pl-4 border-l-2 ${group.color === 'indigo' ? 'border-indigo-500/30' : 'border-blue-500/30'} space-y-1.5 text-xs font-mono">
                ${sg.accounts.map(acc => `
                  <div class="flex items-center justify-between py-1 border-b border-slate-200/40 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <div class="flex items-center gap-2">
                      <span class="text-blue-600 dark:text-blue-400 font-bold">${acc.code}</span>
                      <span class="font-sans text-slate-700 dark:text-slate-300">${acc.name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">${acc.cc}</span>
                      <span class="text-[10px] text-emerald-500 font-bold">Posting Leaf</span>
                    </div>
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
window.renderCoaTree = renderCoaTree;
window.filterCoaTree = filterCoaTree;

