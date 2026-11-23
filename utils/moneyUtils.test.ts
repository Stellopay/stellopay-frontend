import { describe, expect, it } from "vitest";
import {
  calculateInvoiceTotals,
  formatMinorUnits,
  formatTaxRate,
  parseMoneyToMinorUnits,
  parseTaxRateToBps,
} from "./moneyUtils";

describe("parseMoneyToMinorUnits", () => {
  it.each([
    ["0", 0],
    ["0.1", 10],
    ["0.01", 1],
    ["19.99", 1999],
    ["1,000.50".replace(",", ""), 100050],
    [" 12.30 ", 1230],
    [0.1, 10],
    [19.99, 1999],
  ])("converts %s exactly", (input, expected) => {
    expect(parseMoneyToMinorUnits(input)).toBe(expected);
  });

  it.each(["", "abc", "-1", "1.234", "1.", ".5", "1e2", "NaN"])(
    "rejects invalid amount %s",
    (input) => {
      expect(parseMoneyToMinorUnits(input)).toBeNull();
    },
  );

  it("rejects negative and non-finite numbers", () => {
    expect(parseMoneyToMinorUnits(-1)).toBeNull();
    expect(parseMoneyToMinorUnits(Number.NaN)).toBeNull();
    expect(parseMoneyToMinorUnits(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("formatMinorUnits", () => {
  it.each([
    [0, "0.00"],
    [1, "0.01"],
    [10, "0.10"],
    [1999, "19.99"],
    [100050, "1000.50"],
    [-125, "-1.25"],
  ])("formats %d as %s", (input, expected) => {
    expect(formatMinorUnits(input)).toBe(expected);
  });

  it("rejects non-integers", () => {
    expect(() => formatMinorUnits(1.5)).toThrow(RangeError);
  });
});

describe("parseTaxRateToBps / formatTaxRate", () => {
  it.each([
    ["0", 0],
    ["7", 700],
    ["7.5", 750],
    ["7.55", 755],
    [8.25, 825],
  ])("converts %s to %d basis points", (input, expected) => {
    expect(parseTaxRateToBps(input)).toBe(expected);
  });

  it.each(["", "-1", "100", "99.999", "abc"])(
    "rejects invalid tax rate %s",
    (input) => {
      expect(parseTaxRateToBps(input)).toBeNull();
    },
  );

  it("formats basis points back to a percentage", () => {
    expect(formatTaxRate(0)).toBe("0");
    expect(formatTaxRate(750)).toBe("7.5");
    expect(formatTaxRate(825)).toBe("8.25");
  });
});

describe("calculateInvoiceTotals", () => {
  it("adds decimal line prices without float drift", () => {
    const totals = calculateInvoiceTotals(
      [
        { quantity: 1, unitPriceMinorUnits: 1999 },
        { quantity: 2, unitPriceMinorUnits: 10 },
        { quantity: 3, unitPriceMinorUnits: 333 },
      ],
      0,
    );
    expect(totals).toEqual({
      subtotalMinorUnits: 3018,
      taxMinorUnits: 0,
      totalMinorUnits: 3018,
    });
  });

  it("rounds tax once to the nearest minor unit", () => {
    const totals = calculateInvoiceTotals(
      [{ quantity: 1, unitPriceMinorUnits: 1000 }],
      750,
    );
    expect(totals.taxMinorUnits).toBe(75);
    expect(totals.totalMinorUnits).toBe(1075);

    const rounding = calculateInvoiceTotals(
      [{ quantity: 1, unitPriceMinorUnits: 101 }],
      750,
    );
    expect(rounding.taxMinorUnits).toBe(8);
    expect(rounding.totalMinorUnits).toBe(109);
  });

  it("returns zero totals for an empty invoice", () => {
    expect(calculateInvoiceTotals([], 750)).toEqual({
      subtotalMinorUnits: 0,
      taxMinorUnits: 0,
      totalMinorUnits: 0,
    });
  });

  it("rejects invalid inputs instead of producing wrong money", () => {
    expect(() =>
      calculateInvoiceTotals([{ quantity: -1, unitPriceMinorUnits: 100 }], 0),
    ).toThrow(RangeError);
    expect(() =>
      calculateInvoiceTotals([{ quantity: 1, unitPriceMinorUnits: 1.5 }], 0),
    ).toThrow(RangeError);
    expect(() => calculateInvoiceTotals([], -1)).toThrow(RangeError);
  });
});
