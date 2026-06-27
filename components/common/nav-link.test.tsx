import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NavLink } from "./nav-link";

const testState = vi.hoisted(() => ({
  pathname: "/dashboard" as string | undefined,
  isSidebarOpen: true,
  isMobile: false,
  theme: "light",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => testState.pathname,
}));

vi.mock("@/context/sidebar-context", () => ({
  default: () => ({
    isSidebarOpen: testState.isSidebarOpen,
    isMobile: testState.isMobile,
  }),
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({ theme: testState.theme }),
}));

vi.mock("@/public/svg/svg", () => {
  const icon = (name: string) =>
    function MockIcon({ color }: { color: string }) {
      return <svg aria-hidden="true" data-color={color} data-testid={name} />;
    };

  return {
    DashBoardIcon: icon("dashboard-icon"),
    TransactionIcon: icon("transactions-icon"),
    HelpCircleIcon: icon("help-icon"),
    SettinIcon: icon("settings-icon"),
  };
});

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      layoutId,
      transition: _transition,
      ...props
    }: React.ComponentProps<"div"> & {
      layoutId?: string;
      transition?: unknown;
    }) => <div data-layout-id={layoutId} {...props} />,
  },
}));

describe("NavLink", () => {
  beforeEach(() => {
    testState.pathname = "/dashboard";
    testState.isSidebarOpen = true;
    testState.isMobile = false;
    testState.theme = "light";
  });

  it("renders labelled links, the count, and active styling when expanded", () => {
    render(<NavLink />);

    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass(
      "text-white",
    );
    expect(screen.getByRole("link", { name: /^Transactions/ })).toHaveClass(
      "text-zinc-500",
    );
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-icon")).toHaveAttribute(
      "data-color",
      "#FFFFFF",
    );
    expect(screen.getByTestId("transactions-icon")).toHaveAttribute(
      "data-color",
      "#71717A",
    );
    expect(
      document.querySelector('[data-layout-id="activeLink-desktop"]'),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("reveals a wired tooltip when a collapsed link receives keyboard focus", async () => {
    testState.isSidebarOpen = false;
    const user = userEvent.setup();
    render(<NavLink />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.tab();

    expect(dashboardLink).toHaveFocus();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Dashboard");
    expect(dashboardLink).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip.parentElement).toHaveClass(
      "bg-popover",
      "text-popover-foreground",
      "border",
    );

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("keeps the active collapsed transaction link distinct in dark mode", () => {
    testState.pathname = "/transactions/history";
    testState.isSidebarOpen = false;
    testState.theme = "dark";
    render(<NavLink />);

    expect(screen.getByTestId("transactions-icon")).toHaveAttribute(
      "data-color",
      "#0D0D0D",
    );
    expect(screen.getByTestId("dashboard-icon")).toHaveAttribute(
      "data-color",
      "#E5E5E5",
    );
    expect(
      document.querySelector('[data-layout-id="activeLink-collapsed"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("expands on mobile and safely falls back when pathname is unavailable", () => {
    testState.pathname = undefined;
    testState.isSidebarOpen = false;
    testState.isMobile = true;
    testState.theme = "dark";
    render(<NavLink />);

    expect(screen.getByText("Help/Support")).toBeVisible();
    expect(screen.getByTestId("dashboard-icon")).toHaveAttribute(
      "data-color",
      "#E5E5E5",
    );
    expect(
      document.querySelector('[data-layout-id="activeLink-mobile"]'),
    ).not.toBeInTheDocument();
  });
});
