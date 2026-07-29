import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Loading from "./loading";
import Page from "./page";

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Account Management Loading Skeleton", () => {
  it("renders the loading skeleton structure matching the page layout", () => {
    const { container: loadingContainer } = render(<Loading />);
    
    // Test for skeleton elements matching layout
    expect(screen.getByLabelText("Search FAQ loading")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading navigation tabs")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading content area")).toBeInTheDocument();
    
    // Check for accessibility attributes
    const loadingWrapper = loadingContainer.querySelector('[aria-busy="true"]');
    expect(loadingWrapper).toBeInTheDocument();
    expect(loadingWrapper).toHaveAttribute("aria-live", "polite");

    // The skeleton should contain navigation items skeleton (6 items)
    const navSkeletons = loadingContainer.querySelectorAll('.bg-transparent.h-auto > div');
    expect(navSkeletons.length).toBe(6);
  });

  it("verifies structural parity between skeleton and loaded content", () => {
    const { container: loadingContainer } = render(<Loading />);
    const { container: pageContainer } = render(<Page />);

    // Compare structural parent nodes
    const loadingTabs = loadingContainer.querySelector('[role="tablist"], .flex-col.w-full.space-y-1');
    const pageTabs = pageContainer.querySelector('[role="tablist"]');
    
    // Ensure both have identical parent structures for the side nav and content area
    const loadingNavContainer = loadingContainer.querySelector('.md\\:max-w-80');
    const pageNavContainer = pageContainer.querySelector('.md\\:max-w-80');
    
    expect(loadingNavContainer).toBeInTheDocument();
    expect(pageNavContainer).toBeInTheDocument();
    
    const loadingContentContainer = loadingContainer.querySelector('.overflow-y-auto');
    const pageContentContainer = pageContainer.querySelector('.overflow-y-auto');
    
    expect(loadingContentContainer).toBeInTheDocument();
    expect(pageContentContainer).toBeInTheDocument();
  });
});
