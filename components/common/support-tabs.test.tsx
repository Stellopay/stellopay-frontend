import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import SupportTabs from "./support-tabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/support",
}));

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
