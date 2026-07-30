import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

// Mock hooks
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings/preferences",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/context/sidebar-context", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

// Mock AppLayout
vi.mock("@/components/common/app-layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

import SettingsPreferencesLayout from "./layout";

describe("SettingsPreferencesLayout", () => {
  it("renders the breadcrumb and children inside AppLayout", () => {
    render(
      <SettingsPreferencesLayout>
        <div data-testid="test-child">Child Content</div>
      </SettingsPreferencesLayout>
    );

    // Breadcrumb should be present (by checking aria-label or specific links)
    const nav = screen.getByRole("navigation", { name: /Breadcrumb/i });
    expect(nav).toBeInTheDocument();

    // Specific crumbs for /app/settings/preferences
    expect(screen.getByText(/App/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Preferences/i)).toBeInTheDocument();

    // Children should be present
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });
});
