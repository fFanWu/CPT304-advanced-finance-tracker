import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderChart } from "../src/render/chart.js";

describe("renderChart", () => {
  const createContext = () => ({
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    font: "",
    strokeStyle: "",
    fillStyle: "",
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns early when canvas is missing", () => {
    expect(() => renderChart(null, [])).not.toThrow();
  });

  it("draws income and expense bars with totals", () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 600, configurable: true });

    const ctx = createContext();
    canvas.getContext = vi.fn(() => ctx);

    renderChart(canvas, [
      { amount: 1000 },
      { amount: -200 },
      { amount: -300 },
    ]);

    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(260);
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenCalledWith("Income", 170, 240);
    expect(ctx.fillText).toHaveBeenCalledWith("Expense", 360, 240);
  });
});
