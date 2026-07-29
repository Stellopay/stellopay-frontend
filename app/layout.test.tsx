import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

describe("RootLayout — service worker registration", () => {
  it("injects the SW registration script into the document head", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>,
      { container: document.documentElement },
    );

    // The script tag must be present and carry the test-id we query in tests.
    const swScript = document.querySelector(
      "script[data-testid='sw-registration-script']",
    );
    expect(swScript).not.toBeNull();
  });

  it("SW registration script targets /sw.js with root scope", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>,
      { container: document.documentElement },
    );

    const swScript = document.querySelector(
      "script[data-testid='sw-registration-script']",
    );
    const scriptContent = swScript?.textContent ?? "";

    expect(scriptContent).toContain("/sw.js");
    expect(scriptContent).toContain("serviceWorker");
    // Deferred behind the load event so it never blocks first paint.
    expect(scriptContent).toContain("load");
  });

  it("registers SW only after the load event fires", () => {
    // Simulate a browser that supports service workers.
    const registerMock = vi.fn().mockResolvedValue(undefined);
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      configurable: true,
    });

    render(
      <RootLayout>
        <div />
      </RootLayout>,
      { container: document.documentElement },
    );

    // The SW must NOT be registered synchronously on render — it should wait
    // for the window 'load' event.
    expect(registerMock).not.toHaveBeenCalled();

    // A 'load' listener should have been attached (by the inline script logic
    // or equivalent); confirm the script content guards on the load event.
    const swScript = document.querySelector(
      "script[data-testid='sw-registration-script']",
    ) as HTMLScriptElement | null;
    const content = swScript?.textContent ?? "";
    expect(content).toContain("window.addEventListener('load'");

    addEventListenerSpy.mockRestore();
  });

  it("SW registration script guards on serviceWorker API availability", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>,
      { container: document.documentElement },
    );

    const swScript = document.querySelector(
      "script[data-testid='sw-registration-script']",
    );
    const content = swScript?.textContent ?? "";

    // Must check 'serviceWorker' in navigator before calling register so
    // environments without SW support (older browsers, jsdom) don't throw.
    expect(content).toContain("'serviceWorker' in navigator");
  });

  describe("navigator.serviceWorker.register error handling", () => {
    let originalServiceWorker: ServiceWorker | undefined;

    beforeEach(() => {
      // Capture original so we can restore after each test.
      originalServiceWorker = (
        navigator as Navigator & { serviceWorker?: ServiceWorker }
      ).serviceWorker;
    });

    afterEach(() => {
      Object.defineProperty(navigator, "serviceWorker", {
        value: originalServiceWorker,
        configurable: true,
      });
    });

    it("registration failure is caught and does not throw to the page", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const registerMock = vi
        .fn()
        .mockRejectedValue(new Error("Registration blocked"));

      Object.defineProperty(navigator, "serviceWorker", {
        value: { register: registerMock },
        configurable: true,
      });

      // Verify that the script content includes a .catch() handler so any
      // registration error is swallowed gracefully.
      render(
        <RootLayout>
          <div />
        </RootLayout>,
        { container: document.documentElement },
      );

      const swScript = document.querySelector(
        "script[data-testid='sw-registration-script']",
      );
      const content = swScript?.textContent ?? "";

      // The inline script must include a .catch path.
      expect(content).toContain(".catch(");

      consoleWarnSpy.mockRestore();
    });
  });
});
