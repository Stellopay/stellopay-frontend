import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useForm, FormProvider } from "react-hook-form";
import NotificationsSection, {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsState,
} from "./notifications-section";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

function getDesktopMatrix() {
  return within(screen.getByTestId("notif-matrix-desktop"));
}

const TYPE_LABELS: Record<keyof NotificationSettingsState, string> = {
  transactionAlerts: "Transaction alerts",
  securityAlerts: "Security notifications",
  productUpdates: "Product updates",
  marketing: "Marketing and announcements",
};

function desktopCheckbox(
  typeKey: keyof NotificationSettingsState,
  channel: string,
) {
  const label = TYPE_LABELS[typeKey];
  const pattern = new RegExp(`${label}.*${channel}`, "i");
  return getDesktopMatrix().getByRole("checkbox", { name: pattern });
}

function queryDesktopCheckbox(
  typeKey: keyof NotificationSettingsState,
  channel: string,
) {
  const label = TYPE_LABELS[typeKey];
  const pattern = new RegExp(`${label}.*${channel}`, "i");
  return getDesktopMatrix().queryByRole("checkbox", { name: pattern });
}

function allDesktopCheckboxes() {
  return getDesktopMatrix().getAllByRole("checkbox");
}

describe("NotificationsSection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 12 checkboxes (4 types x 3 channels) in the matrix", () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    const checkboxes = allDesktopCheckboxes();
    expect(checkboxes).toHaveLength(12);
  });

  it("hydrates from localStorage on mount", () => {
    const customSettings: NotificationSettingsState = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      marketing: { email: true, push: false, sms: true },
    };
    localStorage.setItem(
      "notification_preferences",
      JSON.stringify(customSettings),
    );

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Marketing email should now be checked (default: false → true)
    const marketingEmail = desktopCheckbox("marketing", "email");
    expect(marketingEmail).toBeChecked();

    // Marketing push should be unchecked (default: false, set to false)
    const marketingPush = desktopCheckbox("marketing", "push");
    expect(marketingPush).not.toBeChecked();

    // Marketing SMS should be checked (default: false → true)
    const marketingSms = desktopCheckbox("marketing", "sms");
    expect(marketingSms).toBeChecked();
  });

  it("handles successful save via mock API", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(
          () => resolve({ ok: true, json: async () => ({}) } as Response),
          100,
        );
      });
    });

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    const saveButton = screen.getByRole("button", {
      name: /Save notification settings/i,
    });
    await userEvent.click(saveButton);

    expect(
      screen.getByRole("button", { name: /Saving.../i }),
    ).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(
      () => {
        expect(
          screen.getByText(
            "Notification preferences updated. Critical alerts remain prioritized.",
          ),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/preferences/notifications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
      }),
    );

    expect(localStorage.getItem("notification_preferences")).toEqual(
      JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
    );
  });

  it("handles failed save via mock API", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";

    vi.spyOn(global, "fetch").mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ok: false } as Response), 100);
      });
    });

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    const saveButton = screen.getByRole("button", {
      name: /Save notification settings/i,
    });
    await userEvent.click(saveButton);

    await waitFor(
      () => {
        expect(
          screen.getByText("Failed to save preferences. Please try again."),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("falls back to timer mock if no BASE_URL", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    const saveButton = screen.getByRole("button", {
      name: /Save notification settings/i,
    });

    // Toggle marketing email checkbox on
    const marketingEmail = desktopCheckbox("marketing", "email");
    await userEvent.click(marketingEmail);

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Notification preferences updated. Critical alerts remain prioritized.",
        ),
      ).toBeInTheDocument();
    });

    const stored = JSON.parse(
      localStorage.getItem("notification_preferences") || "{}",
    );
    expect(stored.marketing.email).toBe(true);
  });

  it("updates setting when a checkbox is clicked", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Transaction alerts SMS is off by default
    const smsCheckbox = desktopCheckbox("transactionAlerts", "sms");
    expect(smsCheckbox).not.toBeChecked();

    await userEvent.click(smsCheckbox);
    expect(smsCheckbox).toBeChecked();

    // Click again to toggle off
    await userEvent.click(smsCheckbox);
    expect(smsCheckbox).not.toBeChecked();
  });

  it("renders mobile stacked layout with correct checkboxes", () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    const mobileContainer = screen.getByTestId("notif-matrix-mobile");
    const mobileCheckboxes = within(mobileContainer).getAllByRole("checkbox");
    expect(mobileCheckboxes).toHaveLength(12);
  });
});
