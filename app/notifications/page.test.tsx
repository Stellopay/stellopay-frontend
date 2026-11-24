import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationItem } from "@/types/notification-item";

const fetchNotifications = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/notifications")>();
  return { ...actual, fetchNotifications };
});

import NotificationsPage from "./page";
import { invalidateNotifications } from "@/components/common/notification-panel";
import { NotificationsSourceUnavailableError } from "@/lib/api/notifications";

/** 30 Jul 2026, 12:00 in the test runner's local time zone. */
const NOW = new Date(2026, 6, 30, 12, 0, 0);
const localIso = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(y, m, d, h, min, s, ms).toISOString();

const note = (id: string, title: string, timestamp?: string, extra: Partial<NotificationItem> = {}): NotificationItem => ({
  id,
  title,
  message: `${title} message`,
  read: false,
  timestamp,
  ...extra,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function renderPage() {
  const utils = render(<NotificationsPage />);
  // Let the shared loader settle.
  await act(async () => {});
  return utils;
}

describe("/notifications page", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    // The shared loader caches per key at module level; start every test cold.
    invalidateNotifications();
    sessionStorage.clear();
    fetchNotifications.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("loading state", () => {
    it("shows a busy skeleton while notifications load", async () => {
      const pending = deferred<unknown>();
      fetchNotifications.mockReturnValue(pending.promise);

      render(<NotificationsPage />);

      expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Loading notifications");
      expect(status.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      await act(async () => pending.resolve([]));
    });
  });

  describe("empty state", () => {
    it("explains there are no notifications", async () => {
      fetchNotifications.mockResolvedValue([]);
      await renderPage();

      expect(screen.getByRole("heading", { name: "No notifications yet" })).toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("surfaces a failed request with a retry that refetches", async () => {
      fetchNotifications.mockRejectedValueOnce(new Error("socket hang up"));
      await renderPage();

      const alert = screen.getByRole("alert");
      expect(within(alert).getByText("Couldn't load notifications")).toBeInTheDocument();
      // Raw transport errors are not shown to the user.
      expect(screen.queryByText(/socket hang up/)).not.toBeInTheDocument();

      fetchNotifications.mockResolvedValueOnce([note("a", "Recovered", localIso(2026, 6, 30, 9))]);
      fireEvent.click(within(alert).getByRole("button", { name: /try again/i }));
      await act(async () => {});

      expect(fetchNotifications).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Recovered")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("treats an invalid API response as an error, not an empty feed", async () => {
      fetchNotifications.mockResolvedValue([{ id: "x", read: "nope" }]);
      await renderPage();

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText("No notifications yet")).not.toBeInTheDocument();
    });

    it("says plainly when no notification source is connected", async () => {
      fetchNotifications.mockRejectedValue(new NotificationsSourceUnavailableError());
      await renderPage();

      expect(
        screen.getByRole("heading", { name: "Notifications aren't connected yet" }),
      ).toBeInTheDocument();
      // Retrying cannot help until a backend exists.
      expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders notifications inside the shared panel with one h1", async () => {
      fetchNotifications.mockResolvedValue([
        note("a", "Payment received", localIso(2026, 6, 30, 9), { category: "payments" }),
      ]);
      await renderPage();

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("listbox", { name: "Notifications list" })).toBeInTheDocument();
      expect(screen.getByText("Payment received")).toBeInTheDocument();
      expect(screen.getByText("Payment received message")).toBeInTheDocument();
      // The panel already lives on the full page, so it does not link to itself.
      expect(screen.queryByRole("link", { name: /view all/i })).not.toBeInTheDocument();
    });

    it("groups notifications into Today, Yesterday and Earlier", async () => {
      fetchNotifications.mockResolvedValue([
        note("e", "Last week", localIso(2026, 6, 22, 10)),
        note("t", "This morning", localIso(2026, 6, 30, 8)),
        note("y", "Last night", localIso(2026, 6, 29, 21)),
      ]);
      await renderPage();

      const groups = screen.getAllByRole("group");
      expect(groups.map((g) => g.getAttribute("aria-labelledby") && document.getElementById(g.getAttribute("aria-labelledby")!)?.textContent)).toEqual([
        "Today",
        "Yesterday",
        "Earlier",
      ]);
      expect(within(screen.getByRole("group", { name: "Today" })).getByText("This morning")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Yesterday" })).getByText("Last night")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Earlier" })).getByText("Last week")).toBeInTheDocument();
    });

    it("places items on the correct side of local midnight", async () => {
      fetchNotifications.mockResolvedValue([
        note("t0", "Midnight today", localIso(2026, 6, 30, 0, 0, 0, 0)),
        note("y1", "Last ms of yesterday", localIso(2026, 6, 29, 23, 59, 59, 999)),
        note("y0", "Midnight yesterday", localIso(2026, 6, 29, 0, 0, 0, 0)),
        note("e1", "Last ms of day before", localIso(2026, 6, 28, 23, 59, 59, 999)),
      ]);
      await renderPage();

      const today = screen.getByRole("group", { name: "Today" });
      const yesterday = screen.getByRole("group", { name: "Yesterday" });
      const earlier = screen.getByRole("group", { name: "Earlier" });
      expect(within(today).getAllByRole("option")).toHaveLength(1);
      expect(within(today).getByText("Midnight today")).toBeInTheDocument();
      expect(within(yesterday).getAllByRole("option")).toHaveLength(2);
      expect(within(earlier).getByText("Last ms of day before")).toBeInTheDocument();
    });

    it("hides date sections that have no notifications", async () => {
      fetchNotifications.mockResolvedValue([note("t", "Only today", localIso(2026, 6, 30, 10))]);
      await renderPage();

      expect(screen.getByRole("group", { name: "Today" })).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Yesterday" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Earlier" })).not.toBeInTheDocument();
    });

    it("keeps notifications without a usable timestamp or category", async () => {
      fetchNotifications.mockResolvedValue([
        note("n", "No timestamp", undefined),
        { id: "c", title: "No category", message: "m", read: true, timestamp: localIso(2026, 6, 30, 7) },
      ]);
      await renderPage();

      const earlier = screen.getByRole("group", { name: "Earlier" });
      expect(within(earlier).getByText("No timestamp")).toBeInTheDocument();
      expect(within(earlier).queryByTestId("notification-timestamp")).not.toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Today" })).getByText("No category")).toBeInTheDocument();
      expect(screen.getByTestId("count-all")).toHaveTextContent("(2)");
    });

    it("applies category filters within the date groups", async () => {
      fetchNotifications.mockResolvedValue([
        note("p", "Paid", localIso(2026, 6, 30, 9), { category: "payments" }),
        note("s", "Login", localIso(2026, 6, 29, 9), { category: "security" }),
      ]);
      await renderPage();

      fireEvent.click(screen.getByRole("tab", { name: /security/i }));

      expect(screen.queryByRole("group", { name: "Today" })).not.toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: "Yesterday" })).getByText("Login")).toBeInTheDocument();
    });
  });
});
