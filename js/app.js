/**
 * js/app.js
 * ExpenseFlow Astra SO 2021 — Main Application Bootstrap & Router
 */

function switchView(viewKey) {
  const views = ['dashboard', 'coa', 'approvals', 'account'];
  
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    
    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) {
      navEl.classList.remove('bg-blue-600/10', 'text-blue-600', 'dark:text-blue-400', 'border-blue-500/20');
      navEl.classList.add('text-slate-600', 'dark:text-slate-400');
    }

    const mobEl = document.getElementById(`mobile-nav-${v}`);
    if (mobEl) {
      mobEl.classList.remove('text-blue-600', 'dark:text-blue-400');
      mobEl.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });

  const activeEl = document.getElementById(`view-${viewKey}`);
  if (activeEl) activeEl.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-${viewKey}`);
  if (activeNav) {
    activeNav.classList.add('bg-blue-600/10', 'text-blue-600', 'dark:text-blue-400', 'border-blue-500/20');
    activeNav.classList.remove('text-slate-600', 'dark:text-slate-400');
  }

  const activeMob = document.getElementById(`mobile-nav-${viewKey}`);
  if (activeMob) {
    activeMob.classList.add('text-blue-600', 'dark:text-blue-400');
    activeMob.classList.remove('text-slate-500', 'dark:text-slate-400');
  }

  const titleEl = document.getElementById('pageTitle');
  const subEl = document.getElementById('pageSubtitle');
  if (viewKey === 'dashboard') {
    if (titleEl) titleEl.textContent = 'Buku Beban Operasional';
    if (subEl) subEl.textContent = 'Astra Sales Operation (SO 2021) • Selling & G&A';
  } else if (viewKey === 'coa') {
    if (titleEl) titleEl.textContent = 'Kamus Master COA Astra SO';
    if (subEl) subEl.textContent = 'Master COA Opex 2021 Presisi Full • Standar Astra Sales Operation';
    if (typeof renderCoaView === 'function') renderCoaView();
    if (typeof fetchFromGoogleSheets === 'function' && StorageManager.getGasUrl()) {
      fetchFromGoogleSheets(false);
    }
  } else if (viewKey === 'approvals') {
    if (titleEl) titleEl.textContent = 'Persetujuan Kode Akun';
    if (subEl) subEl.textContent = 'Antrean Otorisasi Dual-Control Controller';
  } else if (viewKey === 'account') {
    if (titleEl) titleEl.textContent = 'Pengaturan & Akun Astra SO';
    if (subEl) subEl.textContent = 'Akses Admin, Preferensi Tema & Sinkronisasi Database';
    if (typeof updateAccountViewStats === 'function') updateAccountViewStats();
    if (typeof updateThemeUi === 'function') updateThemeUi();
  }

  const scrollContainer = document.getElementById('workspaceScrollContainer');
  if (scrollContainer) scrollContainer.scrollTop = 0;
}

// Global router exposure
window.switchView = switchView;

// Application Lifecycle Initialization
window.addEventListener('DOMContentLoaded', () => {
  // 1. Set default transaction date to today
  const dateInput = document.getElementById('fTanggal');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 2. Load API & Security Token Configuration
  const savedGas = StorageManager.getGasUrl();
  const savedToken = StorageManager.getApiToken();
  const cfgGasInput = document.getElementById('cfgGasUrl');
  const cfgTokenInput = document.getElementById('cfgApiToken');
  if (cfgGasInput && savedGas) cfgGasInput.value = savedGas;
  if (cfgTokenInput && savedToken) cfgTokenInput.value = savedToken;

  // 3. Load locally cached transactions, proposals, and master COA
  window.appState.transactions = StorageManager.loadTransactions();
  window.appState.proposals = StorageManager.loadProposals();
  const cachedCoa = StorageManager.loadMasterCoa();
  if (cachedCoa && typeof updateCoaFromData === 'function') {
    updateCoaFromData(cachedCoa);
  } else if (typeof populateCoaDropdown === 'function') {
    populateCoaDropdown();
  }

  // 4. Initialize UI Subsystems
  initTheme();
  renderDashboard();
  if (typeof renderCoaView === 'function') {
    renderCoaView();
  } else if (typeof renderCoaTree === 'function') {
    renderCoaTree();
  }
  renderApprovalQueue();

  // 5. Automatic Live Sync with Google Apps Script if configured
  if (savedGas) {
    fetchFromGoogleSheets(false);
  }

  // 6. Periodic Background Sync (Realtime update setiap 45 detik)
  setInterval(() => {
    if (typeof fetchFromGoogleSheets === 'function' && StorageManager.getGasUrl()) {
      fetchFromGoogleSheets(false);
    }
  }, 45000);

  // 7. Keyboard Shortcuts Listener (Accessibility & Power Users)
  document.addEventListener('keydown', (e) => {
    // Ctrl+K atau Cmd+K membuka pencarian cerdas dari mana saja
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (typeof openSearchModal === 'function') openSearchModal();
      return;
    }

    // Tombol '/' saat tidak sedang fokus di form
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (typeof openSearchModal === 'function') openSearchModal();
      return;
    }

    // Abaikan tombol navigasi jika sedang mengetik di input/textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        if (typeof closeSearchModal === 'function') closeSearchModal();
        closeTransactionModal();
        closeProposalDrawer();
        closeScriptModal();
      }
      return;
    }

    if (e.key === 'd' || e.key === 'D') {
      switchView('dashboard');
    } else if (e.key === 'k' || e.key === 'K') {
      switchView('coa');
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (typeof openSearchModal === 'function') openSearchModal();
    } else if (e.key === 'Escape') {
      if (typeof closeSearchModal === 'function') closeSearchModal();
      closeTransactionModal();
      closeProposalDrawer();
      closeScriptModal();
    }
  });
});

