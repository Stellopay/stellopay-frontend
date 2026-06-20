import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateForDisplay,
  formatDateForInput,
  getCurrentDate,
  isDateInRange,
  parseTransactionDate,
} from "@/utils/dateUtils";

describe("dateUtils", () => {
  it("formats ISO date strings and Date objects for display/input controls", () => {
    const date = new Date("2024-01-15T12:30:00.000Z");

    expect(formatDate("2024-01-15T12:30:00.000Z")).toBe("Jan 15, 2024");
    expect(formatDateForInput(date)).toBe("2024-01-15");
    expect(formatDateForDisplay(date)).toBe("15/01/2024");
  });

  it("returns today's date in YYYY-MM-DD input format", () => {
    expect(getCurrentDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses transaction table date labels and rejects malformed labels", () => {
    const parsed = parseTransactionDate("Apr 12, 2023");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2023);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(12);
    expect(parseTransactionDate("not-a-date")).toBeNull();
  });

  it("checks Date objects inclusively when both range endpoints are provided", () => {
    const start = new Date("2024-01-01T00:00:00.000Z");
    const middle = new Date("2024-01-15T00:00:00.000Z");
    const end = new Date("2024-01-31T00:00:00.000Z");
    const after = new Date("2024-02-01T00:00:00.000Z");

    expect(isDateInRange(start, start, end)).toBe(true);
    expect(isDateInRange(middle, start, end)).toBe(true);
    expect(isDateInRange(end, start, end)).toBe(true);
    expect(isDateInRange(after, start, end)).toBe(false);
  });

  it("keeps Date objects visible when a complete Date range is not available", () => {
    const date = new Date("2024-01-15T00:00:00.000Z");
    const start = new Date("2024-01-01T00:00:00.000Z");

    expect(isDateInRange(date, start, undefined as unknown as Date)).toBe(true);
  });

  it("checks transaction date labels with optional range endpoints", () => {
    const start = new Date("2023-04-01T00:00:00.000Z");
    const end = new Date("2023-04-30T00:00:00.000Z");

    expect(isDateInRange("Apr 12, 2023", undefined, undefined)).toBe(true);
    expect(isDateInRange("Apr 12, 2023", start, undefined)).toBe(true);
    expect(isDateInRange("Mar 31, 2023", start, undefined)).toBe(false);
    expect(isDateInRange("Apr 12, 2023", undefined, end)).toBe(true);
    expect(isDateInRange("May 01, 2023", undefined, end)).toBe(false);
    expect(isDateInRange("Apr 12, 2023", start, end)).toBe(true);
    expect(isDateInRange("May 01, 2023", start, end)).toBe(false);
  });

  it("keeps malformed transaction date labels visible instead of filtering them out", () => {
    const start = new Date("2023-04-01T00:00:00.000Z");
    const end = new Date("2023-04-30T00:00:00.000Z");

    expect(isDateInRange("bad-date", start, end)).toBe(true);
  });
});
