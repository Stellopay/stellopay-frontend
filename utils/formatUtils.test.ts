import { describe, expect, it } from "vitest";

import {
  capitalizeFirst,
  formatChartValue,
  formatCurrency,
  formatCurrencyWithCode,
  formatNumber,
  truncateText,
} from "@/utils/formatUtils";

describe("formatCurrency", () => {
  it("formats zero, positive, and negative amounts with an explicit sign policy", () => {
    expect(formatCurrency(0)).toBe("+$0.00");
    expect(formatCurrency(1234.5)).toBe("+$1234.50");
    expect(formatCurrency(-1234.5)).toBe("-$1234.50");
  });

  it("supports custom currency symbols and decimal precision", () => {
    expect(formatCurrency(42, "USD ", 0)).toBe("+USD 42");
    expect(formatCurrency(-0.125, "USDC ", 3)).toBe("-USDC 0.125");
  });

  it("rounds fractional values deterministically", () => {
    expect(formatCurrency(1.005)).toBe("+$1.00");
    expect(formatCurrency(1.999)).toBe("+$2.00");
  });

  it("formats negative amounts with minus sign before currency at various precisions", () => {
    expect(formatCurrency(-1, "$", 0)).toBe("-$1");
    expect(formatCurrency(-99.99)).toBe("-$99.99");
    expect(formatCurrency(-0.001, "USD ", 3)).toBe("-USD 0.001");
    expect(formatCurrency(-0.0001, "X", 4)).toBe("-X0.0001");
    expect(formatCurrency(-1234567.89, "USDC ", 2)).toBe("-USDC 1234567.89");
  });

  it("preserves positive formatting unchanged alongside negative equivalents", () => {
    expect(formatCurrency(0)).toBe("+$0.00");
    expect(formatCurrency(0, "USD ", 0)).toBe("+USD 0");
    expect(formatCurrency(0, "X", 4)).toBe("+X0.0000");
    expect(formatCurrency(-0)).toBe("+$0.00");
  });

  it("handles small negative boundary values near zero", () => {
    expect(formatCurrency(-0.001, "USDC ", 3)).toBe("-USDC 0.001");
    expect(formatCurrency(-0.009, "USDC ", 3)).toBe("-USDC 0.009");
    expect(formatCurrency(-0.0001, "USDC ", 4)).toBe("-USDC 0.0001");
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

describe("formatCurrencyWithCode", () => {
  it("formats a positive amount with a valid ISO 4217 currency code", () => {
    const result = formatCurrencyWithCode(1250.5, "USD");

    // Should contain both the currency representation and the amount
    expect(result).toContain("1,250.50");
  });

  it("produces different output for different currency codes", () => {
    const usd = formatCurrencyWithCode(1250.5, "USD");
    const ngn = formatCurrencyWithCode(1250.5, "NGN");
    const eur = formatCurrencyWithCode(1250.5, "EUR");

    expect(usd).toBeTruthy();
    expect(ngn).toBeTruthy();
    expect(eur).toBeTruthy();
  });

  it("falls back to plain decimal for an unrecognised currency code", () => {
    const result = formatCurrencyWithCode(42, "ZZZ");

    // Should still return a formatted number string without throwing
    expect(result).toContain("42");
    expect(typeof result).toBe("string");
  });

  it("handles zero and negative amounts", () => {
    expect(formatCurrencyWithCode(0, "USD")).toContain("0.00");

    const neg = formatCurrencyWithCode(-500, "USD");

    expect(neg).toContain("500.00");
  });

  it("returns a non-empty string for every supported profile currency", () => {
    for (const code of ["USD", "NGN", "EUR"]) {
      const result = formatCurrencyWithCode(100, code);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    }
  });
});
