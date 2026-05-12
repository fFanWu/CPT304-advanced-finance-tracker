"use strict";

const STORAGE_KEY = "financeTrackerData";
const STORAGE_VERSION = 1;
const THEME_KEY = "financeTrackerTheme";

const state = {
  transactions: [],
  filters: {
    category: "all",
    type: "all",
    search: "",
  },
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
};

const generateID = () => {
  return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

const isValidTransaction = (tx) => {
  if (tx === null || typeof tx !== "object") return false;
  if (typeof tx.id !== "string" || tx.id.length === 0) return false;
  if (typeof tx.title !== "string" || tx.title.length === 0) return false;
  if (typeof tx.amount !== "number" || !Number.isFinite(tx.amount)) return false;
  if (typeof tx.category !== "string" || tx.category.length === 0) return false;
  if (typeof tx.date !== "string" || tx.date.length === 0) return false;
  return true;
};

const saveToLocalStorage = () => {
  try {
    const payload = {
      version: STORAGE_VERSION,
      transactions: state.transactions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      showToast("Storage full. Could not save data.", "error");
    }
  }
};

const loadFromLocalStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.transactions = [];
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY + ".corrupt", raw);
    localStorage.removeItem(STORAGE_KEY);
    state.transactions = [];
    showToast("Stored data was corrupted and has been reset.", "error");
    return;
  }

  let transactions;
  if (Array.isArray(parsed)) {
    transactions = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.transactions)) {
    transactions = parsed.transactions;
  } else {
    localStorage.setItem(STORAGE_KEY + ".corrupt", raw);
    localStorage.removeItem(STORAGE_KEY);
    state.transactions = [];
    showToast("Stored data format unrecognized and has been reset.", "error");
    return;
  }

  const valid = transactions.filter(isValidTransaction);
  const discarded = transactions.length - valid.length;
  if (discarded > 0) {
    showToast(`${discarded} corrupted transaction(s) removed.`, "error");
  }
  state.transactions = valid;
};

const saveTheme = () => {
  localStorage.setItem(THEME_KEY, state.theme);
};

const setTheme = (theme) => {
  state.theme = theme;
  document.body.classList.toggle("theme-light", theme === "light");
  dom.themeToggleBtn.textContent =
    theme === "light" ? "Dark Mode" : "Light Mode";
  saveTheme();
  if (typeof renderChart === "function") {
    renderChart();
  }
};

const loadTheme = () => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  setTheme(storedTheme || "dark");
};

const showToast = (message, variant = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast${variant === "error" ? " toast--error" : ""}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
};

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

const setError = (input, errorEl, message) => {
  input.classList.add("is-invalid");
  errorEl.textContent = message;
};

const validateForm = () => {
  clearErrors();

  const title = dom.titleInput.value.trim();
  const amountValue = dom.amountInput.value.trim();
  const amount = Number(amountValue);
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;

  let isValid = true;

  if (!title) {
    setError(dom.titleInput, dom.titleError, "Title is required.");
    isValid = false;
  } else if (title.length > 200) {
    setError(dom.titleInput, dom.titleError, "Title must be 200 characters or fewer.");
    isValid = false;
  }

  if (!amountValue || Number.isNaN(amount) || amount === 0) {
    setError(dom.amountInput, dom.amountError, "Enter a valid amount.");
    isValid = false;
  }

  if (!category) {
    setError(dom.categoryInput, dom.categoryError, "Select a category.");
    isValid = false;
  }

  if (!date) {
    setError(dom.dateInput, dom.dateError, "Pick a date.");
    isValid = false;
  }

  return isValid;
};

const resetFormState = () => {
  dom.form.reset();
  state.editingId = null;
  dom.submitBtn.textContent = "Add Transaction";
  dom.cancelEditBtn.hidden = true;
  clearErrors();
};

const addTransaction = () => {
  if (!validateForm()) {
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const title = dom.titleInput.value.trim();
  const amount = Number(dom.amountInput.value);
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;

  if (state.editingId) {
    state.transactions = state.transactions.map((tx) =>
      tx.id === state.editingId ? { ...tx, title, amount, category, date } : tx,
    );
    showToast("Transaction updated.");
  } else {
    const newTransaction = {
      id: generateID(),
      title,
      amount,
      category,
      date,
    };

    state.transactions = [newTransaction, ...state.transactions];
    showToast("Transaction added.");
  }

  resetFormState();
  saveToLocalStorage();
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
  dom.submitBtn.textContent = "Save Changes";
  dom.cancelEditBtn.hidden = false;
  dom.titleInput.focus();
  showToast("Editing mode enabled.");
};

const deleteTransaction = (id) => {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  saveToLocalStorage();
  renderApp();
  showToast("Transaction deleted.");
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

const renderSummary = () => {
  const amounts = state.transactions.map((tx) => tx.amount);

  const totalIncome = amounts
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0);

  const totalExpenses = amounts
    .filter((amount) => amount < 0)
    .reduce((sum, amount) => sum + amount, 0);

  const totalBalance = totalIncome + totalExpenses;

  dom.totalIncome.textContent = formatCurrency(totalIncome);
  dom.totalExpenses.textContent = formatCurrency(Math.abs(totalExpenses));
  dom.totalBalance.textContent = formatCurrency(totalBalance);
};

const renderTransactions = () => {
  const filtered = filterTransactions();

  dom.resultsCount.textContent = `${filtered.length} results`;

  if (filtered.length === 0) {
    dom.transactionsList.innerHTML = `
      <div class="transactions__empty">
        <div class="empty__icon">+</div>
        <p>No transactions yet. Add your first one to get started.</p>
        <button class="btn btn--accent empty-add-btn" type="button">Add First Transaction</button>
      </div>
    `;
    return;
  }

  const groups = groupByMonth(filtered);

  dom.transactionsList.innerHTML = groups
    .map(
      (group) => `
        <div class="month-group">
          <p class="month-title">${escapeHtml(group.label)}</p>
          ${group.items.map(renderTransactionItem).join("")}
        </div>
      `,
    )
    .join("");
};

const renderTransactionItem = (tx) => {
  const typeClass = tx.amount >= 0 ? "amount--income" : "amount--expense";
  const formattedAmount = formatCurrency(tx.amount);
  const formattedDate = formatDate(tx.date);

  return `
    <div class="transaction">
      <div>
        <p class="transaction__title">${escapeHtml(tx.title)}</p>
        <div class="transaction__meta">
          <span class="badge">${escapeHtml(tx.category)}</span>
          <span>${escapeHtml(formattedDate)}</span>
        </div>
      </div>
      <div>
        <p class="amount ${typeClass}">${escapeHtml(formattedAmount)}</p>
        <button class="edit-btn" data-id="${escapeHtml(tx.id)}">Edit</button>
        <button class="delete-btn" data-id="${escapeHtml(tx.id)}">Delete</button>
      </div>
    </div>
  `;
};

const filterTransactions = () => {
  const { category, type, search } = state.filters;

  return state.transactions.filter((tx) => {
    const matchesCategory = category === "all" || tx.category === category;

    const matchesType =
      type === "all" ||
      (type === "income" && tx.amount > 0) ||
      (type === "expense" && tx.amount < 0);

    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesType && matchesSearch;
  });
};

const groupByMonth = (transactions) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const groups = [];
  const lookup = new Map();

  sorted.forEach((tx) => {
    const label = new Date(tx.date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!lookup.has(label)) {
      lookup.set(label, { label, items: [] });
      groups.push(lookup.get(label));
    }

    lookup.get(label).items.push(tx);
  });

  return groups;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const renderChart = () => {
  const canvas = dom.financeChart;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const displayWidth = canvas.clientWidth;
  const displayHeight = 260;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = displayWidth;
  const height = displayHeight;

  ctx.clearRect(0, 0, width, height);

  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue("--text").trim() || "#f8fafc";
  const baseLineColor =
    styles.getPropertyValue("--chart-base-line").trim() ||
    "rgba(255,255,255,0.08)";

  const amounts = state.transactions.map((tx) => tx.amount);
  const income = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0);
  const expenses = Math.abs(
    amounts.filter((a) => a < 0).reduce((s, a) => s + a, 0),
  );

  const maxValue = Math.max(income, expenses, 1);
  const barWidth = 120;
  const gap = 80;
  const baseY = height - 40;

  const incomeHeight = (income / maxValue) * (height - 80);
  const expenseHeight = (expenses / maxValue) * (height - 80);

  ctx.strokeStyle = baseLineColor;
  ctx.beginPath();
  ctx.moveTo(40, baseY);
  ctx.lineTo(width - 40, baseY);
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(160, baseY - incomeHeight, barWidth, incomeHeight);

  ctx.fillStyle = "#f97316";
  ctx.fillRect(
    160 + barWidth + gap,
    baseY - expenseHeight,
    barWidth,
    expenseHeight,
  );

  ctx.fillStyle = textColor;
  ctx.font = "14px sans-serif";
  ctx.fillText("Income", 170, baseY + 20);
  ctx.fillText("Expense", 160 + barWidth + gap, baseY + 20);

  ctx.fillText(formatCurrency(income), 150, baseY - incomeHeight - 10);
  ctx.fillText(
    formatCurrency(expenses),
    150 + barWidth + gap,
    baseY - expenseHeight - 10,
  );
};

const renderApp = () => {
  renderSummary();
  renderTransactions();
  renderChart();
};

const exportToCSV = () => {
  if (state.transactions.length === 0) {
    showToast("No data to export.", "error");
    return;
  }

  const headers = ["Title", "Amount", "Category", "Date"];
  const rows = state.transactions.map((tx) => [
    tx.title,
    tx.amount,
    tx.category,
    tx.date,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
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

  showToast("CSV exported.");
};

const initializeApp = () => {
  loadFromLocalStorage();
  loadTheme();
  renderApp();

  setTimeout(() => {
    dom.skeleton.classList.add("is-hidden");
  }, 300);

  dom.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTransaction();
  });

  dom.cancelEditBtn.addEventListener("click", () => {
    resetFormState();
  });

  dom.transactionsList.addEventListener("click", (e) => {
    const deleteButton = e.target.closest(".delete-btn");
    const editButton = e.target.closest(".edit-btn");
    const emptyAdd = e.target.closest(".empty-add-btn");

    const deleteId = deleteButton?.dataset?.id;
    const editId = editButton?.dataset?.id;

    if (deleteId) {
      openConfirmModal(deleteId);
    }

    if (editId) {
      startEditing(editId);
    }

    if (emptyAdd) {
      dom.titleInput.focus();
    }
  });

  dom.filterCategory.addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    renderTransactions();
  });

  dom.filterType.addEventListener("change", (e) => {
    state.filters.type = e.target.value;
    renderTransactions();
  });

  dom.searchInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    renderTransactions();
  });

  dom.resetFiltersBtn.addEventListener("click", () => {
    state.filters = { category: "all", type: "all", search: "" };
    dom.filterCategory.value = "all";
    dom.filterType.value = "all";
    dom.searchInput.value = "";
    renderTransactions();
  });

  dom.exportCsvBtn.addEventListener("click", exportToCSV);

  dom.themeToggleBtn.addEventListener("click", () => {
    setTheme(state.theme === "dark" ? "light" : "dark");
  });

  dom.confirmDeleteBtn.addEventListener("click", () => {
    if (state.pendingDeleteId) {
      deleteTransaction(state.pendingDeleteId);
    }
    closeConfirmModal();
  });

  dom.cancelDeleteBtn.addEventListener("click", closeConfirmModal);

  dom.confirmModal.addEventListener("click", (e) => {
    if (e.target.dataset.close) {
      closeConfirmModal();
    }
  });
};

initializeApp();
