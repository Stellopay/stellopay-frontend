import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import TransactionsHeader from "./transactions-header";
import type { TransactionsHeaderProps } from "@/types/transaction";

// Keep the real chips and popovers, but replace the clock-dependent calendar
// with fixed choices, including an empty selection and date-range boundaries.
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    disabled,
  }: {
    onSelect: (date: Date | undefined) => void;
    disabled: (date: Date) => boolean;
  }) => (
    <div role="group" aria-label="Date choices">
      {(
        [
          ["Before", new Date("2024-06-14T00:00:00Z")],
          ["Boundary", new Date("2024-06-15T00:00:00Z")],
          ["After", new Date("2024-06-16T00:00:00Z")],
          ["Epoch", new Date(0)],
          ["Maximum", new Date(8_640_000_000_000_000)],
          ["Local day", new Date(2024, 1, 29, 23, 30)],
          ["Last four-digit year", new Date(9999, 11, 31)],
        ] satisfies [string, Date][]
      ).map(([label, date]) => (
        <button
          key={label}
          disabled={disabled(date)}
          onClick={() => onSelect(date)}
        >
          {label}
        </button>
      ))}
      <button onClick={() => onSelect(undefined)}>Empty selection</button>
    </div>
  ),
}));

afterEach(cleanup);

function renderHeader(props: Partial<TransactionsHeaderProps> = {}) {
  const callbacks = {
    onFromDateChange: vi.fn(),
    onToDateChange: vi.fn(),
  };
  const result = render(
    <TransactionsHeader fromDate="" toDate="" {...callbacks} {...props} />,
  );
  return { ...result, ...callbacks };
}

function openPicker(side: "from" | "to") {
  const trigger = screen.getByRole("button", { name: `Filter ${side} date` });
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  return trigger;
}

describe("TransactionsHeader", () => {
  it("renders the heading, empty placeholders and corrected separator", () => {
    const callbacks = renderHeader();

    expect(
      screen.getByRole("heading", { level: 1, name: "Transactions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter from date" }),
    ).toHaveTextContent("From");
    expect(
      screen.getByRole("button", { name: "Filter to date" }),
    ).toHaveTextContent("To");
    expect(screen.getByText("to", { exact: true })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByText("Tom")).not.toBeInTheDocument();
    for (const side of ["from", "to"]) {
      expect(
        screen.getByRole("button", { name: `Filter ${side} date` }),
      ).toHaveClass("w-[140px]");
    }
    expect(
      screen.queryByRole("group", { name: "Date choices" }),
    ).not.toBeInTheDocument();
    expect(callbacks.onFromDateChange).not.toHaveBeenCalled();
    expect(callbacks.onToDateChange).not.toHaveBeenCalled();
  });

  it("renders controlled dates and reflects changed and cleared props", () => {
    const { rerender, onFromDateChange, onToDateChange } = renderHeader({
      fromDate: "2024-06-14T12:00:00",
      toDate: "2024-06-15T12:00:00",
    });
    const from = screen.getByRole("button", { name: "Filter from date" });
    const to = screen.getByRole("button", { name: "Filter to date" });
    expect(from).toHaveTextContent("14-06-2024");
    expect(to).toHaveTextContent("15-06-2024");

    rerender(
      <TransactionsHeader
        fromDate=""
        toDate="9999-12-31T12:00:00"
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
      />,
    );
    expect(from).toHaveTextContent("From");
    expect(to).toHaveTextContent("31-12-9999");
    expect(onFromDateChange).not.toHaveBeenCalled();
    expect(onToDateChange).not.toHaveBeenCalled();
  });

  it.each(["from", "to"] as const)(
    "formats the %s selection as a local calendar day, calls only its callback and closes",
    (side) => {
      const callbacks = renderHeader();
      const trigger = openPicker(side);
      fireEvent.click(screen.getByRole("button", { name: "Local day" }));

      const selected =
        side === "from" ? callbacks.onFromDateChange : callbacks.onToDateChange;
      const other =
        side === "from" ? callbacks.onToDateChange : callbacks.onFromDateChange;
      expect(selected).toHaveBeenCalledExactlyOnceWith("2024-02-29");
      expect(other).not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveTextContent(side === "from" ? "From" : "To");
      expect(
        screen.queryByRole("group", { name: "Date choices" }),
      ).not.toBeInTheDocument();
    },
  );

  it.each(["from", "to"] as const)(
    "ignores an empty %s selection and keeps the picker open",
    (side) => {
      const callbacks = renderHeader();
      const trigger = openPicker(side);
      fireEvent.click(screen.getByRole("button", { name: "Empty selection" }));

      expect(callbacks.onFromDateChange).not.toHaveBeenCalled();
      expect(callbacks.onToDateChange).not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("group", { name: "Date choices" }),
      ).toBeInTheDocument();
    },
  );

  it.each(["from", "to"] as const)(
    "allows the %s picker to be dismissed and reopened",
    (side) => {
      renderHeader();
      const trigger = openPicker(side);
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      openPicker(side);
    },
  );

  it.each(["from", "to"] as const)(
    "leaves %s dates unrestricted without the opposite bound",
    (side) => {
      renderHeader();
      openPicker(side);
      const choices = within(
        screen.getByRole("group", { name: "Date choices" }),
      );
      for (const name of ["Before", "Boundary", "After", "Epoch", "Maximum"]) {
        expect(
          choices.getByRole("button", { name, exact: true }),
        ).toBeEnabled();
      }
    },
  );

  it.each(["from", "to"] as const)(
    "enforces the inclusive opposite bound for %s dates",
    (side) => {
      const callbacks = renderHeader(
        side === "from" ? { toDate: "2024-06-15" } : { fromDate: "2024-06-15" },
      );
      const trigger = openPicker(side);
      const blocked = screen.getByRole("button", {
        name: side === "from" ? "After" : "Before",
        exact: true,
      });
      expect(blocked).toBeDisabled();
      fireEvent.click(blocked);
      expect(callbacks.onFromDateChange).not.toHaveBeenCalled();
      expect(callbacks.onToDateChange).not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("button", {
          name: side === "from" ? "Before" : "After",
          exact: true,
        }),
      ).toBeEnabled();
      const epoch = screen.getByRole("button", { name: "Epoch", exact: true });
      const maximum = screen.getByRole("button", {
        name: "Maximum",
        exact: true,
      });
      if (side === "from") {
        expect(epoch).toBeEnabled();
        expect(maximum).toBeDisabled();
      } else {
        expect(epoch).toBeDisabled();
        expect(maximum).toBeEnabled();
      }
      const boundary = screen.getByRole("button", {
        name: "Boundary",
        exact: true,
      });
      expect(boundary).toBeEnabled();
      fireEvent.click(boundary);
      expect(
        side === "from" ? callbacks.onFromDateChange : callbacks.onToDateChange,
      ).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    },
  );

  it.each(["from", "to"] as const)(
    "accepts the last four-digit calendar year for %s",
    (side) => {
      const callbacks = renderHeader();
      openPicker(side);
      fireEvent.click(
        screen.getByRole("button", { name: "Last four-digit year" }),
      );
      expect(
        side === "from" ? callbacks.onFromDateChange : callbacks.onToDateChange,
      ).toHaveBeenCalledExactlyOnceWith("9999-12-31");
    },
  );
});
