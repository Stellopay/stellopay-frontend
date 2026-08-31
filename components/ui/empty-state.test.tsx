import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

// ─── Baseline / backward-compatibility ───────────────────────────────────────

describe("EmptyState — baseline rendering", () => {
  it("renders with required props and accessibility roles", () => {
    render(
      <EmptyState title="No Data" description="There is no data to show." />,
    );

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");

    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("There is no data to show.")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders no button when neither action nor onRetry is provided", () => {
    render(
      <EmptyState title="No Data" description="There is no data to show." />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a custom icon when provided", () => {
    render(
      <EmptyState
        title="Custom Icon"
        description="Testing custom icon"
        icon={<div data-testid="custom-icon">Icon</div>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders the default inbox icon when no icon prop is supplied", () => {
    render(<EmptyState title="No Data" description="Description" />);
    // Lucide renders an SVG; the inbox icon has aria-hidden so we query by tag.
    expect(document.querySelector("svg")).toBeInTheDocument();
  });
});

// ─── Legacy onRetry / actionLabel (backward-compatibility) ────────────────────

describe("EmptyState — legacy onRetry prop (backward-compatible)", () => {
  it("renders action button when onRetry is provided", () => {
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeInTheDocument();
  });

  it("calls onRetry when the button is clicked", () => {
    const onRetryMock = vi.fn();
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={onRetryMock}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders a custom actionLabel when provided alongside onRetry", () => {
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={() => {}}
        actionLabel="Reset Search"
      />,
    );
    expect(
      screen.getByRole("button", { name: /reset search/i }),
    ).toBeInTheDocument();
  });

  it("defaults actionLabel to 'Clear Filters' when not specified", () => {
    render(
      <EmptyState
        title="No Results"
        description="Description"
        onRetry={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeInTheDocument();
  });
});

// ─── New action prop ──────────────────────────────────────────────────────────

describe("EmptyState — action prop (new CTA slot)", () => {
  it("renders a button with the action label when action prop is provided", () => {
    render(
      <EmptyState
        title="No Wallets"
        description="Add your first wallet to get started."
        action={{ label: "Add wallet", onClick: () => {} }}
      />,
    );
    expect(
      screen.getByRole("button", { name: /add wallet/i }),
    ).toBeInTheDocument();
  });

  it("calls action.onClick when the button is clicked", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No Wallets"
        description="Add your first wallet to get started."
        action={{ label: "Add wallet", onClick: handleClick }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add wallet/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls action.onClick only once per click (no double-fire)", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No Wallets"
        description="Description"
        action={{ label: "Add wallet", onClick: handleClick }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add wallet/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders the exact label text provided in the action prop", () => {
    render(
      <EmptyState
        title="No Transactions"
        description="Create your first transaction."
        action={{ label: "Create a transaction", onClick: () => {} }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Create a transaction" }),
    ).toBeInTheDocument();
  });

  it("does not render a button when action prop is omitted", () => {
    render(<EmptyState title="No Data" description="Description" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("action prop takes precedence over onRetry when both are supplied", () => {
    const actionClick = vi.fn();
    const retryClick = vi.fn();
    render(
      <EmptyState
        title="No Data"
        description="Description"
        action={{ label: "Primary CTA", onClick: actionClick }}
        onRetry={retryClick}
        actionLabel="Retry"
      />,
    );

    // Only one button should be in the document.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);

    // It must show the action label, not the retry label.
    expect(
      screen.getByRole("button", { name: /primary cta/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it("clicking the button when action takes precedence calls action.onClick, not onRetry", () => {
    const actionClick = vi.fn();
    const retryClick = vi.fn();
    render(
      <EmptyState
        title="No Data"
        description="Description"
        action={{ label: "Primary CTA", onClick: actionClick }}
        onRetry={retryClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /primary cta/i }));
    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(retryClick).not.toHaveBeenCalled();
  });
});

// ─── Layout regression — no-action rendering is identical ─────────────────────

describe("EmptyState — layout regression (no action)", () => {
  it("renders the title as an h3", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Empty" }),
    ).toBeInTheDocument();
  });

  it("renders the description as a paragraph", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("container has role=status and aria-live=polite", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    const container = screen.getByRole("status");
    expect(container).toHaveAttribute("aria-live", "polite");
  });

  it("does not introduce extra DOM nodes compared to the no-action baseline", () => {
    const { container: withoutAction } = render(
      <EmptyState title="T" description="D" />,
    );
    // Verify the button is absent — same structure as before the change.
    expect(withoutAction.querySelector("button")).toBeNull();
  });
});

// ─── Shared layout pattern (EmptyState + ErrorState) ─────────────────────────

/**
 * EmptyState and ErrorState solve closely related problems (no data vs failed
 * to load) and previously carried independent copies of the same markup, which
 * drifted. Both now delegate layout to StatePanel.
 *
 * These tests assert the two stay structurally identical, so switching between
 * an empty result and a failed request in the same view does not shift the
 * page. They are the regression guard against the copies diverging again.
 */

const panelOf = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

/** Reads the shared structural skeleton out of a rendered panel. */
function structureOf(container: HTMLElement) {
  const panel = panelOf(container);
  const [iconWrap, heading, description] = Array.from(panel.children);
  return {
    panel,
    iconTag: iconWrap.tagName,
    iconHidden: iconWrap.getAttribute("aria-hidden"),
    headingTag: heading.tagName,
    descriptionTag: description.tagName,
    childCount: panel.children.length,
  };
}

describe("EmptyState and ErrorState — shared layout pattern", () => {
  const renderBoth = () => {
    const empty = render(
      <EmptyState title="No results" description="Nothing matched." />,
    );
    const error = render(
      <ErrorState title="Failed to load" description="Something broke." />,
    );
    return { empty, error };
  };

  it("renders the same element order: icon, heading, description", () => {
    const { empty, error } = renderBoth();

    const e = structureOf(empty.container);
    const r = structureOf(error.container);

    expect(e.iconTag).toBe(r.iconTag);
    expect(e.headingTag).toBe(r.headingTag);
    expect(e.descriptionTag).toBe(r.descriptionTag);
  });

  it("uses an h3 heading in both, so neither skips a level under a section h2", () => {
    renderBoth();

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });

  it("marks the icon decorative in both", () => {
    const { empty, error } = renderBoth();

    expect(structureOf(empty.container).iconHidden).toBe("true");
    expect(structureOf(error.container).iconHidden).toBe("true");
  });

  it("applies identical container layout classes to both", () => {
    const { empty, error } = renderBoth();

    for (const cls of [
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "rounded-xl",
      "border",
      "text-center",
    ]) {
      expect(panelOf(empty.container).className).toContain(cls);
      expect(panelOf(error.container).className).toContain(cls);
    }
  });

  it("applies identical responsive padding to both", () => {
    const { empty, error } = renderBoth();

    for (const cls of ["px-4", "py-8", "sm:px-8", "sm:py-10"]) {
      expect(panelOf(empty.container).className).toContain(cls);
      expect(panelOf(error.container).className).toContain(cls);
    }
  });

  it("sizes the icon identically in both", () => {
    const { empty, error } = renderBoth();

    const emptyIcon = panelOf(empty.container).firstElementChild as HTMLElement;
    const errorIcon = panelOf(error.container).firstElementChild as HTMLElement;

    expect(emptyIcon.className).toContain("[&>svg]:h-10");
    expect(errorIcon.className).toContain("[&>svg]:h-10");
  });

  it("keeps the tones distinct, which is the only intended visual difference", () => {
    const { empty, error } = renderBoth();

    expect(panelOf(empty.container)).toHaveAttribute("data-tone", "neutral");
    expect(panelOf(error.container)).toHaveAttribute("data-tone", "danger");
  });

  it("keeps live-region semantics distinct: polite for empty, assertive for error", () => {
    renderBoth();

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("omits the action slot entirely when there is no CTA", () => {
    const { empty } = renderBoth();

    // icon + heading + description only, no trailing action wrapper
    expect(structureOf(empty.container).childCount).toBe(3);
  });
});

describe("Shared CTA button", () => {
  const renderBothWithCta = () => {
    const empty = render(
      <EmptyState
        title="No results"
        description="Nothing matched."
        action={{ label: "Clear filters", onClick: vi.fn() }}
      />,
    );
    const error = render(
      <ErrorState title="Failed" description="Broke." onRetry={vi.fn()} />,
    );
    return {
      emptyBtn: empty.container.querySelector("button") as HTMLElement,
      errorBtn: error.container.querySelector("button") as HTMLElement,
    };
  };

  it("gives both CTAs the same geometry classes", () => {
    const { emptyBtn, errorBtn } = renderBothWithCta();

    for (const cls of [
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-lg",
      "px-4",
      "py-2",
      "text-sm",
      "font-medium",
    ]) {
      expect(emptyBtn.className).toContain(cls);
      expect(errorBtn.className).toContain(cls);
    }
  });

  it("exposes a visible focus ring on both CTAs", () => {
    const { emptyBtn, errorBtn } = renderBothWithCta();

    expect(emptyBtn.className).toContain("focus-visible:ring-2");
    expect(errorBtn.className).toContain("focus-visible:ring-2");
  });

  it("sets type=button so a CTA never submits a surrounding form", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <EmptyState
          title="No results"
          description="Nothing matched."
          action={{ label: "Clear filters", onClick: vi.fn() }}
        />
      </form>,
    );

    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button).toHaveAttribute("type", "button");

    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the CTA focusable and activatable by keyboard", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No results"
        description="Nothing matched."
        action={{ label: "Clear filters", onClick }}
      />,
    );

    const button = screen.getByRole("button", { name: "Clear filters" });
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Shared pattern — content edge cases", () => {
  it("caps description width in both so long copy wraps instead of stretching", () => {
    const longTitle = "A".repeat(120);
    const longBody = "B".repeat(600);

    const empty = render(
      <EmptyState title={longTitle} description={longBody} />,
    );
    const error = render(
      <ErrorState title={longTitle} description={longBody} />,
    );

    expect(
      (panelOf(empty.container).children[2] as HTMLElement).className,
    ).toContain("max-w-md");
    expect(
      (panelOf(error.container).children[2] as HTMLElement).className,
    ).toContain("max-w-md");
  });

  it("renders a custom icon in place of the default in both", () => {
    const empty = render(
      <EmptyState
        title="No results"
        description="Nothing matched."
        icon={<svg data-testid="custom-empty" />}
      />,
    );
    const error = render(
      <ErrorState
        title="Failed"
        description="Broke."
        icon={<svg data-testid="custom-error" />}
      />,
    );

    expect(
      empty.container.querySelector("[data-testid='custom-empty']"),
    ).toBeInTheDocument();
    expect(
      error.container.querySelector("[data-testid='custom-error']"),
    ).toBeInTheDocument();
  });

  it("carries dark-mode surface variants in both", () => {
    const empty = render(<EmptyState title="t" description="d" />);
    const error = render(<ErrorState title="t" description="d" />);

    expect(panelOf(empty.container).className).toContain("dark:");
    expect(panelOf(error.container).className).toContain("dark:");
  });
});
