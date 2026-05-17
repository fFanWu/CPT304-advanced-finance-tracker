import { describe, it, expect, beforeEach } from "vitest";
import {
  renderSummary,
  renderTransactionItem,
  renderTransactions,
} from "../src/render/render.js";

describe("renderSummary", () => {
  it("renders totals into dom nodes", () => {
    const dom = {
      totalIncome: document.createElement("p"),
      totalExpenses: document.createElement("p"),
      totalBalance: document.createElement("p"),
    };
    const transactions = [
      { id: "1", title: "Salary", amount: 1200, category: "Salary", date: "2026-01-01" },
      { id: "2", title: "Food", amount: -200, category: "Food", date: "2026-01-02" },
    ];

    renderSummary(dom, transactions);

    expect(dom.totalIncome.textContent).toContain("1,200");
    expect(dom.totalExpenses.textContent).toContain("200");
    expect(dom.totalBalance.textContent).toContain("1,000");
  });
});

describe("renderTransactionItem", () => {
  it("renders escaped content and income class", () => {
    const html = renderTransactionItem({
      id: 'tx_"1"',
      title: "<script>alert(1)</script>",
      amount: 200,
      category: "Salary & Bonus",
      date: "2026-01-01",
    });

    expect(html).toContain("amount--income");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Salary &amp; Bonus");
    expect(html).toContain('data-id="tx_&quot;1&quot;"');
  });
});

describe("renderTransactions", () => {
  let dom;
  const mockT = (key) => {
    const translations = {
      "transactions.results": "results",
      "transactions.empty": "No transactions yet. Add your first one to get started.",
      "transactions.addFirst": "Add First Transaction",
      "transactions.edit": "Edit",
      "transactions.delete": "Delete",
    };
    return translations[key] ?? key;
  };

  beforeEach(() => {
    dom = {
      resultsCount: document.createElement("p"),
      transactionsList: document.createElement("div"),
    };
  });

  it("renders empty state when no items match", () => {
    const transactions = [
      { id: "1", title: "Salary", amount: 2000, category: "Salary", date: "2026-01-01" },
    ];

    renderTransactions(dom, transactions, {
      category: "Food",
      type: "all",
      search: "",
    }, mockT);

    expect(dom.resultsCount.textContent).toBe("0 results");
    expect(dom.transactionsList.innerHTML).toContain("No transactions yet");
    expect(dom.transactionsList.innerHTML).toContain("empty-add-btn");
  });

  it("renders grouped transactions when matches exist", () => {
    const transactions = [
      { id: "1", title: "Salary", amount: 2000, category: "Salary", date: "2026-02-10" },
      { id: "2", title: "Groceries", amount: -120, category: "Food", date: "2026-01-20" },
    ];

    renderTransactions(dom, transactions, {
      category: "all",
      type: "all",
      search: "",
    }, mockT);

    expect(dom.resultsCount.textContent).toBe("2 results");
    expect(dom.transactionsList.innerHTML).toContain("month-group");
    expect(dom.transactionsList.innerHTML).toContain("Salary");
    expect(dom.transactionsList.innerHTML).toContain("Groceries");
  });
});
