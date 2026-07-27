import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "./error-state";

// ─── Baseline / backward-compatibility ───────────────────────────────────────

describe("ErrorState — baseline rendering", () => {
  it("renders with required props and accessibility roles", () => {
    render(<ErrorState title="Error Title" description="Error Description" />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");

    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error Description")).toBeInTheDocument();
  });

  it("renders the default alert-circle icon when no icon prop is supplied", () => {
    render(<ErrorState title="Error" description="Desc" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a custom icon when provided", () => {
    render(
      <ErrorState
        title="Custom Icon"
        description="Testing custom icon"
        icon={<div data-testid="custom-icon">Icon</div>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders no button when onRetry is omitted", () => {
    render(<ErrorState title="Error" description="Desc" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders title as h3", () => {
    render(<ErrorState title="Error Title" description="Desc" />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Error Title" }),
    ).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<ErrorState title="Error" description="Something went wrong." />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });
});

// ─── onRetry prop ─────────────────────────────────────────────────────────────

describe("ErrorState — onRetry prop", () => {
  it("renders a retry button when onRetry is provided", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("calls onRetry when the button is clicked", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState title="Error" description="Desc" onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry exactly once per click (no double-fire)", async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState title="Error" description="Desc" onRetry={onRetry} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders no button when onRetry is explicitly undefined", () => {
    render(
      <ErrorState title="Error" description="Desc" onRetry={undefined} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("button label is 'Try Again' in the idle state", () => {
    render(
      <ErrorState title="Error" description="Desc" onRetry={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();
  });

  it("button is enabled (not disabled) in the idle state", () => {
    render(
      <ErrorState title="Error" description="Desc" onRetry={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /try again/i })).not.toBeDisabled();
  });
});

// ─── retrying prop ────────────────────────────────────────────────────────────

describe("ErrorState — retrying prop", () => {
  it("shows a loading spinner when retrying=true", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );
    // The Loader2 spinner is an SVG with animate-spin class.
    const spinner = document.querySelector("svg.animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("disables the button when retrying=true", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );
    expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
  });

  it("sets aria-disabled on the button when retrying=true", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );
    expect(
      screen.getByRole("button", { name: /retrying/i }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("changes the button label to 'Retrying…' when retrying=true", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );
    expect(
      screen.getByRole("button", { name: /retrying/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^try again$/i }),
    ).not.toBeInTheDocument();
  });

  it("does not call onRetry when the button is clicked while retrying=true", async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={onRetry}
        retrying
      />,
    );
    // userEvent respects the disabled attribute and will not fire the handler.
    await userEvent.click(screen.getByRole("button", { name: /retrying/i }));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("does not show a spinner when retrying=false (idle state)", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying={false}
      />,
    );
    expect(document.querySelector("svg.animate-spin")).not.toBeInTheDocument();
  });

  it("defaults retrying to false when the prop is omitted", () => {
    render(
      <ErrorState title="Error" description="Desc" onRetry={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /try again/i })).not.toBeDisabled();
    expect(document.querySelector("svg.animate-spin")).not.toBeInTheDocument();
  });

  it("retrying=true has no effect when onRetry is not provided (no button rendered)", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        retrying
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("spinner is aria-hidden so screen readers do not announce it", () => {
    render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );
    const spinner = document.querySelector("svg.animate-spin");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });
});

// ─── Transition idle → retrying → idle ───────────────────────────────────────

describe("ErrorState — retrying state transitions", () => {
  it("button re-enables and shows 'Try Again' when retrying switches back to false", () => {
    const { rerender } = render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );

    expect(
      screen.getByRole("button", { name: /retrying/i }),
    ).toBeDisabled();

    rerender(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).not.toBeDisabled();
  });

  it("button becomes disabled and shows spinner when retrying switches from false to true", () => {
    const { rerender } = render(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).not.toBeDisabled();

    rerender(
      <ErrorState
        title="Error"
        description="Desc"
        onRetry={() => {}}
        retrying
      />,
    );

    expect(
      screen.getByRole("button", { name: /retrying/i }),
    ).toBeDisabled();
    expect(document.querySelector("svg.animate-spin")).toBeInTheDocument();
  });
});

// ─── Layout regression ────────────────────────────────────────────────────────

describe("ErrorState — layout regression (no onRetry)", () => {
  it("container has role=alert and aria-live=assertive", () => {
    render(<ErrorState title="Error" description="Desc" />);
    const container = screen.getByRole("alert");
    expect(container).toHaveAttribute("aria-live", "assertive");
  });

  it("does not render any extra DOM nodes when onRetry is omitted", () => {
    const { container } = render(
      <ErrorState title="Error" description="Desc" />,
    );
    expect(container.querySelector("button")).toBeNull();
  });
});
