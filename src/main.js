import { generateID } from "./utils/format.js";
import { validateTransactionInput } from "./state/validation.js";
import {
  loadTransactions,
  saveTransactions,
  saveTheme as persistTheme,
  loadTheme as retrieveTheme,
} from "./state/storage.js";
import { renderSummary, renderTransactions } from "./render/render.js";
import { renderChart } from "./render/chart.js";
import { hasConsented } from "./consent/consent.js";
import { initBanner } from "./consent/banner.js";
import {
  initI18n,
  setLang,
  getLang,
  t,
  applyTranslations,
  loadLang,
} from "./i18n/i18n.js";
import en from "./i18n/locales/en.json" with { type: "json" };
import zh from "./i18n/locales/zh.json" with { type: "json" };

const SUPPORTED_LANGS = ["en", "zh"];

const state = {
  transactions: [],
  filters: { category: "all", type: "all", search: "" },
  editingId: null,
  pendingDeleteId: null,
  theme: "dark",
};

const dom = {
  form: document.getElementById("transactionForm"),
  titleInput: document.getElementById("titleInput"),
  amountInput: document.getElementById("amountInput"),
  categoryInput: document.getElementById("categoryInput"),
  dateInput: document.getElementById("dateInput"),
  titleError: document.getElementById("titleError"),
  amountError: document.getElementById("amountError"),
  categoryError: document.getElementById("categoryError"),
  dateError: document.getElementById("dateError"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  filterCategory: document.getElementById("filterCategory"),
  filterType: document.getElementById("filterType"),
  searchInput: document.getElementById("searchInput"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  langToggleBtn: document.getElementById("langToggleBtn"),
  transactionsList: document.getElementById("transactionsList"),
  resultsCount: document.getElementById("resultsCount"),
  totalBalance: document.getElementById("totalBalance"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  financeChart: document.getElementById("financeChart"),
  confirmModal: document.getElementById("confirmModal"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  toastContainer: document.getElementById("toastContainer"),
  skeleton: document.getElementById("skeleton"),
  cookieBanner: document.getElementById("cookieBanner"),
  cookieAcceptBtn: document.getElementById("cookieAcceptBtn"),
  cookieRejectBtn: document.getElementById("cookieRejectBtn"),
  privacyLink: document.getElementById("privacyLink"),
  bannerPrivacyLink: document.getElementById("bannerPrivacyLink"),
};

let consentToastShown = false;
const notifyNoConsentOnce = () => {
  if (consentToastShown) return;
  consentToastShown = true;
  showToast(t("toast.consentRequired"), "error");
};

const showToast = (message, variant = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast${variant === "error" ? " toast--error" : ""}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
};

const formatTemplate = (template, vars = {}) =>
  template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const clearErrors = () => {
  const fields = [
    { input: dom.titleInput, error: dom.titleError },
    { input: dom.amountInput, error: dom.amountError },
    { input: dom.categoryInput, error: dom.categoryError },
    { input: dom.dateInput, error: dom.dateError },
  ];
  fields.forEach(({ input, error }) => {
    input.classList.remove("is-invalid");
    error.textContent = "";
  });
};

const setError = (input, errorEl, errorKey) => {
  input.classList.add("is-invalid");
  errorEl.textContent = t(errorKey);
};

const updateThemeButtonLabel = () => {
  dom.themeToggleBtn.textContent =
    state.theme === "light" ? t("actions.darkMode") : t("actions.lightMode");
};

const updateSubmitButtonLabel = () => {
  dom.submitBtn.textContent = state.editingId
    ? t("form.submitSave")
    : t("form.submitAdd");
};

const updatePrivacyLinks = () => {
  const target = getLang() === "zh" ? "privacy.zh.html" : "privacy.html";
  if (dom.privacyLink) dom.privacyLink.setAttribute("href", target);
  if (dom.bannerPrivacyLink) dom.bannerPrivacyLink.setAttribute("href", target);
};

const setTheme = (theme) => {
  state.theme = theme;
  document.body.classList.toggle("theme-light", theme === "light");
  updateThemeButtonLabel();
  const result = persistTheme(theme, hasConsented());
  if (!result.ok && result.error === "no-consent") {
    notifyNoConsentOnce();
  }
  renderChart(dom.financeChart, state.transactions);
};

const renderApp = () => {
  renderSummary(dom, state.transactions);
  renderTransactions(dom, state.transactions, state.filters, t);
  renderChart(dom.financeChart, state.transactions);
};

const save = () => {
  const result = saveTransactions(state.transactions, hasConsented());
  if (!result.ok) {
    if (result.error === "no-consent") {
      notifyNoConsentOnce();
    } else if (result.error === "quota") {
      showToast(t("toast.storageFull"), "error");
    }
  }
};

const resetFormState = () => {
  dom.form.reset();
  state.editingId = null;
  updateSubmitButtonLabel();
  dom.cancelEditBtn.hidden = true;
  clearErrors();
};

const addTransaction = () => {
  clearErrors();

  const title = dom.titleInput.value.trim();
  const amountValue = dom.amountInput.value.trim();
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;

  const { ok, errors } = validateTransactionInput({
    title,
    amount: amountValue,
    category,
    date,
  });

  if (!ok) {
    if (errors.title) setError(dom.titleInput, dom.titleError, errors.title);
    if (errors.amount) setError(dom.amountInput, dom.amountError, errors.amount);
    if (errors.category) setError(dom.categoryInput, dom.categoryError, errors.category);
    if (errors.date) setError(dom.dateInput, dom.dateError, errors.date);
    showToast(t("toast.fixFields"), "error");
    return;
  }

  const amount = Number(amountValue);

  if (state.editingId) {
    state.transactions = state.transactions.map((tx) =>
      tx.id === state.editingId ? { ...tx, title, amount, category, date } : tx,
    );
    showToast(t("toast.updated"));
  } else {
    state.transactions = [
      { id: generateID(), title, amount, category, date },
      ...state.transactions,
    ];
    showToast(t("toast.added"));
  }

  resetFormState();
  save();
  renderApp();
};

const startEditing = (id) => {
  const transaction = state.transactions.find((tx) => tx.id === id);
  if (!transaction) return;

  dom.titleInput.value = transaction.title;
  dom.amountInput.value = transaction.amount;
  dom.categoryInput.value = transaction.category;
  dom.dateInput.value = transaction.date;

  state.editingId = id;
  updateSubmitButtonLabel();
  dom.cancelEditBtn.hidden = false;
  dom.titleInput.focus();
  showToast(t("toast.editing"));
};

const deleteTransaction = (id) => {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  save();
  renderApp();
  showToast(t("toast.deleted"));
};

const openConfirmModal = (id) => {
  state.pendingDeleteId = id;
  dom.confirmModal.classList.add("is-open");
  dom.confirmModal.setAttribute("aria-hidden", "false");
};

const closeConfirmModal = () => {
  state.pendingDeleteId = null;
  dom.confirmModal.classList.remove("is-open");
  dom.confirmModal.setAttribute("aria-hidden", "true");
};

const exportToCSV = () => {
  if (state.transactions.length === 0) {
    showToast(t("toast.noData"), "error");
    return;
  }

  const headers = ["Title", "Amount", "Category", "Date"];
  const rows = state.transactions.map((tx) => [tx.title, tx.amount, tx.category, tx.date]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(t("toast.csvExported"));
};

const refreshUiLanguage = () => {
  applyTranslations(document);
  document.documentElement.lang = getLang();
  updateThemeButtonLabel();
  updateSubmitButtonLabel();
  updatePrivacyLinks();
  renderApp();
};

const toggleLanguage = () => {
  const next = getLang() === "en" ? "zh" : "en";
  setLang(next);
  refreshUiLanguage();
};

const initializeApp = () => {
  const stored = loadLang();
  const initialLang = SUPPORTED_LANGS.includes(stored) ? stored : "en";
  initI18n({ defaultLang: initialLang, translations: { en, zh } });
  applyTranslations(document);
  document.documentElement.lang = getLang();
  updatePrivacyLinks();

  const { transactions, discarded, error } = loadTransactions();
  state.transactions = transactions;

  if (error === "corrupt_json") {
    showToast(t("toast.corrupt"), "error");
  } else if (error === "unrecognized_format") {
    showToast(t("toast.unrecognized"), "error");
  }
  if (discarded > 0) {
    showToast(formatTemplate(t("toast.discarded"), { count: discarded }), "error");
  }

  setTheme(retrieveTheme());
  renderApp();

  setTimeout(() => dom.skeleton.classList.add("is-hidden"), 300);

  dom.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTransaction();
  });

  dom.cancelEditBtn.addEventListener("click", resetFormState);

  dom.transactionsList.addEventListener("click", (e) => {
    const deleteButton = e.target.closest(".delete-btn");
    const editButton = e.target.closest(".edit-btn");
    const emptyAdd = e.target.closest(".empty-add-btn");

    if (deleteButton?.dataset?.id) openConfirmModal(deleteButton.dataset.id);
    if (editButton?.dataset?.id) startEditing(editButton.dataset.id);
    if (emptyAdd) dom.titleInput.focus();
  });

  dom.filterCategory.addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    renderTransactions(dom, state.transactions, state.filters, t);
  });

  dom.filterType.addEventListener("change", (e) => {
    state.filters.type = e.target.value;
    renderTransactions(dom, state.transactions, state.filters, t);
  });

  dom.searchInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    renderTransactions(dom, state.transactions, state.filters, t);
  });

  dom.resetFiltersBtn.addEventListener("click", () => {
    state.filters = { category: "all", type: "all", search: "" };
    dom.filterCategory.value = "all";
    dom.filterType.value = "all";
    dom.searchInput.value = "";
    renderTransactions(dom, state.transactions, state.filters, t);
  });

  dom.exportCsvBtn.addEventListener("click", exportToCSV);
  dom.themeToggleBtn.addEventListener("click", () => {
    setTheme(state.theme === "dark" ? "light" : "dark");
  });

  if (dom.langToggleBtn) {
    dom.langToggleBtn.addEventListener("click", toggleLanguage);
  }

  dom.confirmDeleteBtn.addEventListener("click", () => {
    if (state.pendingDeleteId) deleteTransaction(state.pendingDeleteId);
    closeConfirmModal();
  });

  dom.cancelDeleteBtn.addEventListener("click", closeConfirmModal);

  dom.confirmModal.addEventListener("click", (e) => {
    if (e.target.dataset.close) closeConfirmModal();
  });

  initBanner({
    banner: dom.cookieBanner,
    acceptBtn: dom.cookieAcceptBtn,
    rejectBtn: dom.cookieRejectBtn,
    onAccept: () => {
      consentToastShown = false;
      saveTransactions(state.transactions, true);
      persistTheme(state.theme, true);
      showToast(t("toast.consentGranted"));
    },
    onReject: () => {
      showToast(t("toast.consentDeclined"), "error");
    },
  });
};

initializeApp();
