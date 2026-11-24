import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { useWallet } from "@/context/wallet-context";
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { realtimeRegistry } from "./realtime-registry";
import type { NotificationItem } from "@/types/notification-item";
import {
  applyNotificationMutation,
  invalidateNotifications,
  selectUnreadCount,
  useNotifications,
} from "./notifications-store";

vi.mock("@/context/wallet-context", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/lib/api/notifications", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  dismissNotification: vi.fn(),
}));

const NETWORK = { id: "stellar", name: "Stellar" };
const ADDRESS_A = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const ADDRESS_B = "G" + "B".repeat(55);

function mockWallet(address: string | null) {
  (useWallet as Mock).mockReturnValue({ address, network: NETWORK });
}

function notification(id: string, read = false): NotificationItem {
  return {
    id,
    title: `Notification ${id}`,
    message: `Message ${id}`,
    category: "system",
    read,
    timestamp: "2026-11-23T09:00:00.000Z",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("notifications store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeRegistry.clear();
    mockWallet(ADDRESS_A);
  });

  it("loads notifications for the active account scope", async () => {
    (getNotifications as Mock).mockResolvedValue([
      notification("n1"),
      notification("n2", true),
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.data).toHaveLength(2);
    expect(selectUnreadCount(result.current.data)).toBe(1);
    expect(getNotifications).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight fetch across mounted consumers", async () => {
    const request = deferred<NotificationItem[]>();
    (getNotifications as Mock).mockReturnValue(request.promise);

    const first = renderHook(() => useNotifications());
    const second = renderHook(() => useNotifications());

    expect(getNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve([notification("shared")]);
      await request.promise;
    });

    await waitFor(() => {
      expect(first.result.current.status).toBe("success");
      expect(second.result.current.status).toBe("success");
    });
    expect(first.result.current.data?.[0]?.id).toBe("shared");
    expect(second.result.current.data?.[0]?.id).toBe("shared");
  });

  it("exposes fetch errors", async () => {
    (getNotifications as Mock).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("network down");
    expect(result.current.data).toBeNull();
  });

  it("rolls back an optimistic mark-read mutation when the request fails", async () => {
    (getNotifications as Mock).mockResolvedValue([notification("n1")]);
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.status).toBe("success"));

    (markNotificationRead as Mock).mockRejectedValue(new Error("write failed"));

    await act(async () => {
      await expect(
        applyNotificationMutation({ type: "mark-read", id: "n1" }),
      ).rejects.toThrow("write failed");
    });

    expect(result.current.data?.[0]?.read).toBe(false);
    expect(result.current.mutationError?.message).toBe("write failed");
    expect(result.current.error?.message).toBe("write failed");
    expect(result.current.status).toBe("success");
  });

  it("applies mark-all-read optimistically", async () => {
    (getNotifications as Mock).mockResolvedValue([
      notification("n1"),
      notification("n2", true),
    ]);
    (markAllNotificationsRead as Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      await applyNotificationMutation({ type: "mark-all-read" });
    });

    expect(result.current.data?.every((item) => item.read)).toBe(true);
    expect(result.current.mutationError).toBeNull();
    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("dismisses a notification optimistically and rolls back on failure", async () => {
    (getNotifications as Mock).mockResolvedValue([
      notification("n1"),
      notification("n2"),
    ]);
    (dismissNotification as Mock).mockRejectedValue(new Error("delete failed"));

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      await expect(
        applyNotificationMutation({ type: "dismiss", id: "n1" }),
      ).rejects.toThrow("delete failed");
    });

    expect(result.current.data?.map((item) => item.id)).toEqual(["n1", "n2"]);
    expect(result.current.mutationError?.message).toBe("delete failed");
  });

  it("invalidates and refetches the active scope", async () => {
    (getNotifications as Mock)
      .mockResolvedValueOnce([notification("old")])
      .mockResolvedValueOnce([notification("fresh")]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.data?.[0]?.id).toBe("old"));

    act(() => {
      invalidateNotifications(result.current.scope);
    });

    await waitFor(() => expect(result.current.data?.[0]?.id).toBe("fresh"));
    expect(getNotifications).toHaveBeenCalledTimes(2);
  });

  it("clears the previous account's notifications on account switch", async () => {
    (getNotifications as Mock)
      .mockResolvedValueOnce([notification("account-a")])
      .mockResolvedValueOnce([notification("account-b")]);

    mockWallet(ADDRESS_A);
    const { result, rerender } = renderHook(() => useNotifications());
    await waitFor(() =>
      expect(result.current.data?.[0]?.id).toBe("account-a"),
    );

    mockWallet(ADDRESS_B);
    rerender();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data?.[0]?.id).toBe("account-b");
    expect(result.current.data?.some((item) => item.id === "account-a")).toBe(
      false,
    );
    expect(getNotifications).toHaveBeenCalledTimes(2);
  });
});
