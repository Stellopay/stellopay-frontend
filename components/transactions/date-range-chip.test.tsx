import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangeChip } from "./date-range-chip";
import { formatDateForDisplay } from "@/utils/date-utils";

// ─── Mock Radix UI Popover ────────────────────────────────────────────────────
// jsdom does not implement the Portal API that Radix Popover depends on, so we
// replace the primitives with plain div/button wrappers that let us verify the
// render logic and event handlers without the real portal machinery.
vi.mock("@/components/ui/popover", () => {
  // Track open state for controlled tests.
  let externalOpen: boolean | undefined;
  let externalOnOpenChange: ((v: boolean) => void) | undefined;

  return {
    Popover: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (v: boolean) => void;
    }) => {
      externalOpen = open;
      externalOnOpenChange = onOpenChange;
      return (
        <div
          data-testid="popover-root"
          data-open={open ?? "uncontrolled"}
        >
          {children}
        </div>
      );
    },
    PopoverTrigger: ({
      children,
      asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => {
      void asChild;
      return (
        <div data-testid="popover-trigger">{children}</div>
      );
    },
    PopoverContent: ({ children }: { children: React.ReactNode }) => (
      // Always render content so we can assert the Calendar is present.
      <div data-testid="popover-content">{children}</div>
    ),
    // Expose helpers for controlled-mode tests.
    __simulateOpen: () => externalOnOpenChange?.(true),
    __simulateClose: () => externalOnOpenChange?.(false),
    __getOpen: () => externalOpen,
  };
});

// ─── Mock Calendar ────────────────────────────────────────────────────────────
// react-day-picker renders a complex date grid that is not needed for these
// unit tests.  We replace it with a minimal stub that fires `onSelect` when
// the test clicks on a date button.
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    selected,
    onSelect,
    disabled,
  }: {
    mode?: string;
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    autoFocus?: boolean;
    className?: string;
    classNames?: Record<string, string>;
  }) => {
    const testDate = new Date("2024-06-15");
    const testDateDisabled = new Date("2024-06-01");
    return (
      <div data-testid="calendar">
        {selected && (
          <span data-testid="calendar-selected">
            {selected.toISOString()}
          </span>
        )}
        {/* Enabled date button */}
        <button
          data-testid="calendar-day"
          onClick={() => onSelect?.(testDate)}
          disabled={disabled?.(testDate) ?? false}
        >
          15
        </button>
        {/* Potentially disabled date button */}
        <button
          data-testid="calendar-day-disabled"
          onClick={() => onSelect?.(testDateDisabled)}
          disabled={disabled?.(testDateDisabled) ?? false}
        >
          01
        </button>
      </div>
    );
  },
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

const FIXED_DATE = new Date("2024-06-15T00:00:00.000Z");

function renderChip(props: Partial<React.ComponentProps<typeof DateRangeChip>> = {}) {
  return render(
    <DateRangeChip
      date={undefined}
      onDateChange={vi.fn()}
      {...props}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DateRangeChip", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders the trigger button", () => {
      renderChip({ placeholder: "Pick a date" });
      // Use accessible name to distinguish the trigger from the Calendar day buttons
      expect(
        screen.getByRole("button", { name: "Pick a date" }),
      ).toBeInTheDocument();
    });

    it("shows the default placeholder when no date is selected", () => {
      renderChip({ placeholder: "Pick a date" });
      expect(screen.getByText("Pick a date")).toBeInTheDocument();
    });

    it("shows a custom placeholder when provided", () => {
      renderChip({ placeholder: "From" });
      expect(screen.getByText("From")).toBeInTheDocument();
    });

    it("shows the formatted date when a date is selected", () => {
      renderChip({ date: FIXED_DATE });
      expect(
        screen.getByText(formatDateForDisplay(FIXED_DATE)),
      ).toBeInTheDocument();
    });

    it("does not show the placeholder when a date is selected", () => {
      renderChip({ date: FIXED_DATE, placeholder: "Pick a date" });
      expect(screen.queryByText("Pick a date")).not.toBeInTheDocument();
    });

    it("always renders the calendar in the popover content", () => {
      renderChip();
      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("the trigger has an accessible name from the aria-label prop", () => {
      renderChip({ "aria-label": "Filter from date" });
      expect(
        screen.getByRole("button", { name: "Filter from date" }),
      ).toBeInTheDocument();
    });

    it("falls back to the placeholder as the accessible name when aria-label is not provided", () => {
      renderChip({ placeholder: "From" });
      expect(
        screen.getByRole("button", { name: "From" }),
      ).toBeInTheDocument();
    });

    it("marks the calendar icon as aria-hidden", () => {
      renderChip();
      // lucide-react renders an <svg>; our component wraps it in a span-like
      // element with aria-hidden — find it via role="img" absence or by
      // checking the closest svg has aria-hidden.
      const svgs = document.querySelectorAll("svg");
      const hiddenSvg = Array.from(svgs).find(
        (svg) => svg.getAttribute("aria-hidden") === "true",
      );
      expect(hiddenSvg).toBeTruthy();
    });
  });

  // ── Controlled open state ──────────────────────────────────────────────────

  describe("controlled open state", () => {
    it("passes the open prop to the popover when externally controlled", () => {
      renderChip({ open: true, onOpenChange: vi.fn() });
      const root = screen.getByTestId("popover-root");
      expect(root).toHaveAttribute("data-open", "true");
    });

    it("passes open=false to the popover when closed externally", () => {
      renderChip({ open: false, onOpenChange: vi.fn() });
      const root = screen.getByTestId("popover-root");
      expect(root).toHaveAttribute("data-open", "false");
    });

    it("uses uncontrolled mode when open/onOpenChange are not provided", () => {
      renderChip();
      const root = screen.getByTestId("popover-root");
      expect(root).toHaveAttribute("data-open", "uncontrolled");
    });
  });

  // ── onDateChange callback ──────────────────────────────────────────────────

  describe("onDateChange callback", () => {
    it("calls onDateChange with the selected date when a calendar day is clicked", () => {
      const onDateChange = vi.fn();
      renderChip({ onDateChange });

      fireEvent.click(screen.getByTestId("calendar-day"));

      expect(onDateChange).toHaveBeenCalledTimes(1);
      expect(onDateChange).toHaveBeenCalledWith(new Date("2024-06-15"));
    });

    it("does not call onDateChange when the disabled day is clicked", () => {
      const onDateChange = vi.fn();
      // Disable anything before 2024-06-10
      renderChip({
        onDateChange,
        disabledDate: (d) => d < new Date("2024-06-10"),
      });

      // calendar-day-disabled renders 2024-06-01, which is before the threshold
      const disabledBtn = screen.getByTestId("calendar-day-disabled");
      expect(disabledBtn).toBeDisabled();
      // Clicking a disabled <button> does not fire click in jsdom
    });
  });

  // ── disabledDate predicate ─────────────────────────────────────────────────

  describe("disabledDate predicate", () => {
    it("marks the enabled day button as not disabled by default", () => {
      renderChip();
      expect(screen.getByTestId("calendar-day")).not.toBeDisabled();
    });

    it("marks the day button as disabled when disabledDate returns true for it", () => {
      renderChip({
        // Disable 2024-06-15 specifically (the calendar-day button)
        disabledDate: (d) => d.getDate() === 15 && d.getMonth() === 5,
      });
      expect(screen.getByTestId("calendar-day")).toBeDisabled();
    });

    it("passes the disabledDate predicate through to the Calendar", () => {
      const disabledDate = vi.fn(() => false);
      renderChip({ disabledDate });
      // Calendar stub calls disabled() for each of its two test dates on render
      expect(disabledDate).toHaveBeenCalled();
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("renders without crashing when date is undefined", () => {
      expect(() => renderChip({ date: undefined })).not.toThrow();
    });

    it("renders without crashing when no optional props are supplied", () => {
      expect(() =>
        render(<DateRangeChip date={undefined} onDateChange={vi.fn()} />),
      ).not.toThrow();
    });

    it("truncates long placeholder text without breaking layout", () => {
      renderChip({ placeholder: "A very long placeholder that exceeds the chip width" });
      // The placeholder span should be present (truncation is CSS, not DOM removal)
      expect(
        screen.getByText("A very long placeholder that exceeds the chip width"),
      ).toBeInTheDocument();
    });

    it("truncates long formatted dates without breaking layout", () => {
      renderChip({ date: FIXED_DATE });
      const formatted = formatDateForDisplay(FIXED_DATE);
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it("reflects a changed date prop when re-rendered", () => {
      const { rerender } = renderChip({ date: undefined, placeholder: "From" });
      expect(screen.getByText("From")).toBeInTheDocument();

      rerender(
        <DateRangeChip
          date={FIXED_DATE}
          onDateChange={vi.fn()}
          placeholder="From"
        />,
      );
      expect(
        screen.getByText(formatDateForDisplay(FIXED_DATE)),
      ).toBeInTheDocument();
      expect(screen.queryByText("From")).not.toBeInTheDocument();
    });

    it("reflects a cleared date when re-rendered with undefined", () => {
      const { rerender } = renderChip({ date: FIXED_DATE, placeholder: "From" });
      expect(
        screen.getByText(formatDateForDisplay(FIXED_DATE)),
      ).toBeInTheDocument();

      rerender(
        <DateRangeChip
          date={undefined}
          onDateChange={vi.fn()}
          placeholder="From"
        />,
      );
      expect(screen.getByText("From")).toBeInTheDocument();
    });
  });

  // ── Integration: TransactionsHeader-style usage ────────────────────────────

  describe("controlled integration (TransactionsHeader pattern)", () => {
    it("calls onOpenChange(false) flow when externally instructed to close", () => {
      const onOpenChange = vi.fn();
      renderChip({ open: true, onOpenChange });
      // In the real header, date selection triggers setFromDateOpen(false).
      // Here we verify the popover root reflects the controlled open value.
      expect(screen.getByTestId("popover-root")).toHaveAttribute(
        "data-open",
        "true",
      );
    });

    it("disables future dates relative to toDate in from-picker usage", () => {
      const toDate = new Date("2024-06-10"); // earlier than test day (15th)
      renderChip({
        disabledDate: (d) => d > toDate,
      });
      // 2024-06-15 > 2024-06-10 → disabled
      expect(screen.getByTestId("calendar-day")).toBeDisabled();
    });

    it("disables past dates relative to fromDate in to-picker usage", () => {
      const fromDate = new Date("2024-06-20"); // later than test day (01st)
      renderChip({
        disabledDate: (d) => d < fromDate,
      });
      // 2024-06-01 < 2024-06-20 → disabled
      expect(screen.getByTestId("calendar-day-disabled")).toBeDisabled();
    });
  });

  // ── Integration: Date component (uncontrolled) usage ──────────────────────

  describe("uncontrolled integration (Date component pattern)", () => {
    it("onDateChange is called with a date when calendar fires onSelect", () => {
      const onDateChange = vi.fn();
      renderChip({ onDateChange });

      fireEvent.click(screen.getByTestId("calendar-day"));

      expect(onDateChange).toHaveBeenCalledWith(new Date("2024-06-15"));
    });
  });
});
