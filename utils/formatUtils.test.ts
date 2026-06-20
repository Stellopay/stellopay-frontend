import { describe, expect, it } from "vitest";

import {
  capitalizeFirst,
  formatChartValue,
  formatCurrency,
  formatNumber,
  truncateText,
} from "@/utils/formatUtils";

describe("formatCurrency", () => {
  it("formats zero, positive, and negative amounts with an explicit sign policy", () => {
    expect(formatCurrency(0)).toBe("+$0.00");
    expect(formatCurrency(1234.5)).toBe("+$1234.50");
    expect(formatCurrency(-1234.5)).toBe("$1234.50");
  });

  it("supports custom currency symbols and decimal precision", () => {
    expect(formatCurrency(42, "USD ", 0)).toBe("+USD 42");
    expect(formatCurrency(-0.125, "USDC ", 3)).toBe("USDC 0.125");
  });

  it("rounds fractional values deterministically", () => {
    expect(formatCurrency(1.005)).toBe("+$1.00");
    expect(formatCurrency(1.999)).toBe("+$2.00");
  });
});

describe("formatNumber", () => {
  it("uses en-US separators for zero, negative, and large values", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-1234)).toBe("-1,234");
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });
});

describe("formatChartValue", () => {
  it("returns raw values below 1000", () => {
    expect(formatChartValue(0)).toBe("0");
    expect(formatChartValue(999)).toBe("999");
    expect(formatChartValue(-1500)).toBe("-1500");
  });

  it("formats thousands with a k suffix", () => {
    expect(formatChartValue(1000)).toBe("1k");
    expect(formatChartValue(24000)).toBe("24k");
    expect(formatChartValue(12500)).toBe("13k");
    expect(formatChartValue(1234567)).toBe("1235k");
  });
});

describe("truncateText", () => {
  it("leaves empty, short, and exact-length strings unchanged", () => {
    expect(truncateText("", 8)).toBe("");
    expect(truncateText("abc", 8)).toBe("abc");
    expect(truncateText("abcd", 4)).toBe("abcd");
  });

  it("truncates long address-like strings and appends an ellipsis", () => {
    expect(truncateText("GABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)).toBe("GABCDEFG...");
    expect(truncateText("hello", 0)).toBe("...");
  });
});

describe("capitalizeFirst", () => {
  it("capitalizes mixed-case, lowercase, and single-letter values", () => {
    expect(capitalizeFirst("pending")).toBe("Pending");
    expect(capitalizeFirst("cOmPLETED")).toBe("Completed");
    expect(capitalizeFirst("x")).toBe("X");
  });

  it("keeps empty strings empty", () => {
    expect(capitalizeFirst("")).toBe("");
  });
});
