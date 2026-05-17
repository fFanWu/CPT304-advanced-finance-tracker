import { describe, it, expect } from "vitest";
import { escapeHtml, formatCurrency, formatDate, generateID } from "../src/utils/format.js";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("escapes quotes in attribute context", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("returns plain text unchanged", () => {
    expect(escapeHtml("Freelance Payment")).toBe("Freelance Payment");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats positive numbers as USD", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats negative numbers with minus sign", () => {
    const result = formatCurrency(-50);
    expect(result).toContain("50.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-01-15");
    expect(result).toContain("2026");
    expect(result).toContain("Jan");
  });
});

describe("generateID", () => {
  it("returns a string starting with tx_", () => {
    const id = generateID();
    expect(id).toMatch(/^tx_\d+_[0-9a-f]+$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateID()));
    expect(ids.size).toBe(50);
  });
});
