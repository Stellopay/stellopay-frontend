import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CookieConsentBanner } from "./cookie-consent-banner";

const STORAGE_KEY = "stellopay.cookie-consent";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    // Fully reset localStorage state before each test to prevent leakage.
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  // ------------------------------------------------------------------
  // Happy path — first-time visitor
  // ------------------------------------------------------------------

  it("renders the banner when no consent is stored (first visit)", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });
  });

  it("shows the cookie icon, message, and action buttons", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByText(/we use cookies to enhance your experience/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /accept cookies/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /decline cookies/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /learn more/i }),
    ).toBeInTheDocument();
  });

  it('"Learn more" link points to /cookies', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /learn more/i }),
      ).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /learn more/i });
    expect(link).toHaveAttribute("href", "/cookies");
  });

  // ------------------------------------------------------------------
  // Accept action
  // ------------------------------------------------------------------

  it("dismisses the banner when Accept is clicked and persists consent", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /accept cookies/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /accept cookies/i }));

    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("accepted");
  });

  // ------------------------------------------------------------------
  // Decline action
  // ------------------------------------------------------------------

  it("dismisses the banner when Decline is clicked and persists consent", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /decline cookies/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /decline cookies/i }));

    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("declined");
  });

  // ------------------------------------------------------------------
  // Persistence — returning visitor
  // ------------------------------------------------------------------

  it("does NOT render when consent was previously accepted", () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT render when consent was previously declined", () => {
    window.localStorage.setItem(STORAGE_KEY, "declined");
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  // ------------------------------------------------------------------
  // SSR safety / safeStorage error handling
  // ------------------------------------------------------------------

  it("renders banner when safeStorage.getItem throws (e.g. privacy mode)", async () => {
    // Mock getItem to throw — safeStorage catches and returns null,
    // which means first-visit behaviour → banner renders.
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Access Denied");
    });

    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
    });
  });

  it("handles safeStorage.setItem failure gracefully (e.g. quota exceeded)", async () => {
    // Mock setItem to throw after getItem returns null (so banner renders).
    vi.spyOn(window.localStorage, "getItem").mockReturnValue(null);
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota Exceeded");
    });

    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /accept cookies/i }),
      ).toBeInTheDocument();
    });

    // Clicking Accept should NOT throw, even though storage write fails.
    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /accept cookies/i }));
    }).not.toThrow();

    // Banner should still dismiss even if persistence write failed.
    await waitFor(() => {
      expect(
        screen.queryByTestId("cookie-consent-banner"),
      ).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------------------------------
  // Accessibility (WCAG 2.1 AA)
  // ------------------------------------------------------------------

  it("uses role=dialog with aria-label for assistive technology", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      const banner = screen.getByRole("dialog");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute("aria-label", "Cookie consent");
    });
  });

  it("cookie icon is decorative (aria-hidden=true)", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      const icon = document.querySelector(".lucide-cookie");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("action buttons have descriptive aria-labels", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /accept cookies/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /decline cookies/i }),
      ).toBeInTheDocument();
    });
  });

  it("does NOT trap keyboard focus — Tab cycles naturally", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /decline cookies/i }),
      ).toBeInTheDocument();
    });

    const declineBtn = screen.getByRole("button", {
      name: /decline cookies/i,
    });
    const acceptBtn = screen.getByRole("button", { name: /accept cookies/i });
    const learnMore = screen.getByRole("link", { name: /learn more/i });

    // Focus should move naturally between elements without being trapped.
    declineBtn.focus();
    expect(document.activeElement).toBe(declineBtn);

    acceptBtn.focus();
    expect(document.activeElement).toBe(acceptBtn);

    learnMore.focus();
    expect(document.activeElement).toBe(learnMore);
  });

  // ------------------------------------------------------------------
  // Negative test — no false triggers
  // ------------------------------------------------------------------

  it("does NOT render when hydrated and consent is already decided", async () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    render(<CookieConsentBanner />);

    // Wait for hydration to complete.
    await vi.waitFor(() => {
      /* flush microtasks */
    });

    expect(
      screen.queryByTestId("cookie-consent-banner"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Responsive / dark mode — presence of classes
  // ------------------------------------------------------------------

  it("applies dark mode classes on the banner container", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      const banner = screen.getByRole("dialog");
      expect(banner.className).toContain("dark:bg-[#09090B]");
      expect(banner.className).toContain("dark:border-[#1a1a1a]");
    });
  });

  it("renders Learn more link with dark-mode styling classes", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /learn more/i });
      expect(link.className).toContain("dark:text-[#a78bfa]");
    });
  });
});
