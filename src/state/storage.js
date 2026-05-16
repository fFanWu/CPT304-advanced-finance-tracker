export const STORAGE_KEY = "financeTrackerData";
export const STORAGE_VERSION = 1;
export const THEME_KEY = "financeTrackerTheme";

export const isValidTransaction = (tx) => {
  if (tx === null || typeof tx !== "object") return false;
  if (typeof tx.id !== "string" || tx.id.length === 0) return false;
  if (typeof tx.title !== "string" || tx.title.length === 0) return false;
  if (typeof tx.amount !== "number" || !Number.isFinite(tx.amount)) return false;
  if (typeof tx.category !== "string" || tx.category.length === 0) return false;
  if (typeof tx.date !== "string" || tx.date.length === 0) return false;
  return true;
};

export const saveTransactions = (transactions) => {
  try {
    const payload = {
      version: STORAGE_VERSION,
      transactions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      return { ok: false, error: "quota" };
    }
    return { ok: false, error: "unknown" };
  }
};

export const loadTransactions = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { transactions: [], discarded: 0, error: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY + ".corrupt", raw);
    localStorage.removeItem(STORAGE_KEY);
    return { transactions: [], discarded: 0, error: "corrupt_json" };
  }

  let transactions;
  if (Array.isArray(parsed)) {
    transactions = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.transactions)) {
    transactions = parsed.transactions;
  } else {
    localStorage.setItem(STORAGE_KEY + ".corrupt", raw);
    localStorage.removeItem(STORAGE_KEY);
    return { transactions: [], discarded: 0, error: "unrecognized_format" };
  }

  const valid = transactions.filter(isValidTransaction);
  const discarded = transactions.length - valid.length;
  return { transactions: valid, discarded, error: null };
};

export const saveTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
};

export const loadTheme = () => {
  return localStorage.getItem(THEME_KEY) || "dark";
};
