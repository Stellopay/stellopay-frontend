import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NotificationsSection from "@/app/settings/preferences/components/notifications-section";

describe("NotificationsSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("persists notification settings and announces success", async () => {
    render(<NotificationsSection />);

    fireEvent.click(
      screen.getByRole("switch", { name: /marketing and announcements/i }),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save notification settings/i }),
      );
    });

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(
      screen.getByText(/notification preferences saved/i),
    ).toBeInTheDocument();

    const saved = window.localStorage.getItem(
      "stellopay:notification-settings",
    );
    expect(saved).toContain('"marketing":true');
  });

  it("shows an error when all delivery channels are disabled", async () => {
    render(<NotificationsSection />);

    fireEvent.click(screen.getByText(/customize delivery channels/i));
    fireEvent.click(screen.getByRole("switch", { name: "Email" }));
    fireEvent.click(screen.getByRole("switch", { name: /push notifications/i }));

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save notification settings/i }),
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(
      screen.getByText(/select at least one delivery channel/i),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem("stellopay:notification-settings"),
    ).toBeNull();
  });

  it("clears the announced status after five seconds", async () => {
    render(<NotificationsSection />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save notification settings/i }),
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(
      screen.getByText(/notification preferences saved/i),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.queryByText(/notification preferences saved/i),
    ).not.toBeInTheDocument();
  });
});
