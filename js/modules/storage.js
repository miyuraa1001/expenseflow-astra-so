/**
 * js/modules/storage.js
 * State Management & LocalStorage Persistence
 */

const STORAGE_KEYS = {
  GAS_URL: 'EF_GAS_URL',
  API_TOKEN: 'EF_API_TOKEN',
  TRANSACTIONS: 'EF_TRANSACTIONS',
  PROPOSALS: 'EF_PROPOSALS',
  MASTER_COA: 'EF_MASTER_COA',
  THEME: 'EF_THEME'
};

// Global reactive application state
window.appState = {
  transactions: [],
  proposals: [],
  masterCoa: [],
  masterCoaTree: null,
  activeFilter: 'ALL',
  periodFilter: 'ALL',
  searchQuery: '',
  pendingSuggestion: null
};

// Backwards compatibility aliases for existing functions
Object.defineProperty(window, 'transactions', {
  get() { return window.appState.transactions; },
  set(val) { window.appState.transactions = val; }
});

Object.defineProperty(window, 'proposals', {
  get() { return window.appState.proposals; },
  set(val) { window.appState.proposals = val; }
});

Object.defineProperty(window, 'activeFilter', {
  get() { return window.appState.activeFilter; },
  set(val) { window.appState.activeFilter = val; }
});

Object.defineProperty(window, 'searchQuery', {
  get() { return window.appState.searchQuery; },
  set(val) { window.appState.searchQuery = val; }
});

Object.defineProperty(window, 'pendingSuggestion', {
  get() { return window.appState.pendingSuggestion; },
  set(val) { window.appState.pendingSuggestion = val; }
});

const StorageManager = {
  loadTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Storage: Error parsing transactions:', e);
      return [];
    }
  },

  saveTransactions(txs) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch (e) {
      console.warn('Storage: Error saving transactions:', e);
    }
  },

  loadProposals() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Storage: Error parsing proposals:', e);
      return [];
    }
  },

  saveProposals(props) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(props));
    } catch (e) {
      console.warn('Storage: Error saving proposals:', e);
    }
  },

  loadMasterCoa() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTER_COA);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Deteksi cache format 8-digit usang tanpa titik (misal 71101000)
        const hasLegacy = parsed.some(item => {
          const code = String(item.kodeCOA || item.code || '');
          return code && !code.includes('.') && code.length === 8;
        });
        if (hasLegacy) {
          console.info('Storage: Mengosongkan cache COA format 8-digit usang...');
          localStorage.removeItem(STORAGE_KEYS.MASTER_COA);
          return null;
        }
      }
      return parsed;
    } catch (e) {
      console.warn('Storage: Error parsing master COA:', e);
      return null;
    }
  },

  saveMasterCoa(coaData) {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTER_COA, JSON.stringify(coaData));
    } catch (e) {
      console.warn('Storage: Error saving master COA:', e);
    }
  },

  getGasUrl() {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  },

  setGasUrl(url) {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url);
  },

  getApiToken() {
    return localStorage.getItem(STORAGE_KEYS.API_TOKEN) || '';
  },

  setApiToken(token) {
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, token);
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};

window.STORAGE_KEYS = STORAGE_KEYS;
window.StorageManager = StorageManager;
