import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { StatePanel, StatePanelAction } from "./state-panel";

const panelProps = {
  icon: <span>Icon</span>,
  title: "No results",
  description: "There is nothing to show.",
};

describe("StatePanel", () => {
  it("defaults to a neutral status live region and hides its icon from assistive technology", () => {
    render(<StatePanel {...panelProps} />);

    const panel = screen.getByRole("status");
    expect(panel).toHaveAttribute("aria-live", "polite");
    expect(panel).toHaveAttribute("data-tone", "neutral");
    expect(
      screen.getByRole("heading", { name: "No results", level: 3 }),
    ).toBeVisible();
    expect(screen.getByText("Icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("supports the danger tone and alert announcement", () => {
    render(
      <StatePanel
        {...panelProps}
        tone="danger"
        role="alert"
        live="assertive"
      />,
    );

    const panel = screen.getByRole("alert");
    expect(panel).toHaveAttribute("aria-live", "assertive");
    expect(panel).toHaveAttribute("data-tone", "danger");
  });

  it("renders button and link actions with their native semantics", () => {
    render(
      <StatePanel {...panelProps}>
        <StatePanelAction>Try again</StatePanelAction>
        <a href="/help">Get help</a>
      </StatePanel>,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(screen.getByRole("link", { name: "Get help" })).toHaveAttribute(
      "href",
      "/help",
    );
  });

  it("renders no action when children are omitted", () => {
    render(<StatePanel {...panelProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("passes axe accessibility audit on the default render", async () => {
    const { container } = render(<StatePanel {...panelProps} />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
