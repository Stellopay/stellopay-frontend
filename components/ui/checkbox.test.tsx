import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

function renderCheckbox(props: React.ComponentProps<typeof Checkbox> = {}) {
  return render(<Checkbox {...props} />);
}

describe("Checkbox — default rendering", () => {
  it("renders a checkbox role element", () => {
    renderCheckbox({ "aria-label": "Accept terms" });
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("applies the data-slot='checkbox' attribute", () => {
    renderCheckbox({ "aria-label": "Accept terms" });
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-slot", "checkbox");
  });

  it("renders a check indicator when checked", () => {
    renderCheckbox({ "aria-label": "Accept terms", checked: true });
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  it("renders unchecked by default", () => {
    renderCheckbox({ "aria-label": "Accept terms" });
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });
});

describe("Checkbox — disabled state", () => {
  it("renders as disabled when the disabled prop is passed", () => {
    renderCheckbox({ disabled: true, "aria-label": "Accept terms" });
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("applies disabled:cursor-disabled class when disabled", () => {
    renderCheckbox({ disabled: true, "aria-label": "Accept terms" });
    expect(screen.getByRole("checkbox").className).toMatch(/disabled:cursor-disabled/);
  });

  it("applies disabled:opacity-disabled class when disabled", () => {
    renderCheckbox({ disabled: true, "aria-label": "Accept terms" });
    expect(screen.getByRole("checkbox").className).toMatch(/disabled:opacity-disabled/);
  });

  it("does not toggle when disabled and clicked", async () => {
    const onCheckedChange = vi.fn();
    renderCheckbox({
      disabled: true,
      "aria-label": "Accept terms",
      onCheckedChange,
    });
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("Checkbox — className merging", () => {
  it("applies a custom className alongside default classes", () => {
    renderCheckbox({ "aria-label": "Test", className: "my-custom-class" });
    expect(screen.getByRole("checkbox")).toHaveClass("my-custom-class");
  });
});
