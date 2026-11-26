import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import TransactionNotFound from "./not-found";

describe("transaction not-found page", () => {
  it("provides a link back to the transactions list", () => {
    render(<TransactionNotFound />);

    expect(
      screen.getByRole("heading", { name: "Transaction not found" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to transactions" }),
    ).toHaveAttribute("href", "/transactions");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TransactionNotFound />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
