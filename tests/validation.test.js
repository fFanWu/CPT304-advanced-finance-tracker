import { describe, it, expect } from "vitest";
import { validateTransactionInput } from "../src/state/validation.js";

describe("validateTransactionInput", () => {
  const validInput = {
    title: "Salary",
    amount: "5000",
    category: "Salary",
    date: "2026-01-01",
  };

  it("passes with valid input", () => {
    const { ok, errors } = validateTransactionInput(validInput);
    expect(ok).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("fails when title is empty", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, title: "" });
    expect(ok).toBe(false);
    expect(errors.title).toBeDefined();
  });

  it("fails when title exceeds 200 chars", () => {
    const { ok, errors } = validateTransactionInput({
      ...validInput,
      title: "x".repeat(201),
    });
    expect(ok).toBe(false);
    expect(errors.title).toBe("error.titleTooLong");
  });

  it("fails when amount is zero", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, amount: "0" });
    expect(ok).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it("fails when amount is not a number", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, amount: "abc" });
    expect(ok).toBe(false);
    expect(errors.amount).toBeDefined();
  });

  it("fails when category is empty", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, category: "" });
    expect(ok).toBe(false);
    expect(errors.category).toBeDefined();
  });

  it("fails when date is empty", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, date: "" });
    expect(ok).toBe(false);
    expect(errors.date).toBeDefined();
  });

  it("reports multiple errors at once", () => {
    const { ok, errors } = validateTransactionInput({
      title: "",
      amount: "",
      category: "",
      date: "",
    });
    expect(ok).toBe(false);
    expect(Object.keys(errors)).toHaveLength(4);
  });

  it("accepts negative amounts", () => {
    const { ok } = validateTransactionInput({ ...validInput, amount: "-50" });
    expect(ok).toBe(true);
  });

  it("treats non-string title as empty", () => {
    const { ok, errors } = validateTransactionInput({ ...validInput, title: null });
    expect(ok).toBe(false);
    expect(errors.title).toBe("error.titleRequired");
  });
});
