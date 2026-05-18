import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateID: vi.fn(),
  validateTransactionInput: vi.fn(),
  loadTransactions: vi.fn(),
  saveTransactions: vi.fn(),
  saveTheme: vi.fn(),
  loadTheme: vi.fn(),
  renderSummary: vi.fn(),
  renderTransactions: vi.fn(),
  renderChart: vi.fn(),
}));

vi.mock("../src/utils/format.js", () => ({
  generateID: mocks.generateID,
}));

vi.mock("../src/state/validation.js", () => ({
  validateTransactionInput: mocks.validateTransactionInput,
}));

vi.mock("../src/state/storage.js", () => ({
  loadTransactions: mocks.loadTransactions,
  saveTransactions: mocks.saveTransactions,
  saveTheme: mocks.saveTheme,
  loadTheme: mocks.loadTheme,
}));

vi.mock("../src/render/render.js", () => ({
  renderSummary: mocks.renderSummary,
  renderTransactions: mocks.renderTransactions,
}));

vi.mock("../src/render/chart.js", () => ({
  renderChart: mocks.renderChart,
}));

const setupDom = () => {
  document.body.innerHTML = `
    <div id="skeleton"></div>
    <form id="transactionForm">
      <input id="titleInput" />
      <input id="amountInput" />
      <select id="categoryInput"><option value="Salary">Salary</option></select>
      <input id="dateInput" />
      <p id="titleError"></p>
      <p id="amountError"></p>
      <p id="categoryError"></p>
      <p id="dateError"></p>
      <button id="submitBtn" type="submit">Add Transaction</button>
      <button id="cancelEditBtn" type="button" hidden>Cancel</button>
    </form>
    <select id="filterCategory"><option value="all">all</option></select>
    <select id="filterType"><option value="all">all</option></select>
    <input id="searchInput" />
    <button id="resetFiltersBtn" type="button">Reset</button>
    <button id="exportCsvBtn" type="button">Export</button>
    <button id="themeToggleBtn" type="button">Theme</button>
    <div id="transactionsList"></div>
    <p id="resultsCount"></p>
    <p id="totalBalance"></p>
    <p id="totalIncome"></p>
    <p id="totalExpenses"></p>
    <canvas id="financeChart"></canvas>
    <div id="confirmModal" aria-hidden="true"></div>
    <button id="confirmDeleteBtn" type="button">Confirm</button>
    <button id="cancelDeleteBtn" type="button">Cancel</button>
    <div id="toastContainer"></div>
  `;
};

describe("main app bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    setupDom();
    mocks.generateID.mockReturnValue("tx_new");
    mocks.validateTransactionInput.mockReturnValue({ ok: true, errors: {} });
    mocks.loadTransactions.mockReturnValue({ transactions: [], discarded: 0, error: null });
    mocks.saveTransactions.mockReturnValue({ ok: true });
    mocks.loadTheme.mockReturnValue("dark");
    mocks.saveTheme.mockReturnValue({ ok: true });
  });

  it("initializes app and renders first screen", async () => {
    mocks.loadTransactions.mockReturnValue({
      transactions: [{ id: "t1", title: "Salary", amount: 1000, category: "Salary", date: "2026-01-01" }],
      discarded: 0,
      error: null,
    });
    mocks.loadTheme.mockReturnValue("light");

    await import("../src/main.js");

    expect(mocks.loadTransactions).toHaveBeenCalledTimes(1);
    expect(mocks.renderSummary).toHaveBeenCalled();
    expect(mocks.renderTransactions).toHaveBeenCalled();
    expect(mocks.renderChart).toHaveBeenCalled();
    expect(document.body.classList.contains("theme-light")).toBe(true);
    expect(document.getElementById("themeToggleBtn").textContent).toBe("Dark Mode");
  });

  it("adds a transaction on form submit", async () => {
    await import("../src/main.js");

    document.getElementById("titleInput").value = "Salary";
    document.getElementById("amountInput").value = "1234";
    document.getElementById("categoryInput").value = "Salary";
    document.getElementById("dateInput").value = "2026-01-05";

    document
      .getElementById("transactionForm")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(mocks.validateTransactionInput).toHaveBeenCalled();
    expect(mocks.saveTransactions).toHaveBeenCalledTimes(1);
    expect(mocks.saveTransactions.mock.calls[0][0]).toEqual([
      { id: "tx_new", title: "Salary", amount: 1234, category: "Salary", date: "2026-01-05" },
    ]);
    expect(document.getElementById("submitBtn").textContent).toBe("Add Transaction");
  });

  it("opens modal and deletes an existing transaction", async () => {
    mocks.loadTransactions.mockReturnValue({
      transactions: [{ id: "tx_1", title: "Food", amount: -50, category: "Food", date: "2026-01-01" }],
      discarded: 0,
      error: null,
    });

    await import("../src/main.js");

    const list = document.getElementById("transactionsList");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = "tx_1";
    list.appendChild(deleteBtn);
    deleteBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.getElementById("confirmModal").classList.contains("is-open")).toBe(true);

    document.getElementById("confirmDeleteBtn").click();

    expect(mocks.saveTransactions).toHaveBeenCalled();
    expect(document.getElementById("confirmModal").getAttribute("aria-hidden")).toBe("true");
  });
});
