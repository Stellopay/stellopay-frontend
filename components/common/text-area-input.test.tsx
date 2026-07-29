import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TextareaInput from "./text-area-input";

describe("TextareaInput — character counter and max-length enforcement", () => {
  // ── without maxLength ──────────────────────────────────────────────────────

  it("renders without a counter when maxLength is not set", () => {
    render(<TextareaInput value="hello" onChange={vi.fn()} />);
    expect(screen.queryByText(/\//)).toBeNull();
  });

  it("calls onChange with the new value when typing", () => {
    const onChange = vi.fn();
    render(<TextareaInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  // ── with maxLength ─────────────────────────────────────────────────────────

  it("renders the counter showing 0/max when value is empty", () => {
    render(<TextareaInput value="" onChange={vi.fn()} maxLength={100} />);
    expect(screen.getByText("0/100")).toBeInTheDocument();
  });

  it("counter accurately reflects current character count", () => {
    render(
      <TextareaInput value="hello" onChange={vi.fn()} maxLength={100} />,
    );
    expect(screen.getByText("5/100")).toBeInTheDocument();
  });

  it("updates the counter as the user types (under limit)", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TextareaInput value="" onChange={onChange} maxLength={20} />,
    );
    expect(screen.getByText("0/20")).toBeInTheDocument();

    rerender(<TextareaInput value="hi" onChange={onChange} maxLength={20} />);
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("allows typing up to but not beyond the limit", () => {
    const onChange = vi.fn();
    render(<TextareaInput value="abc" onChange={onChange} maxLength={3} />);

    // Attempting to type one character beyond the limit.
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abcd" },
    });
    // onChange should NOT be called because "abcd".length > 3.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange when typing exactly at the limit", () => {
    const onChange = vi.fn();
    render(<TextareaInput value="ab" onChange={onChange} maxLength={3} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  // ── near-limit styling ─────────────────────────────────────────────────────

  it("shows the counter in amber when within 20 chars of the limit", () => {
    // 85/100 => 15 chars remaining → near limit
    render(
      <TextareaInput
        value={"a".repeat(85)}
        onChange={vi.fn()}
        maxLength={100}
      />,
    );
    const counter = screen.getByText("85/100");
    expect(counter.className).toMatch(/amber/);
  });

  it("shows the counter in muted when well under the limit", () => {
    // 5/100 => far from limit
    render(
      <TextareaInput value="hello" onChange={vi.fn()} maxLength={100} />,
    );
    const counter = screen.getByText("5/100");
    expect(counter.className).not.toMatch(/amber/);
    expect(counter.className).not.toMatch(/destructive/);
  });

  // ── accessibility ──────────────────────────────────────────────────────────

  it("counter has aria-live=polite when near the limit", () => {
    render(
      <TextareaInput
        value={"a".repeat(90)}
        onChange={vi.fn()}
        maxLength={100}
      />,
    );
    const counter = screen.getByText("90/100");
    expect(counter).toHaveAttribute("aria-live", "polite");
  });

  it("counter has aria-live=off when well under the limit", () => {
    render(<TextareaInput value="hi" onChange={vi.fn()} maxLength={100} />);
    const counter = screen.getByText("2/100");
    expect(counter).toHaveAttribute("aria-live", "off");
  });

  it("textarea is linked to the counter via aria-describedby", () => {
    render(<TextareaInput value="hi" onChange={vi.fn()} maxLength={50} />);
    const textarea = screen.getByRole("textbox");
    const counterId = screen.getByText("2/50").id;
    expect(textarea.getAttribute("aria-describedby")).toContain(counterId);
  });

  it("textarea has maxLength attribute set", () => {
    render(<TextareaInput value="" onChange={vi.fn()} maxLength={80} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "80");
  });

  // ── existing behaviour unaffected ─────────────────────────────────────────

  it("renders with label", () => {
    render(
      <TextareaInput value="" onChange={vi.fn()} label="Message" />,
    );
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("renders helper text when no error", () => {
    render(
      <TextareaInput
        value=""
        onChange={vi.fn()}
        helperText="Max 500 characters"
      />,
    );
    expect(screen.getByText("Max 500 characters")).toBeInTheDocument();
  });

  it("renders error text with role=alert when error=true", () => {
    render(
      <TextareaInput
        value=""
        onChange={vi.fn()}
        error
        helperText="Too long"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Too long");
  });

  it("textarea is disabled when disabled=true", () => {
    render(<TextareaInput value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
