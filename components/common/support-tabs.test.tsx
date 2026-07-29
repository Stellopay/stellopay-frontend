import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

import SupportTabs from "./support-tabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/support",
}));

const SUPPORT_ROUTES = [
  { route: "/help/support/accountManagement", label: "Account Management" },
  { route: "/help/support/transactionIssues", label: "Transaction Issues" },
  { route: "/help/support/securityPrivacy", label: "Security & Privacy" },
  { route: "/help/support/paymentTransfers", label: "Payment & Transfers" },
] as const;

describe("SupportTabs — Contact Support submit button (migrated to ui/button)", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    // Force the fetch branch (rather than the no-op test-mode delay) so the
    // "loading" state is observable and controllable in these tests.
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
    vi.unstubAllGlobals();
  });

  const renderContactTab = () => {
    const setActiveTab = vi.fn();
    render(
      <SupportTabs activeTab="Contact Support" setActiveTab={setActiveTab} />,
    );
  };

  it("renders the Send Message submit button, disabled until the form is filled", () => {
    renderContactTab();
    const button = screen.getByRole("button", { name: "Send Message" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
  });

  it("enables the button once all required fields are filled", () => {
    renderContactTab();

    fireEvent.change(screen.getByPlaceholderText("Maya"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Sullivan"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Describe your issue in detail"),
      {
        target: { value: "Something is broken and I need help." },
      },
    );

    expect(
      screen.getByRole("button", { name: "Send Message" }),
    ).not.toBeDisabled();
  });

  it("shows a loading state and disables the button while submitting", async () => {
    let resolveFetch!: (value: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    renderContactTab();

    fireEvent.change(screen.getByPlaceholderText("Maya"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Sullivan"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Describe your issue in detail"),
      {
        target: { value: "Something is broken and I need help." },
      },
    );

    const form = screen
      .getByRole("button", { name: "Send Message" })
      .closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();

    resolveFetch({ ok: true, json: async () => ({}) });

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Your support request has been submitted successfully!",
        ).length,
      ).toBeGreaterThan(0);
    });
  });
});

describe("SupportTabs — route-existence check", () => {
  const repoRoot = path.resolve(__dirname, "../..");

  it.each(SUPPORT_ROUTES)(
    "has a page.tsx for $route",
    ({ route, label }) => {
      const routeDir = route.replace(/^\//, "");
      const pagePath = path.join(repoRoot, "app", routeDir, "page.tsx");
      expect(fs.existsSync(pagePath)).toBe(true);
    },
  );

  it.each(SUPPORT_ROUTES)(
    "has a loading.tsx for $route",
    ({ route, label }) => {
      const routeDir = route.replace(/^\//, "");
      const loadingPath = path.join(repoRoot, "app", routeDir, "loading.tsx");
      expect(fs.existsSync(loadingPath)).toBe(true);
    },
  );

  it("every sub-route in app/help/support has both page.tsx and loading.tsx", () => {
    const appDir = path.join(repoRoot, "app/help/support");
    const entries = fs.readdirSync(appDir, { withFileTypes: true });
    const subPages = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    expect(subPages.length).toBeGreaterThan(0);
    subPages.forEach((subPage) => {
      const pagePath = path.join(appDir, subPage, "page.tsx");
      expect(fs.existsSync(pagePath)).toBe(true);
      const loadingPath = path.join(appDir, subPage, "loading.tsx");
      expect(fs.existsSync(loadingPath)).toBe(true);
    });
  });

  it("does not have unmapped sub-routes that would be inaccessible", () => {
    const appDir = path.join(repoRoot, "app/help/support");
    const entries = fs.readdirSync(appDir, { withFileTypes: true });
    const subPages = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const expected = SUPPORT_ROUTES.map(
      (r) => r.route.replace("/help/support/", ""),
    );
    subPages.forEach((subPage) => {
      expect(expected).toContain(subPage);
    });
  });
});
