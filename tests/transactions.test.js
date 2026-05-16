import { describe, it, expect } from "vitest";
import { filterTransactions, groupByMonth, calculateTotals } from "../src/state/transactions.js";

const sampleData = [
  { id: "1", title: "Salary", amount: 5000, category: "Salary", date: "2026-01-15" },
  { id: "2", title: "Groceries", amount: -120, category: "Food", date: "2026-01-20" },
  { id: "3", title: "Freelance", amount: 800, category: "Business", date: "2026-02-10" },
  { id: "4", title: "Bus Pass", amount: -50, category: "Transport", date: "2026-02-12" },
];

describe("filterTransactions", () => {
  it("returns all when filters are 'all'", () => {
    const result = filterTransactions(sampleData, { category: "all", type: "all", search: "" });
    expect(result).toHaveLength(4);
  });

  it("filters by category", () => {
    const result = filterTransactions(sampleData, { category: "Food", type: "all", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Groceries");
  });

  it("filters by income type", () => {
    const result = filterTransactions(sampleData, { category: "all", type: "income", search: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by expense type", () => {
    const result = filterTransactions(sampleData, { category: "all", type: "expense", search: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by search (case-insensitive)", () => {
    const result = filterTransactions(sampleData, { category: "all", type: "all", search: "sal" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Salary");
  });

  it("returns empty for no matches", () => {
    const result = filterTransactions(sampleData, { category: "all", type: "all", search: "xyz" });
    expect(result).toHaveLength(0);
  });
});

describe("groupByMonth", () => {
  it("groups transactions by month", () => {
    const groups = groupByMonth(sampleData);
    expect(groups).toHaveLength(2);
  });

  it("sorts groups newest first", () => {
    const groups = groupByMonth(sampleData);
    expect(groups[0].label).toContain("February");
    expect(groups[1].label).toContain("January");
  });

  it("returns empty array for no transactions", () => {
    expect(groupByMonth([])).toHaveLength(0);
  });
});

describe("calculateTotals", () => {
  it("calculates correct totals", () => {
    const { totalIncome, totalExpenses, totalBalance } = calculateTotals(sampleData);
    expect(totalIncome).toBe(5800);
    expect(totalExpenses).toBe(-170);
    expect(totalBalance).toBe(5630);
  });

  it("returns zeros for empty array", () => {
    const { totalIncome, totalExpenses, totalBalance } = calculateTotals([]);
    expect(totalIncome).toBe(0);
    expect(totalExpenses).toBe(0);
    expect(totalBalance).toBe(0);
  });
});
