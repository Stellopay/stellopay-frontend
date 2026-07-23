/**
 * @fileoverview Tests for components/ui/calendar.tsx
 *
 * Strategy: render the Calendar into jsdom and query individual day buttons
 * by their accessible name (the day number as a string).  react-day-picker
 * marks disabled days with `aria-disabled="true"` and sets the HTML
 * `disabled` attribute on the underlying <button> element, so both
 * attributes are asserted.
 *
 * All tests use a fixed reference month (July 2025) so they are
 * deterministic regardless of when the test suite runs.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Calendar } from "./calendar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a local-midnight Date for the given year/month(1-based)/day. */
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Find the <button> for a specific day number inside the rendered calendar.
 * react-day-picker gives each day button an accessible name that is either
 * just the number ("15") or the full date label — we match by the day number
 * wrapped in a word boundary to avoid matching "15" inside "15th June".
 */
function getDayButton(day: number): HTMLElement {
  // react-day-picker v8/v10 accessible name is the day number.
  return screen.getByRole("button", { name: new RegExp(`\\b${day}\\b`) });
}

function queryDayButton(day: number): HTMLElement | null {
  return screen.queryByRole("button", { name: new RegExp(`\\b${day}\\b`) });
}

// Fixed reference month rendered in all tests.
const JULY_2025 = d(2025, 7, 1); // month prop for DayPicker

const defaultProps = {
  mode: "single" as const,
  month: JULY_2025,
  onMonthChange: () => {},
};

// ─── Baseline (no minDate / maxDate) ─────────────────────────────────────────

describe("Calendar — baseline (no constraints)", () => {
  it("renders without throwing", () => {
    expect(() =>
      render(<Calendar {...defaultProps} />),
    ).not.toThrow();
  });

  it("renders day buttons for days in the month", () => {
    render(<Calendar {...defaultProps} />);
    expect(getDayButton(1)).toBeInTheDocument();
    expect(getDayButton(15)).toBeInTheDocument();
    expect(getDayButton(31)).toBeInTheDocument();
  });

  it("no day is disabled when neither minDate nor maxDate is provided", () => {
    render(<Calendar {...defaultProps} />);
    // Check a spread of days across the month.
    for (const day of [1, 10, 20, 31]) {
      const btn = getDayButton(day);
      expect(btn).not.toBeDisabled();
      expect(btn).not.toHaveAttribute("aria-disabled", "true");
    }
  });

  it("calls onSelect when a day is clicked in unconstrained mode", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar {...defaultProps} onSelect={onSelect} />,
    );
    await userEvent.click(getDayButton(15));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

// ─── minDate constraint ───────────────────────────────────────────────────────

describe("Calendar — minDate constraint", () => {
  // minDate = July 10, 2025 → days 1-9 disabled, days 10-31 enabled.
  const minDate = d(2025, 7, 10);

  beforeEach(() => {
    render(<Calendar {...defaultProps} minDate={minDate} />);
  });

  it("disables a day strictly before minDate", () => {
    const btn = getDayButton(9);
    expect(btn).toBeDisabled();
  });

  it("disables the day immediately before minDate", () => {
    expect(getDayButton(9)).toBeDisabled();
  });

  it("does NOT disable minDate itself (inclusive lower bound)", () => {
    expect(getDayButton(10)).not.toBeDisabled();
  });

  it("does NOT disable a day after minDate", () => {
    expect(getDayButton(20)).not.toBeDisabled();
  });

  it("does NOT disable the last day of the month when it is after minDate", () => {
    expect(getDayButton(31)).not.toBeDisabled();
  });

  it("sets aria-disabled on a day before minDate", () => {
    expect(getDayButton(5)).toHaveAttribute("aria-disabled", "true");
  });

  it("does not set aria-disabled on minDate", () => {
    expect(getDayButton(10)).not.toHaveAttribute("aria-disabled", "true");
  });

  it("does not call onSelect when a disabled (before minDate) day is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar {...defaultProps} minDate={minDate} onSelect={onSelect} />,
    );
    const disabledBtn = screen.getAllByRole("button", { name: /\b9\b/ })[0];
    // userEvent respects disabled — click must be a no-op.
    await userEvent.click(disabledBtn);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── maxDate constraint ───────────────────────────────────────────────────────

describe("Calendar — maxDate constraint", () => {
  // maxDate = July 20, 2025 → days 21-31 disabled, days 1-20 enabled.
  const maxDate = d(2025, 7, 20);

  beforeEach(() => {
    render(<Calendar {...defaultProps} maxDate={maxDate} />);
  });

  it("disables a day strictly after maxDate", () => {
    expect(getDayButton(21)).toBeDisabled();
  });

  it("disables the day immediately after maxDate", () => {
    expect(getDayButton(21)).toBeDisabled();
  });

  it("does NOT disable maxDate itself (inclusive upper bound)", () => {
    expect(getDayButton(20)).not.toBeDisabled();
  });

  it("does NOT disable a day before maxDate", () => {
    expect(getDayButton(10)).not.toBeDisabled();
  });

  it("does NOT disable the first day of the month when it is before maxDate", () => {
    expect(getDayButton(1)).not.toBeDisabled();
  });

  it("sets aria-disabled on a day after maxDate", () => {
    expect(getDayButton(25)).toHaveAttribute("aria-disabled", "true");
  });

  it("does not set aria-disabled on maxDate", () => {
    expect(getDayButton(20)).not.toHaveAttribute("aria-disabled", "true");
  });

  it("does not call onSelect when a disabled (after maxDate) day is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar {...defaultProps} maxDate={maxDate} onSelect={onSelect} />,
    );
    const disabledBtn = screen.getAllByRole("button", { name: /\b25\b/ })[0];
    await userEvent.click(disabledBtn);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── minDate + maxDate together ───────────────────────────────────────────────

describe("Calendar — minDate and maxDate together", () => {
  // valid range: July 10–20 inclusive.
  const minDate = d(2025, 7, 10);
  const maxDate = d(2025, 7, 20);

  beforeEach(() => {
    render(<Calendar {...defaultProps} minDate={minDate} maxDate={maxDate} />);
  });

  it("disables a day before minDate", () => {
    expect(getDayButton(5)).toBeDisabled();
  });

  it("disables a day after maxDate", () => {
    expect(getDayButton(25)).toBeDisabled();
  });

  it("does not disable minDate", () => {
    expect(getDayButton(10)).not.toBeDisabled();
  });

  it("does not disable maxDate", () => {
    expect(getDayButton(20)).not.toBeDisabled();
  });

  it("does not disable a day in the middle of the range", () => {
    expect(getDayButton(15)).not.toBeDisabled();
  });

  it("disables the day immediately outside the lower bound", () => {
    expect(getDayButton(9)).toBeDisabled();
  });

  it("disables the day immediately outside the upper bound", () => {
    expect(getDayButton(21)).toBeDisabled();
  });
});

// ─── Interaction with caller-supplied disabled prop ───────────────────────────

describe("Calendar — minDate/maxDate composing with caller disabled prop", () => {
  it("disables a day that is in-range but matched by the caller disabled function", async () => {
    const onSelect = vi.fn();
    // Range: July 1–31. Caller additionally disables July 15.
    render(
      <Calendar
        {...defaultProps}
        minDate={d(2025, 7, 1)}
        maxDate={d(2025, 7, 31)}
        disabled={(date) => date.getDate() === 15}
        onSelect={onSelect}
      />,
    );
    expect(getDayButton(15)).toBeDisabled();
    // In-range days not matched by caller disabled are still enabled.
    expect(getDayButton(10)).not.toBeDisabled();
  });

  it("disables a day matched by a caller disabled Date value", () => {
    render(
      <Calendar
        {...defaultProps}
        minDate={d(2025, 7, 1)}
        disabled={d(2025, 7, 15)}
      />,
    );
    expect(getDayButton(15)).toBeDisabled();
    expect(getDayButton(14)).not.toBeDisabled();
  });

  it("disables days matched by a caller disabled array of dates", () => {
    render(
      <Calendar
        {...defaultProps}
        disabled={[d(2025, 7, 5), d(2025, 7, 12)]}
      />,
    );
    expect(getDayButton(5)).toBeDisabled();
    expect(getDayButton(12)).toBeDisabled();
    expect(getDayButton(6)).not.toBeDisabled();
  });

  it("days before minDate remain disabled even if not in caller disabled list", () => {
    render(
      <Calendar
        {...defaultProps}
        minDate={d(2025, 7, 10)}
        disabled={(date) => date.getDate() === 20}
      />,
    );
    // Before minDate.
    expect(getDayButton(5)).toBeDisabled();
    // Caller-disabled in-range day.
    expect(getDayButton(20)).toBeDisabled();
    // In-range, not caller-disabled.
    expect(getDayButton(15)).not.toBeDisabled();
  });
});

// ─── Time-component normalisation ─────────────────────────────────────────────

describe("Calendar — minDate/maxDate time-component normalisation", () => {
  it("does not disable minDate when minDate has a non-zero time component", () => {
    // minDate set to July 10 at 23:59 — the day itself must still be selectable.
    const minWithTime = new Date(2025, 6, 10, 23, 59, 59, 999);
    render(<Calendar {...defaultProps} minDate={minWithTime} />);
    expect(getDayButton(10)).not.toBeDisabled();
  });

  it("does not disable maxDate when maxDate has a non-zero time component", () => {
    const maxWithTime = new Date(2025, 6, 20, 0, 0, 0, 1);
    render(<Calendar {...defaultProps} maxDate={maxWithTime} />);
    expect(getDayButton(20)).not.toBeDisabled();
  });

  it("still disables the day before minDate when minDate has a time component", () => {
    const minWithTime = new Date(2025, 6, 10, 23, 59, 59);
    render(<Calendar {...defaultProps} minDate={minWithTime} />);
    expect(getDayButton(9)).toBeDisabled();
  });
});

// ─── Edge: invalid Date objects ───────────────────────────────────────────────

describe("Calendar — invalid Date edge cases", () => {
  it("renders without error when minDate is an invalid Date", () => {
    expect(() =>
      render(
        <Calendar {...defaultProps} minDate={new Date("not-a-date")} />,
      ),
    ).not.toThrow();
  });

  it("renders without error when maxDate is an invalid Date", () => {
    expect(() =>
      render(
        <Calendar {...defaultProps} maxDate={new Date("not-a-date")} />,
      ),
    ).not.toThrow();
  });

  it("does not disable any days when minDate is invalid", () => {
    render(
      <Calendar {...defaultProps} minDate={new Date("not-a-date")} />,
    );
    expect(getDayButton(1)).not.toBeDisabled();
    expect(getDayButton(15)).not.toBeDisabled();
  });
});

// ─── In-range days selectable ─────────────────────────────────────────────────

describe("Calendar — in-range days remain fully selectable", () => {
  it("calls onSelect with the correct date when an in-range day is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar
        {...defaultProps}
        minDate={d(2025, 7, 1)}
        maxDate={d(2025, 7, 31)}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(getDayButton(15));
    expect(onSelect).toHaveBeenCalledOnce();
    const selected: Date = onSelect.mock.calls[0][0];
    expect(selected.getDate()).toBe(15);
    expect(selected.getMonth()).toBe(6); // 0-based July
    expect(selected.getFullYear()).toBe(2025);
  });

  it("does not call onSelect when a day before minDate is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar
        {...defaultProps}
        minDate={d(2025, 7, 10)}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(getDayButton(5));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not call onSelect when a day after maxDate is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar
        {...defaultProps}
        maxDate={d(2025, 7, 20)}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(getDayButton(25));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── queryDayButton used to avoid TS unused-import warning ───────────────────
// (queryDayButton is available if future tests need a nullable query)
void queryDayButton;
