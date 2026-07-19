import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TransactionsPagination from "./transactions-pagination";

describe("TransactionsPagination", () => {
  it("shows the correct partial last page when total items are not a multiple of page size", () => {
    const onPageChange = vi.fn();

    render(
      <TransactionsPagination
        totalItems={13}
        currentPage={4}
        itemsPerPage={4}
        onPageChange={onPageChange}
      />,
    );

    expect(
      screen.getByText("Showing 13 to 13 of 13 items"),
    ).toBeInTheDocument();
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
