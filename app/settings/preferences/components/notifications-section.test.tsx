import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useForm, FormProvider } from "react-hook-form";
import NotificationsSection, { DEFAULT_NOTIFICATION_SETTINGS } from "./notifications-section";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("NotificationsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hydrates from localStorage on mount", () => {
    const customSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      marketing: true, // Not default
      emailChannel: false, // Not default
    };
    localStorage.setItem("notification_preferences", JSON.stringify(customSettings));

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>
    );

    // In many UI libraries, a toggle is a switch or checkbox.
    // If this fails to find by role "switch", we might need "checkbox"
    const marketingToggle = screen.getByRole("switch", { name: /Marketing and announcements/i });
    expect(marketingToggle).toBeChecked();

    const emailToggle = screen.getByRole("switch", { name: /Email/i });
    expect(emailToggle).not.toBeChecked();
  });

  it("handles successful save via mock API", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
    
    // Mock fetch to succeed with a slight delay so we can observe 'Saving...'
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ok: true, json: async () => ({}) } as Response), 100);
      });
    });

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /Save notification settings/i });
    await userEvent.click(saveButton);

    // Should show loading state
    expect(screen.getByRole("button", { name: /Saving.../i })).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText("Notification preferences updated. Critical alerts remain prioritized.")).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(fetchSpy).toHaveBeenCalledWith("http://localhost:3000/api/user/preferences/notifications", expect.objectContaining({
      method: "POST",
      body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS)
    }));

    // Verify localStorage was updated
    expect(localStorage.getItem("notification_preferences")).toEqual(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
  });

  it("handles failed save via mock API", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
    
    // Mock fetch to fail with a slight delay
    vi.spyOn(global, "fetch").mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ok: false } as Response), 100);
      });
    });

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /Save notification settings/i });
    await userEvent.click(saveButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText("Failed to save preferences. Please try again.")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("falls back to timer mock if no BASE_URL", async () => {
    // No BASE_URL set
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /Save notification settings/i });
    
    // Change a toggle so we can test the object saved
    const marketingToggle = screen.getByRole("switch", { name: /Marketing and announcements/i });
    await userEvent.click(marketingToggle);

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Notification preferences updated. Critical alerts remain prioritized.")).toBeInTheDocument();
    });

    const stored = JSON.parse(localStorage.getItem("notification_preferences") || "{}");
    expect(stored.marketing).toBe(true);
  });
});
