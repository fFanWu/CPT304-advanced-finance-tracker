import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isValidTransaction,
  saveTransactions,
  loadTransactions,
  saveTheme,
  loadTheme,
  STORAGE_KEY,
  STORAGE_VERSION,
  THEME_KEY,
} from "../src/state/storage.js";

describe("isValidTransaction", () => {
  const validTx = {
    id: "tx_1",
    title: "Salary",
    amount: 5000,
    category: "Salary",
    date: "2026-01-01",
  };

  it("accepts a valid transaction", () => {
    expect(isValidTransaction(validTx)).toBe(true);
  });

  it("rejects missing id", () => {
    expect(isValidTransaction({ ...validTx, id: "" })).toBe(false);
  });

  it("rejects invalid amount", () => {
    expect(isValidTransaction({ ...validTx, amount: NaN })).toBe(false);
    expect(isValidTransaction({ ...validTx, amount: Infinity })).toBe(false);
  });

  it("rejects empty category", () => {
    expect(isValidTransaction({ ...validTx, category: "" })).toBe(false);
  });

  it("rejects missing date", () => {
    expect(isValidTransaction({ ...validTx, date: "" })).toBe(false);
  });
});

describe("saveTransactions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves payload with version and returns ok", () => {
    const transactions = [
      {
        id: "tx_1",
        title: "Salary",
        amount: 5000,
        category: "Salary",
        date: "2026-01-01",
      },
    ];

    const result = saveTransactions(transactions);
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    const saved = JSON.parse(savedRaw);

    expect(result).toEqual({ ok: true });
    expect(saved).toEqual({
      version: STORAGE_VERSION,
      transactions,
    });
  });

  it("returns quota error when QuotaExceededError is thrown", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const error = new Error("quota full");
      error.name = "QuotaExceededError";
      throw error;
    });

    const result = saveTransactions([]);
    expect(result).toEqual({ ok: false, error: "quota" });
  });

  it("returns unknown error for other failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("unexpected");
    });

    const result = saveTransactions([]);
    expect(result).toEqual({ ok: false, error: "unknown" });
  });
});

describe("loadTransactions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns empty defaults when nothing saved", () => {
    expect(loadTransactions()).toEqual({
      transactions: [],
      discarded: 0,
      error: null,
    });
  });

  it("loads legacy array format and filters invalid entries", () => {
    const validTx = {
      id: "tx_1",
      title: "Salary",
      amount: 5000,
      category: "Salary",
      date: "2026-01-01",
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([validTx, { id: "", title: "bad", amount: 1, category: "Other", date: "2026-01-01" }]),
    );

    expect(loadTransactions()).toEqual({
      transactions: [validTx],
      discarded: 1,
      error: null,
    });
  });

  it("flags unrecognized format as corrupt", () => {
    const raw = JSON.stringify({ hello: "world" });
    localStorage.setItem(STORAGE_KEY, raw);

    expect(loadTransactions()).toEqual({
      transactions: [],
      discarded: 0,
      error: "unrecognized_format",
    });
    expect(localStorage.getItem(`${STORAGE_KEY}.corrupt`)).toBe(raw);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles bad json by resetting storage safely", () => {
    const raw = "{bad json";
    localStorage.setItem(STORAGE_KEY, raw);

    expect(loadTransactions()).toEqual({
      transactions: [],
      discarded: 0,
      error: "corrupt_json",
    });
    expect(localStorage.getItem(`${STORAGE_KEY}.corrupt`)).toBe(raw);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("theme storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads explicit theme", () => {
    saveTheme("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    expect(loadTheme()).toBe("light");
  });

  it("defaults to dark when nothing is saved", () => {
    expect(loadTheme()).toBe("dark");
  });
});
