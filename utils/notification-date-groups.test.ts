import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NotificationItem } from "@/types/notification-item";
import { groupByDate, toDateSections } from "./notification-date-groups";

let seq = 0;
/** Builds a notification at a *local* wall-clock time. */
function at(timestamp: string | undefined): NotificationItem {
  seq += 1;
  return { id: `n${seq}`, title: `T${seq}`, message: "m", read: false, timestamp };
}
const local = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(y, m, d, h, min, s, ms).toISOString();

const ids = (items: NotificationItem[]) => items.map((n) => n.id);

describe("groupByDate", () => {
  const now = new Date(2026, 6, 30, 12, 0, 0); // 30 Jul 2026, 12:00 local

  it("puts notifications from the current local day in Today", () => {
    const a = at(local(2026, 6, 30, 11, 59));
    const b = at(local(2026, 6, 30, 0, 0, 0, 0));
    expect(ids(groupByDate([a, b], now).Today)).toEqual([a.id, b.id]);
  });

  it("puts notifications from the previous local day in Yesterday", () => {
    const a = at(local(2026, 6, 29, 23, 59, 59, 999));
    const b = at(local(2026, 6, 29, 0, 0, 0, 0));
    const groups = groupByDate([a, b], now);
    expect(ids(groups.Yesterday)).toEqual([a.id, b.id]);
    expect(groups.Today).toHaveLength(0);
  });

  it("puts anything older in Earlier", () => {
    const a = at(local(2026, 6, 28, 23, 59, 59, 999));
    const b = at(local(2025, 0, 1));
    expect(ids(groupByDate([a, b], now).Earlier)).toEqual([a.id, b.id]);
  });

  it("splits exactly on local midnight, not on a rolling 24 hours", () => {
    const early = new Date(2026, 6, 30, 0, 30); // 00:30 today
    const lastNight = at(local(2026, 6, 29, 23, 45)); // 45 minutes ago
    const dayBefore = at(local(2026, 6, 28, 23, 45)); // < 25h ago but 2 days back
    const groups = groupByDate([lastNight, dayBefore], early);
    expect(ids(groups.Yesterday)).toEqual([lastNight.id]);
    expect(ids(groups.Earlier)).toEqual([dayBefore.id]);
  });

  it("handles month and year rollovers", () => {
    const newYear = new Date(2027, 0, 1, 9, 0);
    const nye = at(local(2026, 11, 31, 22));
    const dec30 = at(local(2026, 11, 30, 22));
    const groups = groupByDate([nye, dec30], newYear);
    expect(ids(groups.Yesterday)).toEqual([nye.id]);
    expect(ids(groups.Earlier)).toEqual([dec30.id]);

    const march1 = new Date(2026, 2, 1, 9, 0);
    const feb28 = at(local(2026, 1, 28, 9));
    expect(ids(groupByDate([feb28], march1).Yesterday)).toEqual([feb28.id]);
  });

  it("compares instants, so timestamps with different offsets group correctly", () => {
    const sameInstantAsLocalNoon = at(now.toISOString().replace("Z", "+00:00"));
    expect(ids(groupByDate([sameInstantAsLocalNoon], now).Today)).toEqual([
      sameInstantAsLocalNoon.id,
    ]);
  });

  it("treats future timestamps (clock skew) as Today", () => {
    const future = at(local(2026, 6, 31, 9));
    expect(ids(groupByDate([future], now).Today)).toEqual([future.id]);
  });

  it("keeps notifications with a missing or invalid timestamp, under Earlier", () => {
    const missing = at(undefined);
    const empty = at("");
    const garbage = at("not-a-date");
    const groups = groupByDate([missing, empty, garbage], now);
    expect(ids(groups.Earlier)).toEqual([missing.id, empty.id, garbage.id]);
    expect(groups.Today).toHaveLength(0);
    expect(groups.Yesterday).toHaveLength(0);
  });

  it("preserves input order within each group and does not mutate input", () => {
    const input = [
      at(local(2026, 6, 30, 1)),
      at(local(2026, 6, 29, 1)),
      at(local(2026, 6, 30, 9)),
    ];
    const snapshot = [...input];
    const groups = groupByDate(input, now);
    expect(ids(groups.Today)).toEqual([input[0].id, input[2].id]);
    expect(input).toEqual(snapshot);
  });

  it("returns three empty groups for no input", () => {
    expect(groupByDate([], now)).toEqual({ Today: [], Yesterday: [], Earlier: [] });
  });

  it("defaults to the current time", () => {
    const justNow = at(new Date().toISOString());
    expect(ids(groupByDate([justNow]).Today)).toEqual([justNow.id]);
  });
});

describe("groupByDate across a DST transition", () => {
  let previousTz: string | undefined;

  beforeEach(() => {
    previousTz = process.env.TZ;
    // US clocks spring forward on 8 Mar 2026, making that local day 23h long.
    process.env.TZ = "America/New_York";
  });

  afterEach(() => {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  });

  it("uses the real local midnight rather than now minus 24h", () => {
    const now = new Date(2026, 2, 9, 0, 30); // 00:30 EDT, 9 Mar
    // 23:55 EST on 7 Mar is two calendar days ago, but under 25h before
    // local midnight; a fixed-24h subtraction would call it Yesterday.
    const mar7 = at(new Date(2026, 2, 7, 23, 55).toISOString());
    const mar8 = at(new Date(2026, 2, 8, 0, 5).toISOString());
    const groups = groupByDate([mar7, mar8], now);
    expect(ids(groups.Yesterday)).toEqual([mar8.id]);
    expect(ids(groups.Earlier)).toEqual([mar7.id]);
  });
});

describe("toDateSections", () => {
  it("returns non-empty groups in Today, Yesterday, Earlier order", () => {
    const today = at("2026-07-30T10:00:00Z");
    const earlier = at("2026-01-01T10:00:00Z");
    const sections = toDateSections({ Today: [today], Yesterday: [], Earlier: [earlier] });
    expect(sections.map((s) => s.group)).toEqual(["Today", "Earlier"]);
    expect(sections[0].items).toEqual([today]);
  });
});
