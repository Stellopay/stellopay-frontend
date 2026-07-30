import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React, { useState } from "react";
import { useSearchHighlight } from "./useSearchHighlight";

// ---------------------------------------------------------------------------
// Test component that wraps the hook so we can test it under React
// ---------------------------------------------------------------------------

function TestHarness({
  label,
  multiple,
}: {
  label: string | null;
  multiple?: boolean;
}) {
  useSearchHighlight(label);

  return (
    <div>
      <div data-testid="before" />
      <div data-search-label="First name" data-testid="control-first">
        First Name
      </div>
      <div data-search-label="Email address" data-testid="control-email">
        Email
      </div>
      {multiple && (
        <div data-search-label="Password and recovery" data-testid="control-password">
          Password
        </div>
      )}
      <div data-testid="after" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSearchHighlight", () => {
  beforeEach(() => {
    // jsdom does not support scrollIntoView, so we must stub it
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document
      .querySelectorAll(".animate-search-highlight")
      .forEach((el) => el.classList.remove("animate-search-highlight"));
  });

  it("does not add highlight class when label is null", () => {
    render(<TestHarness label={null} />);

    const control = screen.getByTestId("control-first");
    expect(control.classList.contains("animate-search-highlight")).toBe(false);
  });

  it("adds highlight class to the matching element", () => {
    render(<TestHarness label="First name" />);

    const control = screen.getByTestId("control-first");
    expect(control.classList.contains("animate-search-highlight")).toBe(true);
  });

  it("does not add highlight to non-matching elements", () => {
    render(<TestHarness label="First name" />);

    const emailControl = screen.getByTestId("control-email");
    expect(
      emailControl.classList.contains("animate-search-highlight"),
    ).toBe(false);
  });

  it("calls scrollIntoView on the matching element", () => {
    const scrollIntoView = Element.prototype.scrollIntoView as ReturnType<
      typeof vi.fn
    >;
    render(<TestHarness label="Email address" />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("removes highlight class after timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<TestHarness label="First name" />);

    const control = screen.getByTestId("control-first");
    expect(control.classList.contains("animate-search-highlight")).toBe(true);

    // Advance past the 3s highlight duration
    vi.advanceTimersByTime(3500);

    expect(
      control.classList.contains("animate-search-highlight"),
    ).toBe(false);

    vi.useRealTimers();
  });

  it("does not re-highlight if the same label is passed again", () => {
    const { rerender } = render(<TestHarness label="First name" />);

    const control = screen.getByTestId("control-first");
    expect(control.classList.contains("animate-search-highlight")).toBe(true);

    // Rerender with the same label — should keep the existing highlight
    rerender(<TestHarness label="First name" />);
    expect(control.classList.contains("animate-search-highlight")).toBe(true);
  });

  it("highlights a new element when label changes", () => {
    const { rerender } = render(<TestHarness label="First name" />);

    const firstControl = screen.getByTestId("control-first");
    expect(firstControl.classList.contains("animate-search-highlight")).toBe(
      true,
    );

    rerender(<TestHarness label="Email address" />);

    // Previous highlight should be removed
    expect(
      firstControl.classList.contains("animate-search-highlight"),
    ).toBe(false);

    // New highlight should be added
    const emailControl = screen.getByTestId("control-email");
    expect(
      emailControl.classList.contains("animate-search-highlight"),
    ).toBe(true);
  });

  it("performs a case-sensitive match on data-search-label", () => {
    render(<TestHarness label="first name" />);

    const control = screen.getByTestId("control-first");
    // The attribute value is "First name", not "first name"
    expect(control.classList.contains("animate-search-highlight")).toBe(false);
  });

  it("does nothing when no element matches the label", () => {
    render(<TestHarness label="Nonexistent control" />);

    const firstControl = screen.getByTestId("control-first");
    expect(
      firstControl.classList.contains("animate-search-highlight"),
    ).toBe(false);
  });
});
