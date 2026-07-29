import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import type React from "react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("./search-bar", () => ({
  SearchBar: () => <div data-testid="search-bar">Search</div>,
}));

vi.mock("./nav-link", () => ({
  NavLink: () => <nav data-testid="nav-link">Nav</nav>,
}));

vi.mock("@/public/svg/svg", () => ({
  StellOpayLogo: () => <div data-testid="logo">StellOpay</div>,
}));

type UseSidebarReturn = {
  isSidebarOpen: boolean;
  setSidebarOpen: ReturnType<typeof vi.fn>;
  isMobile: boolean;
};

const mockUseSidebar = vi.fn<() => UseSidebarReturn>();

vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => mockUseSidebar(),
}));

import { SideBar } from "./side-bar";

describe("SideBar", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the sidebar as an aside with an accessible label", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    expect(screen.getByRole("complementary")).toHaveAccessibleName("Application sidebar");
  });

  it("renders the logo when sidebar is open", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("renders the collapse/expand toggle button with correct aria-label", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("renders SearchBar and NavLink", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    expect(screen.getByTestId("nav-link")).toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    const { container } = render(<SideBar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("dark:bg-[#101010]");
    expect(aside).toHaveClass("dark:border-[#1A1A1A]");
  });

  it("does not render the close button on desktop (non-mobile)", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    expect(screen.queryByRole("button", { name: /close sidebar/i })).not.toBeInTheDocument();
  });

  it("renders the close button when isMobile is true", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: true, setSidebarOpen: vi.fn(), isMobile: true });
    render(<SideBar />);
    expect(screen.getByRole("button", { name: /close sidebar/i })).toBeInTheDocument();
  });

  it("hides logo when sidebar is collapsed on desktop", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: false, setSidebarOpen: vi.fn(), isMobile: false });
    render(<SideBar />);
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument();
  });

  it("always shows logo on mobile regardless of sidebar state", () => {
    mockUseSidebar.mockReturnValue({ isSidebarOpen: false, setSidebarOpen: vi.fn(), isMobile: true });
    render(<SideBar />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });
});