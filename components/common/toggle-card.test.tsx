import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ToggleCard from "./toggle-card";

function renderControlledToggle(initialEnabled = false) {
  const onToggle = vi.fn();
  const view = render(
    <ToggleCard
      title="Security notifications"
      description="Receive account protection alerts."
      enabled={initialEnabled}
      onToggle={onToggle}
    />,
  );

  return { onToggle, ...view };
}

describe("ToggleCard", () => {
  it("exposes matching switch and pressed states", () => {
    renderControlledToggle(true);

    const toggle = screen.getByRole("switch", {
      name: "Security notifications is on. Turn off.",
    });

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("requests the next state on click and keyboard activation", () => {
    const { onToggle, rerender } = renderControlledToggle(false);

    const toggle = screen.getByRole("switch", {
      name: "Security notifications is off. Turn on.",
    });
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenLastCalledWith(true);

    rerender(
      <ToggleCard
        title="Security notifications"
        enabled
        onToggle={onToggle}
      />,
    );

    const enabledToggle = screen.getByRole("switch", {
      name: "Security notifications is on. Turn off.",
    });
    fireEvent.keyDown(enabledToggle, { key: " " });
    fireEvent.keyUp(enabledToggle, { key: " " });
    expect(onToggle).toHaveBeenLastCalledWith(false);

    fireEvent.keyDown(enabledToggle, { key: "Enter" });
    fireEvent.keyUp(enabledToggle, { key: "Enter" });
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });
});
