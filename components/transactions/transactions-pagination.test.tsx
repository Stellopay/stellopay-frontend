import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TransactionsPagination, {
  clampPage,
  parsePageInput,
} from "./transactions-pagination";

// ---------------------------------------------------------------------------
// Helper: default props for a 5-page scenario
// ---------------------------------------------------------------------------
const defaultProps = {
  totalItems: 50,
  currentPage: 1,
  itemsPerPage: 10,
  onPageChange: vi.fn(),
};

function renderPagination(
  overrides: Partial<typeof defaultProps> = {},
) {
  const props = { ...defaultProps, onPageChange: vi.fn(), ...overrides };
  return { ...render(<TransactionsPagination {...props} />), onPageChange: props.onPageChange };
}

// ---------------------------------------------------------------------------
// Unit tests for pure helpers
// ---------------------------------------------------------------------------
describe("clampPage", () => {
  it("returns the page unchanged when it is within range", () => {
    expect(clampPage(3, 5)).toBe(3);
  });

  it("clamps to 1 when the value is below 1", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-10, 5)).toBe(1);
  });

  it("clamps to totalPages when the value exceeds totalPages", () => {
    expect(clampPage(99, 5)).toBe(5);
    expect(clampPage(6, 5)).toBe(5);
  });

  it("returns 1 when totalPages is 0 (no items)", () => {
    expect(clampPage(0, 0)).toBe(1);
    expect(clampPage(3, 0)).toBe(1);
  });

  it("handles boundary values exactly", () => {
    expect(clampPage(1, 5)).toBe(1);
    expect(clampPage(5, 5)).toBe(5);
  });
});

describe("parsePageInput", () => {
  it("parses a valid integer string", () => {
    expect(parsePageInput("3")).toBe(3);
    expect(parsePageInput("  3  ")).toBe(3); // tolerates surrounding whitespace
  });

  it("returns null for an empty string", () => {
    expect(parsePageInput("")).toBeNull();
    expect(parsePageInput("   ")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parsePageInput("abc")).toBeNull();
    expect(parsePageInput("3a")).toBeNull();
    expect(parsePageInput("!@#")).toBeNull();
  });

  it("returns null for floating-point strings (non-integer)", () => {
    expect(parsePageInput("2.5")).toBeNull();
    expect(parsePageInput("1.1")).toBeNull();
  });

  it("returns null for special numeric strings", () => {
    expect(parsePageInput("Infinity")).toBeNull();
    expect(parsePageInput("NaN")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration tests: existing pagination behaviour
// ---------------------------------------------------------------------------
describe("TransactionsPagination – existing behaviour", () => {
  it("shows correct summary when total items are not a multiple of page size", () => {
    const onPageChange = vi.fn();
    render(
      <TransactionsPagination
        totalItems={13}
        currentPage={4}
        itemsPerPage={4}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("Showing 13 to 13 of 13 items")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("button", { name: "Page 5" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to next page/i }),
    ).toBeDisabled();
  });

  it("does not render a phantom page when total items exactly fill the last page", () => {
    render(
      <TransactionsPagination
        totalItems={12}
        currentPage={3}
        itemsPerPage={4}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Showing 9 to 12 of 12 items")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("button", { name: "Page 4" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to next page/i }),
    ).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Integration tests: jump-to-page UI rendering
// ---------------------------------------------------------------------------
describe("TransactionsPagination – jump-to-page rendering", () => {
  it("renders the jump-to-page label, input and Go button", () => {
    renderPagination();

    expect(screen.getByRole("spinbutton", { name: /jump to page number/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to entered page/i })).toBeInTheDocument();
    expect(screen.getByText(/go to page/i)).toBeInTheDocument();
  });

  it("renders the input with the correct type and placeholder", () => {
    renderPagination({ currentPage: 2 });
    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("placeholder", "2");
  });
});

// ---------------------------------------------------------------------------
// Integration tests: jump-to-page navigation
// ---------------------------------------------------------------------------
describe("TransactionsPagination – jump-to-page navigation", () => {
  it("navigates directly to a valid page number via Go button", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 1 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.type(input, "3");
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("navigates directly to a valid page number via Enter key", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 1 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.type(input, "4{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("clamps a page number lower than 1 to page 1", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 3 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.type(input, "-5{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("clamps a page number higher than totalPages to totalPages", async () => {
    const user = userEvent.setup();
    // 50 items / 10 per page = 5 total pages
    const { onPageChange } = renderPagination({ currentPage: 1 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.type(input, "999{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("clamps 0 to page 1", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 2 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.type(input, "0{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// Integration tests: invalid / non-numeric input handling
// ---------------------------------------------------------------------------
describe("TransactionsPagination – invalid input handling", () => {
  it("does not call onPageChange for a non-numeric value", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 2 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    // userEvent.type on a type="number" input ignores non-numeric keystrokes,
    // so we fall back to fireEvent / clear+type to inject the value directly.
    await user.click(input);
    // Simulate what happens when the input has been given a non-integer value
    // by clearing and typing a decimal (browser may accept it as text)
    await user.clear(input);
    // Type letters — the native number input will ignore them, leaving an empty
    // string, which our handler treats as invalid.
    await user.type(input, "abc");
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange for an empty input and resets to current page", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ currentPage: 2 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    // Leave the input empty and press Go
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));

    expect(onPageChange).not.toHaveBeenCalled();
    // Input should be reset to current page
    expect(input).toHaveValue(2);
  });

  it("marks the input as aria-invalid when an invalid value is submitted", async () => {
    const user = userEvent.setup();
    renderPagination({ currentPage: 2 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });
    await user.click(input);
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the error state when the user starts typing again after an invalid submission", async () => {
    const user = userEvent.setup();
    renderPagination({ currentPage: 2 });

    const input = screen.getByRole("spinbutton", { name: /jump to page number/i });

    // Trigger error
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));
    expect(input).toHaveAttribute("aria-invalid", "true");

    // Start typing — error should clear
    await user.click(input);
    await user.type(input, "3");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("renders a screen-reader alert when the input is invalid", async () => {
    const user = userEvent.setup();
    renderPagination({ currentPage: 2 });

    // Submit empty
    await user.click(screen.getByRole("button", { name: /go to entered page/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /please enter a valid page number/i,
    );
  });
});
