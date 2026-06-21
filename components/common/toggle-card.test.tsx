import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

import ToggleCard from "./toggle-card";

function ControlledToggleCard({
  disabled = false,
  onToggle = vi.fn(),
}: {
  disabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(false);

  return (
    <ToggleCard
      title="Security alerts"
      description="Receive critical security updates."
      badge="Required"
      enabled={enabled}
      disabled={disabled}
      onToggle={(nextEnabled) => {
        setEnabled(nextEnabled);
        onToggle(nextEnabled);
      }}
    />
  );
}

describe("ToggleCard", () => {
  it("exposes the current toggle state in ARIA attributes and label", () => {
    render(<ControlledToggleCard />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-label", "Security alerts is off");
    expect(toggle).toHaveClass("focus-visible:ring-2");
  });

  it("flips aria-checked and aria-pressed when clicked", () => {
    render(<ControlledToggleCard />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });
    fireEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: "Security alerts is on" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("activates with Enter and Space", () => {
    const onToggle = vi.fn();
    render(<ControlledToggleCard onToggle={onToggle} />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(onToggle).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(toggle, { key: " " });
    expect(onToggle).toHaveBeenLastCalledWith(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores unrelated keys", () => {
    const onToggle = vi.fn();
    render(<ControlledToggleCard onToggle={onToggle} />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });

    fireEvent.keyDown(toggle, { key: "Escape" });

    expect(onToggle).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("does not toggle while disabled", () => {
    const onToggle = vi.fn();
    render(<ControlledToggleCard disabled onToggle={onToggle} />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });

    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: "Enter" });

    expect(toggle).toBeDisabled();
    expect(onToggle).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps rapid clicks aligned with the controlled value", () => {
    render(<ControlledToggleCard />);

    const toggle = screen.getByRole("button", {
      name: "Security alerts is off",
    });

    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-label", "Security alerts is off");
  });

  it("renders optional badge and description only when provided", () => {
    render(
      <ToggleCard title="Payment notices" enabled={true} onToggle={vi.fn()} />,
    );

    const toggle = screen.getByRole("button", {
      name: "Payment notices is on",
    });

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle.firstElementChild).toHaveClass("translate-x-6");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Receive critical security updates."),
    ).not.toBeInTheDocument();
  });
});
