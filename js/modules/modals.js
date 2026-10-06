/**
 * js/modules/modals.js
 * Modal & Drawer Dialog Controllers
 */

function openTransactionModal() {
  const modal = document.getElementById('transactionModal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('fKeterangan');
    if (input) input.focus();
  }
}

function closeTransactionModal() {
  const modal = document.getElementById('transactionModal');
  if (modal) modal.classList.add('hidden');

  const card = document.getElementById('smartSuggestionCard');
  if (card) card.classList.add('hidden');
}

function openProposalDrawer() {
  const backdrop = document.getElementById('proposalDrawerBackdrop');
  const drawer = document.getElementById('proposalDrawer');
  if (backdrop) backdrop.classList.remove('hidden');
  if (drawer) drawer.classList.remove('translate-x-full');
}

function closeProposalDrawer() {
  const backdrop = document.getElementById('proposalDrawerBackdrop');
  const drawer = document.getElementById('proposalDrawer');
  if (backdrop) backdrop.classList.add('hidden');
  if (drawer) drawer.classList.add('translate-x-full');
}

function openScriptModal() {
  const modal = document.getElementById('scriptModal');
  if (modal) modal.classList.remove('hidden');
}

function closeScriptModal() {
  const modal = document.getElementById('scriptModal');
  if (modal) modal.classList.add('hidden');
}

function copyGasScript() {
  const codeEl = document.getElementById('gasSourceCode');
  if (!codeEl) return;
  const code = codeEl.innerText;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast('Kode kode.gs disalin ke clipboard!', 'success');
    }).catch(() => {
      fallbackCopy(code);
    });
  } else {
    fallbackCopy(code);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Kode kode.gs disalin ke clipboard!', 'success');
  } catch (err) {
    showToast('Gagal menyalin kode.', 'error');
  }
  document.body.removeChild(ta);
}

// Expose globally
window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.openProposalDrawer = openProposalDrawer;
window.closeProposalDrawer = closeProposalDrawer;
window.openScriptModal = openScriptModal;
window.closeScriptModal = closeScriptModal;
window.copyGasScript = copyGasScript;

