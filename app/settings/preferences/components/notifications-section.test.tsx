import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationsSection from "./notifications-section";
import {
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/lib/api/notification-preferences";

vi.mock("@/lib/api/notification-preferences", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/api/notification-preferences")
  >("@/lib/api/notification-preferences");

  return {
    ...actual,
    getNotificationPrefs: vi.fn(),
    saveNotificationPrefs: vi.fn(),
  };
});

const mockedGetNotificationPrefs = vi.mocked(getNotificationPrefs);
const mockedSaveNotificationPrefs = vi.mocked(saveNotificationPrefs);

describe("NotificationsSection", () => {
  beforeEach(() => {
    mockedGetNotificationPrefs.mockResolvedValue(DEFAULT_NOTIFICATION_PREFS);
    mockedSaveNotificationPrefs.mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFS,
      marketing: true,
    });
  });

  it("disables save until preferences are changed, then persists the draft", async () => {
    render(<NotificationsSection />);

    const saveButton = await screen.findByRole("button", { name: "Saved" });
    expect(saveButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole("switch", { name: "Marketing and announcements" }),
    );

    expect(
      screen.getByRole("button", { name: "Save notification settings" }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Save notification settings" }),
    );

    await waitFor(() =>
      expect(mockedSaveNotificationPrefs).toHaveBeenCalledWith({
        ...DEFAULT_NOTIFICATION_PREFS,
        marketing: true,
      }),
    );
    expect(
      await screen.findByText("Notification preferences saved."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
  });

  it("reverts optimistic changes when save fails", async () => {
    mockedSaveNotificationPrefs.mockRejectedValueOnce(new Error("failed"));

    render(<NotificationsSection />);

    await screen.findByRole("button", { name: "Saved" });
    const marketingSwitch = screen.getByRole("switch", {
      name: "Marketing and announcements",
    });

    fireEvent.click(marketingSwitch);
    expect(marketingSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(
      screen.getByRole("button", { name: "Save notification settings" }),
    );

    expect(
      await screen.findByText(/previous preferences were restored/i),
    ).toBeInTheDocument();
    expect(marketingSwitch).toHaveAttribute("aria-checked", "false");
  });
});
