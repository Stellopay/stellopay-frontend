import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockPathname = vi.hoisted(() => ({ value: "/dashboard" }));
const mockUseReducedMotion = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockSidebar = vi.hoisted(() => ({
  isSidebarOpen: true,
  isMobile: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => mockSidebar,
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

vi.mock("framer-motion", () => {
  const MockMotionDiv = ({ layoutId, ...rest }: Record<string, unknown>) => (
    <div {...rest} />
  );
  return {
    motion: { div: MockMotionDiv },
  };
});

vi.mock("@/public/svg/svg", () => ({
  AccountSummaryIcon: () => <svg aria-hidden="true" />,
  DashBoardIcon: () => <svg aria-hidden="true" />,
  TransactionIcon: () => <svg aria-hidden="true" />,
  HelpCircleIcon: () => <svg aria-hidden="true" />,
  SettinIcon: () => <svg aria-hidden="true" />,
}));

import { NavLink } from "./nav-link";

afterEach(() => {
  mockPathname.value = "/dashboard";
  mockSidebar.isSidebarOpen = true;
  mockSidebar.isMobile = false;
  mockUseReducedMotion.mockReturnValue(false);
});

describe("NavLink aria-current", () => {
  it("marks exactly one active sidebar link as the current page", () => {
    mockPathname.value = "/transactions";
    render(<NavLink />);

    const currentLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(/Transactions/);
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks Account Summary link active when on /account-summary", () => {
    mockPathname.value = "/account-summary";
    render(<NavLink />);

    const currentLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(/Account Summary/);
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders without motion animations when reduced motion is preferred", () => {
    mockPathname.value = "/dashboard";
    mockUseReducedMotion.mockReturnValue(true);
    render(<NavLink />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");

    mockUseReducedMotion.mockReturnValue(false);
  });

  it("updates aria-current when the client-side pathname changes", () => {
    mockPathname.value = "/dashboard";
    const { rerender } = render(<NavLink />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    mockPathname.value = "/settings/preferences/security";
    rerender(<NavLink />);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("collapsed NavLink tooltip", () => {
  it("has no axe violations in the collapsed navigation state", async () => {
    mockSidebar.isSidebarOpen = false;
    const { container } = render(<NavLink />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("keeps icon-only links named and shows their label on keyboard focus", async () => {
    mockSidebar.isSidebarOpen = false;
    render(<NavLink />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("aria-label", "Dashboard");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    fireEvent.focus(dashboardLink);

    const tooltip = await screen.findByRole("tooltip", { name: "Dashboard" });
    expect(tooltip).toHaveTextContent("Dashboard");
    expect(dashboardLink).toHaveAttribute(
      "aria-describedby",
      tooltip.getAttribute("id"),
    );
    expect(dashboardLink).toHaveAttribute(
      "aria-controls",
      tooltip.getAttribute("id"),
    );
    expect(dashboardLink).not.toHaveAttribute("aria-haspopup");
    expect(tooltip).toHaveClass(
      "bg-popover",
      "text-popover-foreground",
      "border-border",
    );

    fireEvent.keyDown(tooltip, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("tooltip", { name: "Dashboard" }),
      ).not.toBeInTheDocument();
    });
    expect(dashboardLink).not.toHaveAttribute("aria-describedby");
  });

  it("shows the same label on pointer hover without changing navigation semantics", async () => {
    mockSidebar.isSidebarOpen = false;
    render(<NavLink />);

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    fireEvent.mouseEnter(settingsLink);

    expect(
      await screen.findByRole("tooltip", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(settingsLink.tagName).toBe("A");
    expect(settingsLink).toHaveAttribute("href", "/settings/preferences");
  });
});
