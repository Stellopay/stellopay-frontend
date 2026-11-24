import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BulkActionBar } from "./bulk-action-bar";
import {
  validateSelectedCount,
  BulkActionBarValidationError,
  MAX_SELECTED_COUNT,
} from "./bulk-action-bar-validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shortcut for the four required callbacks. */
const noopHandlers = {
  onExport: vi.fn(),
  onTag: vi.fn(),
  onArchive: vi.fn(),
  onClearSelection: vi.fn(),
};

// ---------------------------------------------------------------------------
// 1.  Pure validation function (unit tests)
// ---------------------------------------------------------------------------

describe("validateSelectedCount", () => {
  // --- valid values pass through unchanged ---

  it.each([0, 1, 42, 999, MAX_SELECTED_COUNT])(
    "returns %i unchanged for a valid integer",
    (n) => {
      expect(validateSelectedCount(n)).toBe(n);
    },
  );

  // --- INVALID_TYPE ---

  it("throws INVALID_TYPE for NaN", () => {
    expect(() => validateSelectedCount(NaN)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(NaN);
    } catch (e) {
      expect(e).toBeInstanceOf(BulkActionBarValidationError);
      expect((e as BulkActionBarValidationError).code).toBe("INVALID_TYPE");
    }
  });

  it("throws INVALID_TYPE for Infinity", () => {
    expect(() => validateSelectedCount(Infinity)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(Infinity);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("INVALID_TYPE");
    }
  });

  it("throws INVALID_TYPE for -Infinity", () => {
    expect(() => validateSelectedCount(-Infinity)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(-Infinity);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("INVALID_TYPE");
    }
  });

  // --- NOT_INTEGER ---

  it("throws NOT_INTEGER for 1.5", () => {
    expect(() => validateSelectedCount(1.5)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(1.5);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("NOT_INTEGER");
    }
  });

  it("throws NOT_INTEGER for 0.1", () => {
    try {
      validateSelectedCount(0.1);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("NOT_INTEGER");
    }
  });

  // --- NEGATIVE ---

  it("throws NEGATIVE for -1", () => {
    expect(() => validateSelectedCount(-1)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(-1);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("NEGATIVE");
    }
  });

  it("throws NEGATIVE for -100", () => {
    try {
      validateSelectedCount(-100);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("NEGATIVE");
    }
  });

  // --- OVERSIZED ---

  it("throws OVERSIZED for MAX_SELECTED_COUNT + 1", () => {
    expect(() => validateSelectedCount(MAX_SELECTED_COUNT + 1)).toThrow(
      BulkActionBarValidationError,
    );
    try {
      validateSelectedCount(MAX_SELECTED_COUNT + 1);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("OVERSIZED");
    }
  });

  it("throws OVERSIZED for a very large number", () => {
    try {
      validateSelectedCount(999_999_999);
    } catch (e) {
      expect((e as BulkActionBarValidationError).code).toBe("OVERSIZED");
    }
  });

  // --- error is an instance of Error ---

  it("thrown error is an instance of both Error and BulkActionBarValidationError", () => {
    try {
      validateSelectedCount(NaN);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(BulkActionBarValidationError);
    }
  });

  // --- error.message is human-readable ---

  it("error message includes the received value", () => {
    try {
      validateSelectedCount(-5);
    } catch (e) {
      expect((e as Error).message).toContain("-5");
    }
  });
});

// ---------------------------------------------------------------------------
// 2.  Component-level rendering tests
// ---------------------------------------------------------------------------

describe("BulkActionBar", () => {
  // --- Happy path ---

  it("renders the bar when selectedCount is 1", () => {
    render(<BulkActionBar selectedCount={1} {...noopHandlers} />);
    expect(screen.getByTestId("bulk-action-bar")).toBeInTheDocument();
    expect(screen.getByText("1 transaction selected")).toBeInTheDocument();
  });

  it("renders the bar with plural label for selectedCount > 1", () => {
    render(<BulkActionBar selectedCount={5} {...noopHandlers} />);
    expect(screen.getByText("5 transactions selected")).toBeInTheDocument();
  });

  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar selectedCount={0} {...noopHandlers} />,
    );
    expect(container.firstChild).toBeNull();
  });

  // --- Accessibility ---

  it("has a region with aria-label 'Bulk actions'", () => {
    render(<BulkActionBar selectedCount={2} {...noopHandlers} />);
    expect(
      screen.getByRole("region", { name: "Bulk actions" }),
    ).toBeInTheDocument();
  });

  it("has a toolbar with aria-label 'Bulk action buttons'", () => {
    render(<BulkActionBar selectedCount={2} {...noopHandlers} />);
    expect(
      screen.getByRole("toolbar", { name: "Bulk action buttons" }),
    ).toBeInTheDocument();
  });

  it("clear-selection button has aria-label 'Clear selection'", () => {
    render(<BulkActionBar selectedCount={1} {...noopHandlers} />);
    expect(
      screen.getByRole("button", { name: "Clear selection" }),
    ).toBeInTheDocument();
  });

  // --- Action callbacks ---

  it("calls onExport when Export is clicked", async () => {
    const onExport = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        {...noopHandlers}
        onExport={onExport}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("calls onTag when Tag is clicked", async () => {
    const onTag = vi.fn();
    render(
      <BulkActionBar selectedCount={1} {...noopHandlers} onTag={onTag} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /^tag$/i }));
    expect(onTag).toHaveBeenCalledTimes(1);
  });

  it("calls onArchive when Archive is clicked", async () => {
    const onArchive = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        {...noopHandlers}
        onArchive={onArchive}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /archive/i }));
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it("calls onClearSelection when dismiss button is clicked", async () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        {...noopHandlers}
        onClearSelection={onClearSelection}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Clear selection" }),
    );
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  // --- Validation rejects before render ---

  it("throws BulkActionBarValidationError for NaN (before rendering)", () => {
    expect(() =>
      render(<BulkActionBar selectedCount={NaN} {...noopHandlers} />),
    ).toThrow(BulkActionBarValidationError);
  });

  it("throws BulkActionBarValidationError for Infinity (before rendering)", () => {
    expect(() =>
      render(<BulkActionBar selectedCount={Infinity} {...noopHandlers} />),
    ).toThrow(BulkActionBarValidationError);
  });

  it("throws BulkActionBarValidationError for negative count (before rendering)", () => {
    expect(() =>
      render(<BulkActionBar selectedCount={-1} {...noopHandlers} />),
    ).toThrow(BulkActionBarValidationError);
  });

  it("throws BulkActionBarValidationError for non-integer (before rendering)", () => {
    expect(() =>
      render(<BulkActionBar selectedCount={2.5} {...noopHandlers} />),
    ).toThrow(BulkActionBarValidationError);
  });

  it("throws BulkActionBarValidationError for oversized count (before rendering)", () => {
    expect(() =>
      render(
        <BulkActionBar
          selectedCount={MAX_SELECTED_COUNT + 1}
          {...noopHandlers}
        />,
      ),
    ).toThrow(BulkActionBarValidationError);
  });

  it("does NOT throw for the maximum allowed count", () => {
    expect(() =>
      render(
        <BulkActionBar selectedCount={MAX_SELECTED_COUNT} {...noopHandlers} />,
      ),
    ).not.toThrow();
  });

  // --- No callbacks fired on invalid input ---

  it("does not call any handler when input is invalid", () => {
    const handlers = {
      onExport: vi.fn(),
      onTag: vi.fn(),
      onArchive: vi.fn(),
      onClearSelection: vi.fn(),
    };

    expect(() =>
      render(<BulkActionBar selectedCount={NaN} {...handlers} />),
    ).toThrow();

    expect(handlers.onExport).not.toHaveBeenCalled();
    expect(handlers.onTag).not.toHaveBeenCalled();
    expect(handlers.onArchive).not.toHaveBeenCalled();
    expect(handlers.onClearSelection).not.toHaveBeenCalled();
  });
});
