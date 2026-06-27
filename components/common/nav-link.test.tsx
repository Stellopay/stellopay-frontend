import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NavLink } from "./nav-link";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard" as string | null,
  sidebar: { isSidebarOpen: false, isMobile: false },
  theme: "light" as "light" | "dark",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/context/sidebar-context", () => ({
  default: () => ({ ...mocks.sidebar, setSidebarOpen: vi.fn() }),
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({ theme: mocks.theme }),
}));

vi.mock("@/public/svg/svg", () => ({
  DashBoardIcon: ({ color }: { color: string }) => (
    <svg data-testid="dashboard-icon" data-color={color} />
  ),
  TransactionIcon: ({ color }: { color: string }) => (
    <svg data-testid="transactions-icon" data-color={color} />
  ),
  HelpCircleIcon: ({ color }: { color: string }) => (
    <svg data-testid="help-icon" data-color={color} />
  ),
  SettinIcon: ({ color }: { color: string }) => (
    <svg data-testid="settings-icon" data-color={color} />
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      layoutId: _layoutId,
      ...props
    }: React.ComponentProps<"div"> & { layoutId?: string }) => (
      <div {...props} />
    ),
  },
}));

describe("NavLink", () => {
  beforeEach(() => {
    mocks.pathname = "/dashboard";
    mocks.sidebar = { isSidebarOpen: false, isMobile: false };
    mocks.theme = "light";
  });

  it("shows an accessible, theme-token tooltip when a collapsed link receives focus", async () => {
    render(<NavLink />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.focus(dashboardLink);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Dashboard");
    const tooltipContent = document.querySelector(
      '[data-slot="tooltip-content"]',
    );
    expect(tooltipContent).toHaveClass(
      "bg-popover",
      "text-popover-foreground",
      "border",
    );
    await waitFor(() =>
      expect(dashboardLink).toHaveAttribute("aria-describedby", tooltip.id),
    );
  });

  it("does not render tooltips when the desktop sidebar is expanded", () => {
    mocks.sidebar.isSidebarOpen = true;
    render(<NavLink />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    fireEvent.focus(dashboardLink);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-icon")).toHaveAttribute(
      "data-color",
      "#FFFFFF",
    );
  });

  it("keeps mobile navigation expanded and applies dark active colors", () => {
    mocks.pathname = "/transactions/history";
    mocks.sidebar = { isSidebarOpen: false, isMobile: true };
    mocks.theme = "dark";
    render(<NavLink />);

    expect(screen.getByRole("link", { current: "page" })).toHaveAccessibleName(
      "Transactions 10",
    );
    expect(screen.getByTestId("transactions-icon")).toHaveAttribute(
      "data-color",
      "#0D0D0D",
    );
    expect(screen.getByTestId("help-icon")).toHaveAttribute(
      "data-color",
      "#E5E5E5",
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("handles an absent pathname and active transactions in collapsed mode", () => {
    mocks.pathname = null;
    const { rerender } = render(<NavLink />);

    expect(
      screen.queryByRole("link", { current: "page" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard-icon")).toHaveAttribute(
      "data-color",
      "#71717A",
    );

    mocks.pathname = "/transactions";
    rerender(<NavLink />);

    expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
