import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useForm, FormProvider } from "react-hook-form";
import NotificationsSection, {
  DEFAULT_NOTIFICATION_SETTINGS,
 ui/notifications-section-channel-matrix
  type NotificationSettingsState,

  DIGEST_FREQUENCY_LABELS,
 main
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

  it("merges new digest frequency defaults when loading older stored payloads", () => {
    // Simulate an older stored payload missing digest frequency fields
    const oldPayload = {
      transactionAlerts: true,
      securityAlerts: true,
      productUpdates: true,
      marketing: false,
      emailChannel: true,
      pushChannel: true,
      smsChannel: false,
    };
    localStorage.setItem(
      "notification_preferences",
      JSON.stringify(oldPayload),
    );

    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // The email digest selector should default to "immediate"
    const immediateRadio = screen.getByTestId("digest-email-immediate");
    expect(immediateRadio).toBeChecked();
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

// ─── Digest Frequency Tests ─────────────────────────────────────────────────

describe("NotificationsSection – digest frequency", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders digest frequency selectors for each enabled channel", () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Email and push channels are enabled by default
    expect(
      screen.getByTestId("digest-email-immediate"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("digest-push-immediate"),
    ).toBeInTheDocument();

    // SMS channel is disabled by default, so its selector is hidden
    expect(
      screen.queryByTestId("digest-sms-immediate"),
    ).not.toBeInTheDocument();
  });

  it("shows SMS digest selector when SMS channel is enabled", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Enable SMS channel
    const smsToggle = screen.getByRole("switch", { name: /SMS fallback/i });
    await userEvent.click(smsToggle);

    expect(
      screen.getByTestId("digest-sms-immediate"),
    ).toBeInTheDocument();
  });

  it("persists digest frequency changes to localStorage on save", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Select "Daily digest" for email
    const dailyRadio = screen.getByTestId("digest-email-daily");
    await userEvent.click(dailyRadio);

    const saveButton = screen.getByRole("button", {
      name: /Save notification settings/i,
    });
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
    expect(stored.emailDigestFrequency).toBe("daily");
    expect(stored.pushDigestFrequency).toBe("immediate");
  });

  it("sends digest frequency in API payload", async () => {
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

    // Select "Weekly digest" for email
    const weeklyRadio = screen.getByTestId("digest-email-weekly");
    await userEvent.click(weeklyRadio);

    const saveButton = screen.getByRole("button", {
      name: /Save notification settings/i,
    });
    await userEvent.click(saveButton);

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

    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit)?.body as string,
    );
    expect(body.emailDigestFrequency).toBe("weekly");
  });

  it("disables per-event toggles when a digest frequency is selected", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Select "Daily digest" for email
    const dailyRadio = screen.getByTestId("digest-email-daily");
    await userEvent.click(dailyRadio);

    // Per-event toggles should now be disabled
    const transactionToggle = screen.getByRole("switch", {
      name: /Transaction alerts/i,
    });
    expect(transactionToggle).toBeDisabled();

    const securityToggle = screen.getByRole("switch", {
      name: /Security notifications/i,
    });
    expect(securityToggle).toBeDisabled();
  });

  it("re-enables per-event toggles when switching back to immediate", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Select "Weekly digest" for email, then back to "Immediate"
    const weeklyRadio = screen.getByTestId("digest-email-weekly");
    await userEvent.click(weeklyRadio);

    const transactionToggle = screen.getByRole("switch", {
      name: /Transaction alerts/i,
    });
    expect(transactionToggle).toBeDisabled();

    const immediateRadio = screen.getByTestId("digest-email-immediate");
    await userEvent.click(immediateRadio);

    expect(transactionToggle).not.toBeDisabled();
  });

  it("applies digest frequencies to all channels independently", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Enable SMS first
    const smsToggle = screen.getByRole("switch", { name: /SMS fallback/i });
    await userEvent.click(smsToggle);

    // Email → daily, Push → weekly, SMS → daily
    await userEvent.click(screen.getByTestId("digest-email-daily"));
    await userEvent.click(screen.getByTestId("digest-push-weekly"));
    await userEvent.click(screen.getByTestId("digest-sms-daily"));

    // All three should reflect their selected values
    expect(screen.getByTestId("digest-email-daily")).toBeChecked();
    expect(screen.getByTestId("digest-push-weekly")).toBeChecked();
    expect(screen.getByTestId("digest-sms-daily")).toBeChecked();
  });

  it("hides digest selector when its channel is disabled", async () => {
    render(
      <TestWrapper>
        <NotificationsSection />
      </TestWrapper>,
    );

    // Email has a digest selector visible
    expect(
      screen.getByTestId("digest-email-immediate"),
    ).toBeInTheDocument();

    // Turn off email channel (accessible name is "Email, enabled")
    const emailToggle = screen.getByRole("switch", { name: /Email/i });
    await userEvent.click(emailToggle);

    // Digest selector should disappear
    expect(
      screen.queryByTestId("digest-email-immediate"),
    ).not.toBeInTheDocument();
  });
});
