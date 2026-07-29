import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

// Mock font-loaders which call into native modules unavailable in jsdom.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-mock" }),
}));
vi.mock("next/font/local", () => ({
  __esModule: true,
  default: () => ({ variable: "font-local-mock" }),
}));

vi.mock("@/components/common/offline-banner", () => ({
  OfflineBanner: () => (
    <div data-testid="offline-banner-mock">OfflineBanner</div>
  ),
}));

// Default export is the RootLayout.
import RootLayout from "@/app/layout";

describe("RootLayout — offline banner integration", () => {
  it("renders the offline banner inside the layout shell", () => {
    render(
      <RootLayout>
        <div data-testid="child">content</div>
      </RootLayout>,
      { container: document.documentElement },
    );

    // Banner must be present.
    expect(screen.getByTestId("offline-banner-mock")).toBeInTheDocument();

    // Children must still render (banner does not hijack the slot).
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("includes the skip-to-content link for accessibility", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>,
      { container: document.documentElement },
    );

    expect(
      screen.getByText(/skip to main content/i),
    ).toBeInTheDocument();
  });
});
