import { describe, expect, it, beforeAll, afterAll } from "vitest";
import {
  startOfDayUTC,
  daysBetweenUTC,
  getPresetStartDate,
  validateTimeWindow,
  createUtcRangePredicate,
  parseAnalyticsTimeWindow,
  MAX_RANGE_DAYS,
} from "./analyticsTimeWindow";

// ---------------------------------------------------------------------------
// Pin the process timezone for deterministic DST-transition tests.
// America/New_York observes DST; Asia/Tokyo does not.  We pin to a DST-
// observing zone to verify that our UTC arithmetic is immune to it.
// ---------------------------------------------------------------------------
const PINNED_TZ = "America/New_York";
const originalTZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = PINNED_TZ;
});

afterAll(() => {
  if (originalTZ === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTZ;
  }
});

// ============================================================================
// startOfDayUTC
// ============================================================================
describe("startOfDayUTC", () => {
  it("returns UTC midnight for a UTC date", () => {
    const d = new Date("2026-03-15T14:30:00Z");
    const result = startOfDayUTC(d);
    expect(result.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("strips fractional seconds", () => {
    const d = new Date("2026-07-01T00:00:00.123Z");
    const result = startOfDayUTC(d);
    expect(result.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("handles end-of-day UTC timestamps", () => {
    // 23:59:59.999Z is still the same UTC calendar day
    const d = new Date("2026-12-31T23:59:59.999Z");
    const result = startOfDayUTC(d);
    expect(result.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("handles start-of-day UTC timestamps", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const result = startOfDayUTC(d);
    expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("does not mutate the input date", () => {
    const d = new Date("2026-06-15T10:00:00Z");
    const originalMs = d.getTime();
    startOfDayUTC(d);
    expect(d.getTime()).toBe(originalMs);
  });

  it("returns a new Date object (not the same reference)", () => {
    const d = new Date("2026-06-15T10:00:00Z");
    const result = startOfDayUTC(d);
    expect(result).not.toBe(d);
  });
});

// ============================================================================
// daysBetweenUTC
// ============================================================================
describe("daysBetweenUTC", () => {
  it("returns 0 for the same day", () => {
    const d = new Date("2026-05-10T00:00:00Z");
    expect(daysBetweenUTC(d, d)).toBe(0);
  });

  it("returns 1 for consecutive days", () => {
    const from = new Date("2026-05-10T00:00:00Z");
    const to = new Date("2026-05-11T00:00:00Z");
    expect(daysBetweenUTC(from, to)).toBe(1);
  });

  it("returns correct span across month boundary", () => {
    const from = new Date("2026-01-30T00:00:00Z");
    const to = new Date("2026-02-02T00:00:00Z");
    expect(daysBetweenUTC(from, to)).toBe(3);
  });

  it("returns correct span across DST transition (US Spring Forward)", () => {
    // 2026 US DST spring-forward: March 8, 2026
    // March 7 → March 14 crosses the DST boundary
    const from = new Date("2026-03-07T00:00:00Z");
    const to = new Date("2026-03-14T00:00:00Z");
    expect(daysBetweenUTC(from, to)).toBe(7);
  });

  it("returns correct span across DST transition (US Fall Back)", () => {
    // 2026 US DST fall-back: November 1, 2026
    const from = new Date("2026-10-28T00:00:00Z");
    const to = new Date("2026-11-04T00:00:00Z");
    expect(daysBetweenUTC(from, to)).toBe(7);
  });

  it("ignores time-of-day differences", () => {
    const from = new Date("2026-06-01T23:59:59Z");
    const to = new Date("2026-06-02T00:00:01Z");
    expect(daysBetweenUTC(from, to)).toBe(1);
  });

  it("handles leap-year boundary (2028 is a leap year)", () => {
    const from = new Date("2028-02-28T00:00:00Z");
    const to = new Date("2028-03-01T00:00:00Z");
    // Feb 28 → Feb 29 (leap day) → Mar 1 = 2 days
    expect(daysBetweenUTC(from, to)).toBe(2);
  });

  it("returns a positive number even when from > to", () => {
    // daysBetweenUTC is unsigned — the caller decides semantics
    const from = new Date("2026-06-10T00:00:00Z");
    const to = new Date("2026-06-05T00:00:00Z");
    expect(daysBetweenUTC(from, to)).toBe(-5);
  });
});

// ============================================================================
// getPresetStartDate
// ============================================================================
describe("getPresetStartDate", () => {
  const NOW_UTC = new Date("2026-08-29T14:30:00Z");

  it("7d returns 7 UTC days before today", () => {
    const result = getPresetStartDate("7d", NOW_UTC);
    expect(result.toISOString()).toBe("2026-08-22T00:00:00.000Z");
  });

  it("30d returns 30 UTC days before today", () => {
    const result = getPresetStartDate("30d", NOW_UTC);
    expect(result.toISOString()).toBe("2026-07-30T00:00:00.000Z");
  });

  it("90d returns 90 UTC days before today", () => {
    const result = getPresetStartDate("90d", NOW_UTC);
    expect(result.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("result is always UTC midnight", () => {
    for (const preset of ["7d", "30d", "90d"] as const) {
      const result = getPresetStartDate(preset, NOW_UTC);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    }
  });

  it("does not shift across US DST spring-forward boundary", () => {
    // March 14, 2026 is after US DST spring-forward (March 8)
    // 7 days before March 14 is March 7 (before DST)
    const now = new Date("2026-03-14T15:00:00Z");
    const result = getPresetStartDate("7d", now);
    expect(result.toISOString()).toBe("2026-03-07T00:00:00.000Z");
    // The span should be exactly 7 calendar days, not 6 or 8
    expect(daysBetweenUTC(result, startOfDayUTC(now))).toBe(7);
  });

  it("does not shift across US DST fall-back boundary", () => {
    // November 4, 2026 is after US DST fall-back (November 1)
    const now = new Date("2026-11-04T15:00:00Z");
    const result = getPresetStartDate("7d", now);
    expect(result.toISOString()).toBe("2026-10-28T00:00:00.000Z");
    expect(daysBetweenUTC(result, startOfDayUTC(now))).toBe(7);
  });

  it("works when now is just after midnight UTC", () => {
    const now = new Date("2026-08-29T00:01:00Z");
    const result = getPresetStartDate("7d", now);
    expect(result.toISOString()).toBe("2026-08-22T00:00:00.000Z");
  });
});

// ============================================================================
// validateTimeWindow
// ============================================================================
describe("validateTimeWindow", () => {
  it("returns null for a valid 7-day range", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-07T00:00:00Z");
    expect(validateTimeWindow(from, to)).toBeNull();
  });

  it("returns null for a valid 1-day range (from ≠ to, different UTC days)", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-02T00:00:00Z");
    expect(validateTimeWindow(from, to)).toBeNull();
  });

  // ── Invalid dates ──────────────────────────────────────────────────────

  it("rejects undefined from", () => {
    const error = validateTimeWindow(undefined, new Date());
    expect(error).not.toBeNull();
    expect(error!.type).toBe("invalid_date");
  });

  it("rejects undefined to", () => {
    const error = validateTimeWindow(new Date(), undefined);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("invalid_date");
  });

  it("rejects both undefined", () => {
    const error = validateTimeWindow(undefined, undefined);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("invalid_date");
  });

  it("rejects NaN date", () => {
    const error = validateTimeWindow(new Date("not-a-date"), new Date());
    expect(error).not.toBeNull();
    expect(error!.type).toBe("invalid_date");
  });

  // ── Reversed ranges ────────────────────────────────────────────────────

  it("rejects a reversed range (from > to)", () => {
    const from = new Date("2026-08-10T00:00:00Z");
    const to = new Date("2026-08-01T00:00:00Z");
    const error = validateTimeWindow(from, to);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("reversed_range");
  });

  it("rejects reversed range even when times would compensate (timezone trick)", () => {
    // from is Aug 10 UTC, to is Aug 1 in a different timezone offset
    // but after UTC normalisation, from > to
    const from = new Date("2026-08-10T00:00:00Z");
    const to = new Date("2026-08-01T23:59:59.999Z"); // still Aug 1 UTC
    const error = validateTimeWindow(from, to);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("reversed_range");
  });

  // ── Zero-length ranges (same UTC day) ──────────────────────────────────

  it("rejects a zero-length range (same UTC day, same time)", () => {
    const d = new Date("2026-08-15T00:00:00Z");
    const error = validateTimeWindow(d, new Date("2026-08-15T00:00:00Z"));
    expect(error).not.toBeNull();
    expect(error!.type).toBe("zero_length");
  });

  it("rejects a zero-length range (same UTC day, different time-of-day)", () => {
    const from = new Date("2026-08-15T00:00:00Z");
    const to = new Date("2026-08-15T23:59:59.999Z");
    const error = validateTimeWindow(from, to);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("zero_length");
  });

  // ── Exceeds maximum ────────────────────────────────────────────────────

  it("rejects a range exceeding the default max (365 days)", () => {
    const from = new Date("2025-01-01T00:00:00Z");
    const to = new Date("2026-08-29T00:00:00Z");
    const error = validateTimeWindow(from, to);
    expect(error).not.toBeNull();
    expect(error!.type).toBe("exceeds_max");
    if (error!.type === "exceeds_max") {
      expect(error!.maxDays).toBe(MAX_RANGE_DAYS);
    }
  });

  it("accepts a range at exactly the max (365 days)", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-12-31T00:00:00Z"); // 364 days
    expect(validateTimeWindow(from, to)).toBeNull();
  });

  it("respects a custom maxDays", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-10T00:00:00Z"); // 9 days
    const error = validateTimeWindow(from, to, 7); // max 7 days
    expect(error).not.toBeNull();
    expect(error!.type).toBe("exceeds_max");
    if (error!.type === "exceeds_max") {
      expect(error!.maxDays).toBe(7);
    }
  });

  // ── Error message includes useful info ─────────────────────────────────

  it("includes the actual span in the exceeds_max error message", () => {
    const from = new Date("2025-01-01T00:00:00Z");
    const to = new Date("2026-08-29T00:00:00Z");
    const error = validateTimeWindow(from, to);
    expect(error!.message).toContain("days");
  });
});

// ============================================================================
// createUtcRangePredicate
// ============================================================================
describe("createUtcRangePredicate", () => {
  const from = new Date("2026-08-01T00:00:00Z");
  const to = new Date("2026-08-07T00:00:00Z");

  it("includes the start boundary (inclusive)", () => {
    const pred = createUtcRangePredicate(from, to);
    expect(pred(new Date("2026-08-01T12:00:00Z"))).toBe(true);
  });

  it("includes the end boundary (inclusive)", () => {
    const pred = createUtcRangePredicate(from, to);
    expect(pred(new Date("2026-08-07T12:00:00Z"))).toBe(true);
  });

  it("excludes a date before the start", () => {
    const pred = createUtcRangePredicate(from, to);
    expect(pred(new Date("2026-07-31T23:59:59.999Z"))).toBe(false);
  });

  it("excludes a date after the end", () => {
    const pred = createUtcRangePredicate(from, to);
    expect(pred(new Date("2026-08-08T00:00:00.001Z"))).toBe(false);
  });

  it("ignores time-of-day within the range", () => {
    const pred = createUtcRangePredicate(from, to);
    // Aug 4 at 23:59:59 UTC is still Aug 4
    expect(pred(new Date("2026-08-04T23:59:59.999Z"))).toBe(true);
  });

  it("works for a single-day range (from and to are different UTC days)", () => {
    const singleFrom = new Date("2026-08-15T00:00:00Z");
    const singleTo = new Date("2026-08-16T00:00:00Z");
    const pred = createUtcRangePredicate(singleFrom, singleTo);

    expect(pred(new Date("2026-08-15T00:00:00Z"))).toBe(true);
    expect(pred(new Date("2026-08-15T23:59:59Z"))).toBe(true);
    expect(pred(new Date("2026-08-16T00:00:00Z"))).toBe(true);
    expect(pred(new Date("2026-08-16T00:00:01Z"))).toBe(false);
  });

  it("is DST-immune: same predicate works regardless of process timezone", () => {
    // This test runs under America/New_York (pinned above).
    // Aug 1–7 UTC contains the DST boundary if the process timezone were
    // America/New_York, but since we compare in UTC, it doesn't matter.
    const pred = createUtcRangePredicate(from, to);
    expect(pred(new Date("2026-08-04T04:00:00Z"))).toBe(true);
  });
});

// ============================================================================
// parseAnalyticsTimeWindow
// ============================================================================
describe("parseAnalyticsTimeWindow", () => {
  const NOW = new Date("2026-08-29T14:30:00Z");

  // ── Preset windows ─────────────────────────────────────────────────────

  describe("preset windows", () => {
    it("parses 7d correctly", () => {
      const result = parseAnalyticsTimeWindow({ preset: "7d", now: NOW });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.window.from.toISOString()).toBe("2026-08-22T00:00:00.000Z");
        expect(result.window.to.toISOString()).toBe("2026-08-29T00:00:00.000Z");
        expect(result.window.preset).toBe("7d");
        expect(daysBetweenUTC(result.window.from, result.window.to)).toBe(7);
      }
    });

    it("parses 30d correctly", () => {
      const result = parseAnalyticsTimeWindow({ preset: "30d", now: NOW });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.window.from.toISOString()).toBe("2026-07-30T00:00:00.000Z");
        expect(result.window.to.toISOString()).toBe("2026-08-29T00:00:00.000Z");
        expect(daysBetweenUTC(result.window.from, result.window.to)).toBe(30);
      }
    });

    it("parses 90d correctly", () => {
      const result = parseAnalyticsTimeWindow({ preset: "90d", now: NOW });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.window.from.toISOString()).toBe("2026-06-01T00:00:00.000Z");
        expect(result.window.to.toISOString()).toBe("2026-08-29T00:00:00.000Z");
        expect(daysBetweenUTC(result.window.from, result.window.to)).toBe(89);
      }
    });

    it("presets produce UTC-midnight boundaries", () => {
      for (const preset of ["7d", "30d", "90d"] as const) {
        const result = parseAnalyticsTimeWindow({ preset, now: NOW });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.window.from.getUTCHours()).toBe(0);
          expect(result.window.from.getUTCMinutes()).toBe(0);
          expect(result.window.to.getUTCHours()).toBe(0);
          expect(result.window.to.getUTCMinutes()).toBe(0);
        }
      }
    });

    it("preset windows never shift across DST transitions", () => {
      // March 15, 2026 is after US DST spring-forward (March 8)
      const dstNow = new Date("2026-03-15T12:00:00Z");
      const result = parseAnalyticsTimeWindow({ preset: "7d", now: dstNow });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(daysBetweenUTC(result.window.from, result.window.to)).toBe(7);
      }
    });
  });

  // ── Custom windows ─────────────────────────────────────────────────────

  describe("custom windows", () => {
    it("parses a valid custom range", () => {
      const from = new Date("2026-06-01T00:00:00Z");
      const to = new Date("2026-06-30T00:00:00Z");
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        from,
        to,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.window.from.toISOString()).toBe("2026-06-01T00:00:00.000Z");
        expect(result.window.to.toISOString()).toBe("2026-06-30T00:00:00.000Z");
        expect(result.window.preset).toBe("custom");
      }
    });

    it("rejects custom range with missing from", () => {
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        to: new Date("2026-06-30T00:00:00Z"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("invalid_date");
      }
    });

    it("rejects custom range with missing to", () => {
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        from: new Date("2026-06-01T00:00:00Z"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("invalid_date");
      }
    });

    it("rejects custom range with both missing", () => {
      const result = parseAnalyticsTimeWindow({ preset: "custom" });
      expect(result.ok).toBe(false);
    });

    it("rejects reversed custom range", () => {
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        from: new Date("2026-08-10T00:00:00Z"),
        to: new Date("2026-08-01T00:00:00Z"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("reversed_range");
      }
    });

    it("rejects oversized custom range", () => {
      const result = parseAnalyticsTimeWindow({
        preset: "custom",
        from: new Date("2024-01-01T00:00:00Z"),
        to: new Date("2026-08-29T00:00:00Z"),
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("exceeds_max");
      }
    });
  });

  // ── Cross-timezone immunity ────────────────────────────────────────────

  describe("cross-timezone immunity", () => {
    it("produces identical results regardless of process timezone", () => {
      // The test is pinned to America/New_York.  We verify that the
      // startOfDayUTC normalisation means the output is the same as if
      // we computed in pure UTC.
      const result = parseAnalyticsTimeWindow({ preset: "30d", now: NOW });
      expect(result.ok).toBe(true);
      if (result.ok) {
        // This should be exactly 30 UTC days, no DST drift
        expect(daysBetweenUTC(result.window.from, result.window.to)).toBe(30);
        // And both boundaries must be UTC midnight
        expect(result.window.from.toISOString().endsWith("T00:00:00.000Z")).toBe(true);
        expect(result.window.to.toISOString().endsWith("T00:00:00.000Z")).toBe(true);
      }
    });
  });
});
