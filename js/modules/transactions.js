/**
 * js/modules/transactions.js
 * Expense Transaction Handling & Smart Intent Classification
 */

function triggerSmartIntent(text) {
  const q = text.toLowerCase();
  const card = document.getElementById('smartSuggestionCard');
  if (!card) return;

  const keywords = window.intentKeywords || [];
  let matched = null;

  for (const item of keywords) {
    if (item.trigger.some(k => q.includes(k))) {
      matched = item;
      break;
    }
  }

  if (matched && q.length > 2) {
    window.appState.pendingSuggestion = matched;
    const nameEl = document.getElementById('suggestedAccountName');
    const scoreEl = document.getElementById('suggestedMatchScore');
    if (nameEl) nameEl.textContent = matched.name;
    if (scoreEl) scoreEl.textContent = matched.score;
    card.classList.remove('hidden');
  } else {
    window.appState.pendingSuggestion = null;
    card.classList.add('hidden');
  }
}

function applySuggestedAccount() {
  const suggestion = window.appState.pendingSuggestion;
  if (suggestion) {
    const coaSelect = document.getElementById('fAkunCoa');
    if (coaSelect) coaSelect.value = suggestion.coa;
    const card = document.getElementById('smartSuggestionCard');
    if (card) card.classList.add('hidden');
    showToast(`Akun terpilih: ${suggestion.name}`, 'info');
  }
}

function handleSaveExpense(e) {
  e.preventDefault();
  const coaSelect = document.getElementById('fAkunCoa');
  const coaCode = coaSelect.value;
  const coaText = coaSelect.options[coaSelect.selectedIndex]?.text.split(' - ')[1] || 'Beban Operasional';
  const costCenter = document.getElementById('fCostCenter').value;
  const amount = parseInt(document.getElementById('fNominal').value, 10);
  const desc = document.getElementById('fKeterangan').value;
  const date = document.getElementById('fTanggal').value;
  const source = document.getElementById('fSumberDana').value;
  const ref = document.getElementById('fNoRef').value || `SO-EXP/26/${Math.floor(100 + Math.random() * 900)}`;

  const newTx = {
    id: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date,
    ref,
    coa: coaCode,
    coaName: coaText,
    category: coaCode.startsWith('71') ? '7100' : coaCode.substring(0, 4),
    costCenter,
    desc,
    amount,
    source,
    status: 'POSTED'
  };

  window.appState.transactions.unshift(newTx);
  StorageManager.saveTransactions(window.appState.transactions);

  renderDashboard();
  closeTransactionModal();

  const form = document.getElementById('expenseForm');
  if (form) form.reset();

  const dateInput = document.getElementById('fTanggal');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  showToast('Transaksi berhasil dicatat dan disimpan!', 'success');

  // Sync to Google Sheets if configured
  if (typeof syncToGoogleSheets === 'function') {
    syncToGoogleSheets(newTx);
  }
}

// Expose globally
window.triggerSmartIntent = triggerSmartIntent;
window.applySuggestedAccount = applySuggestedAccount;
window.handleSaveExpense = handleSaveExpense;

