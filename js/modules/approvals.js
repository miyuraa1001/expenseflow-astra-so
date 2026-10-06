/**
 * js/modules/approvals.js
 * Dual-Control Approval Workflow for COA Proposals
 */

function handleSaveProposal(e) {
  e.preventDefault();
  const nameInput = document.getElementById('pNamaAkun');
  const parentInput = document.getElementById('pParentCat');
  const justInput = document.getElementById('pJustifikasi');

  const name = nameInput.value.trim();
  const parent = parentInput.value;
  const justification = justInput.value.trim();

  const newProposal = {
    id: `PROP-${Date.now()}`,
    name,
    parent,
    justification,
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING'
  };

  window.appState.proposals.unshift(newProposal);
  StorageManager.saveProposals(window.appState.proposals);

  closeProposalDrawer();
  const form = document.getElementById('proposalForm');
  if (form) form.reset();

  renderApprovalQueue();
  renderDashboard();
  showToast(`Pengajuan akun "${name}" berhasil dikirim ke antrean.`, 'success');
}

function renderApprovalQueue() {
  const container = document.getElementById('approvalQueueContainer');
  if (!container) return;

  const pendingProposals = window.appState.proposals.filter(p => p.status === 'PENDING');
  const badgeDesk = document.getElementById('badgeDesktopApprovals');
  const dotMob = document.getElementById('mobileBadgeDot');

  if (badgeDesk) {
    badgeDesk.textContent = pendingProposals.length;
    if (pendingProposals.length > 0) {
      badgeDesk.className = 'px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400';
    } else {
      badgeDesk.className = 'px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-400';
    }
  }

  if (dotMob) {
    if (pendingProposals.length > 0) {
      dotMob.classList.remove('hidden');
    } else {
      dotMob.classList.add('hidden');
    }
  }

  if (pendingProposals.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center glass-panel rounded-2xl space-y-2">
        <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
        </div>
        <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100">Semua Kode Akun Terotorisasi</h4>
        <p class="text-[11px] text-slate-400">Tidak ada pengajuan akun baru yang tertunda dalam antrean saat ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingProposals.map(item => `
    <div class="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-500 font-bold">PENDING APPROVAL</span>
          <span class="font-mono text-xs text-slate-400">Diajukan: ${item.date}</span>
        </div>
        <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1">${item.name}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parent: ${item.parent} &bull; Justifikasi: ${item.justification}</p>
      </div>
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button onclick="approveProposal('${item.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm">
          Setujui Akun
        </button>
        <button onclick="rejectProposal('${item.id}')" class="px-3 py-1.5 rounded-xl glass-panel text-rose-500 hover:bg-rose-500/10 font-semibold text-xs">
          Tolak
        </button>
      </div>
    </div>
  `).join('');
}

function approveProposal(id) {
  window.appState.proposals = window.appState.proposals.map(p => 
    p.id === id ? { ...p, status: 'APPROVED' } : p
  );
  StorageManager.saveProposals(window.appState.proposals);

  renderApprovalQueue();
  renderDashboard();
  showToast('Akun berhasil diotorisasi dan disetujui!', 'success');
}

function rejectProposal(id) {
  window.appState.proposals = window.appState.proposals.filter(p => p.id !== id);
  StorageManager.saveProposals(window.appState.proposals);

  renderApprovalQueue();
  renderDashboard();
  showToast('Pengajuan akun telah ditolak.', 'info');
}

// Expose globally
window.handleSaveProposal = handleSaveProposal;
window.renderApprovalQueue = renderApprovalQueue;
window.approveProposal = approveProposal;
window.rejectProposal = rejectProposal;

