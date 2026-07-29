import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

const mockPathname = vi.hoisted(() => ({ value: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
}));

vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("@material-tailwind/react", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  },
}));

vi.mock("@/public/svg/svg", () => ({
  DashBoardIcon: () => <svg aria-hidden="true" />,
  TransactionIcon: () => <svg aria-hidden="true" />,
  HelpCircleIcon: () => <svg aria-hidden="true" />,
  SettinIcon: () => <svg aria-hidden="true" />,
}));

import { NavLink } from "./nav-link";

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

  it("updates aria-current when the client-side pathname changes", () => {
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
