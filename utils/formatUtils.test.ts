import { describe, expect, it } from "vitest";

import {
  capitalizeFirst,
  formatChartValue,
  formatCurrency,
  formatNumber,
  truncateText,
} from "@/utils/formatUtils";

describe("formatUtils", () => {
  describe("formatCurrency", () => {
    it("formats zero, positive, negative, fractional, and large amounts predictably", () => {
      expect(formatCurrency(0)).toBe("+$0.00");
      expect(formatCurrency(1234.5)).toBe("+$1234.50");
      expect(formatCurrency(-1234.5)).toBe("$1234.50");
      expect(formatCurrency(0.019)).toBe("+$0.02");
      expect(formatCurrency(987654321.456)).toBe("+$987654321.46");
    });

    it("honors explicit currency symbols and decimal precision", () => {
      expect(formatCurrency(42, "USDC ", 6)).toBe("+USDC 42.000000");
      expect(formatCurrency(-42.75, "NZ$", 1)).toBe("NZ$42.8");
      expect(formatCurrency(42.75, "", 0)).toBe("+43");
    });
  });

  describe("formatNumber", () => {
    it("uses en-US separators so output is not tied to the host locale", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(-1000)).toBe("-1,000");
      expect(formatNumber(1234567890)).toBe("1,234,567,890");
      expect(formatNumber(1234.56)).toBe("1,234.56");
    });
  });

  describe("formatChartValue", () => {
    it("keeps sub-thousand and negative values literal", () => {
      expect(formatChartValue(0)).toBe("0");
      expect(formatChartValue(999)).toBe("999");
      expect(formatChartValue(-1500)).toBe("-1500");
    });

    it("compacts thousand-and-above values with rounded k units", () => {
      expect(formatChartValue(1000)).toBe("1k");
      expect(formatChartValue(24000)).toBe("24k");
      expect(formatChartValue(999500)).toBe("1000k");
      expect(formatChartValue(1234.56)).toBe("1k");
    });
  });

  describe("truncateText", () => {
    it("preserves empty, short, and exact-length address-like strings", () => {
      expect(truncateText("", 8)).toBe("");
      expect(truncateText("GABC", 8)).toBe("GABC");
      expect(truncateText("G1234567", 8)).toBe("G1234567");
    });

    it("truncates over-limit addresses with an ellipsis", () => {
      expect(truncateText("GABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)).toBe("GABCDEFG...");
      expect(truncateText("GBULKTRANSFERDESTINATION", 0)).toBe("...");
    });
  });

  describe("capitalizeFirst", () => {
    it("normalizes mixed, empty, and already-capitalized words", () => {
      expect(capitalizeFirst("stellar")).toBe("Stellar");
      expect(capitalizeFirst("sTeLlAr")).toBe("Stellar");
      expect(capitalizeFirst("STELLAR")).toBe("Stellar");
      expect(capitalizeFirst("")).toBe("");
    });
  });
});
