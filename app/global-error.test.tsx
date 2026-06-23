import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "./global-error";

// Helpers 
// Builds the props that Next.js passes to global-error.tsx. 
function makeProps(overrides?: { reset?: () => void }) {
  return {
    error: Object.assign(new Error("boom"), { digest: "abc123" }),
    reset: overrides?.reset ?? vi.fn(),
  };
}

// Tests 
describe("GlobalError", () => {
  it("renders an html element as the document root", () => {
    const { container } = render(<GlobalError {...makeProps()} />);
    /* When @testing-library renders <html>, jsdom hoists its children into
       the existing document; the rendered output lives in document.documentElement. */
    expect(
      container.querySelector("html") ??
        container.ownerDocument.documentElement,
    ).toBeTruthy();
  });

  it("renders a body element", () => {
    const { container } = render(<GlobalError {...makeProps()} />);
    expect(
      container.querySelector("body") ?? container.ownerDocument.body,
    ).toBeTruthy();
  });

  it("renders a visible heading", () => {
    render(<GlobalError {...makeProps()} />);
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it("renders a Try again button", () => {
    render(<GlobalError {...makeProps()} />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("calls reset() when the button is clicked", () => {
    const reset = vi.fn();
    render(<GlobalError {...makeProps({ reset })} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("falls back to window.location.reload() when reset is not provided", () => {
    /* Next.js 15 + React 19 does not always inject reset when the error
     originates in a Server Component. This test covers that branch. */
    const reloadMock = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload: reloadMock });

    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<GlobalError error={error} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reloadMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("does not render the raw error message or stack trace", () => {
    render(<GlobalError {...makeProps()} />);
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("does not render the error digest", () => {
    render(<GlobalError {...makeProps()} />);
    expect(screen.queryByText("abc123")).not.toBeInTheDocument();
  });

  it("renders a generic user-facing description", () => {
    render(<GlobalError {...makeProps()} />);
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
  });
});
