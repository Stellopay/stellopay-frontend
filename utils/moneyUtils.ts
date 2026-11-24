export const MINOR_UNITS_PER_UNIT = 100;
export const BPS_PER_UNIT = 10_000;

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;
const TAX_RATE_PATTERN = /^(\d{1,2})(?:\.(\d{1,2}))?$/;

function toMinorUnits(whole: string, fraction = ""): number | null {
  const minor =
    Number(whole) * MINOR_UNITS_PER_UNIT + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor >= 0 ? minor : null;
}

export function parseMoneyToMinorUnits(value: string | number): number | null {
  const text = typeof value === "number" ? value.toString() : value.trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) return null;
  return toMinorUnits(match[1], match[2]);
}

export function formatMinorUnits(minorUnits: number): string {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new RangeError("Minor units must be a safe integer.");
  }
  const sign = minorUnits < 0 ? "-" : "";
  const absolute = Math.abs(minorUnits);
  const whole = Math.floor(absolute / MINOR_UNITS_PER_UNIT);
  const fraction = absolute % MINOR_UNITS_PER_UNIT;
  return `${sign}${whole}.${String(fraction).padStart(2, "0")}`;
}

export function parseTaxRateToBps(value: string | number): number | null {
  const text = typeof value === "number" ? value.toString() : value.trim();
  const match = TAX_RATE_PATTERN.exec(text);
  if (!match) return null;
  const bps = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return bps > BPS_PER_UNIT ? null : bps;
}

export interface MoneyLineItem {
  quantity: number;
  unitPriceMinorUnits: number;
}

export interface InvoiceTotals {
  subtotalMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
}

export function calculateInvoiceTotals(
  lines: readonly MoneyLineItem[],
  taxRateBps: number,
): InvoiceTotals {
  if (
    !Number.isInteger(taxRateBps) ||
    taxRateBps < 0 ||
    taxRateBps > BPS_PER_UNIT
  ) {
    throw new RangeError("Tax rate must be an integer number of basis points.");
  }

  let subtotalMinorUnits = 0;
  for (const line of lines) {
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 0 ||
      !Number.isSafeInteger(line.unitPriceMinorUnits) ||
      line.unitPriceMinorUnits < 0
    ) {
      throw new RangeError("Line items must have safe non-negative integers.");
    }
    subtotalMinorUnits += line.quantity * line.unitPriceMinorUnits;
  }
  if (!Number.isSafeInteger(subtotalMinorUnits)) {
    throw new RangeError("Invoice subtotal is too large.");
  }

  const taxMinorUnits = Math.round(
    (subtotalMinorUnits * taxRateBps) / BPS_PER_UNIT,
  );
  return {
    subtotalMinorUnits,
    taxMinorUnits,
    totalMinorUnits: subtotalMinorUnits + taxMinorUnits,
  };
}

export function formatTaxRate(bps: number): string {
  if (!Number.isInteger(bps) || bps < 0 || bps > BPS_PER_UNIT) {
    throw new RangeError("Tax rate must be an integer number of basis points.");
  }
  const whole = Math.floor(bps / 100);
  const fraction = bps % 100;
  if (fraction === 0) return String(whole);
  if (fraction % 10 === 0) return `${whole}.${fraction / 10}`;
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}
