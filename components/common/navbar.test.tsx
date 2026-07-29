import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Navbar from "./navbar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Navbar Component (#785 Active Route Sync)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active route correctly based on usePathname", () => {
    mockUsePathname.mockReturnValue("/dashboard");

    render(<Navbar />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    const transactionsLink = screen.getByRole("link", { name: "Transactions" });

    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    expect(dashboardLink.className).toContain("bg-primary/10");

    expect(transactionsLink).not.toHaveAttribute("aria-current");
    expect(transactionsLink.className).not.toContain("bg-primary/10");
  });

  it("updates active route highlight when in-page navigation changes pathname", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    const { rerender } = render(<Navbar />);

    let dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");

    mockUsePathname.mockReturnValue("/transactions");
    rerender(<Navbar />);

    const transactionsLink = screen.getByRole("link", { name: "Transactions" });
    dashboardLink = screen.getByRole("link", { name: "Dashboard" });

    expect(transactionsLink).toHaveAttribute("aria-current", "page");
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("toggles mobile menu and sets accessible ARIA parameters", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navbar />);

    const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    const closeMenuButton = screen.getByRole("button", { name: /close navigation menu/i });
    expect(closeMenuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Mobile Navigation" })).toBeInTheDocument();
  });
});
