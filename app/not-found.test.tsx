import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders a branded 404 heading and explanatory copy", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stellopay")).toBeInTheDocument();
    expect(
      screen.getByText(/The route you tried to open does not exist/i),
    ).toBeInTheDocument();
  });

  it("links keyboard users back to the landing page and dashboard", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Open dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("has proper semantic structure and main landmark for accessibility", () => {
    render(<NotFound />);

    // main landmark exists and is correctly labeled
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "main-content");

    // section content is rendered inside the page
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();

    // ensures CTA section exists via links grouping
    const homeLink = screen.getByRole("link", { name: "Go home" });
    const dashboardLink = screen.getByRole("link", { name: "Open dashboard" });

    expect(homeLink).toBeVisible();
    expect(dashboardLink).toBeVisible();
  });

  it("renders a search input for help center search", () => {
    render(<NotFound />);

    const searchInput = screen.getByPlaceholderText("Search help center…");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "search");
    expect(searchInput).toHaveAttribute("aria-label", "Search help topics");
  });

  it("renders popular-destination links", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: /Transactions/ })).toHaveAttribute(
      "href",
      "/transactions",
    );
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: /Help & Support/ })).toHaveAttribute(
      "href",
      "/help/support",
    );
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("renders a popular destinations navigation landmark", () => {
    render(<NotFound />);

    const nav = screen.getByRole("navigation", { name: "Popular destinations" });
    expect(nav).toBeInTheDocument();
  });

  it("renders a search landmark", () => {
    render(<NotFound />);

    const search = screen.getByRole("search", { name: "Search help center" });
    expect(search).toBeInTheDocument();
  });
});
