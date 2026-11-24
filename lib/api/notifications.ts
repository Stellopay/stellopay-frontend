/**
 * @fileoverview Notifications API client.
 *
 * Reads and mutations are validated at the boundary before they reach UI
 * state. When `NEXT_PUBLIC_API_BASE_URL` is not configured the client serves
 * deterministic demo data so badges and panels still exercise their states;
 * a real backend only requires setting the env var and implementing the
 * documented endpoints.
 */

import type { NotificationItem } from "@/types/notification-item";
import {
  parseNotification,
  parseNotifications,
} from "./response-validation";

export const NOTIFICATIONS_ENDPOINT_PATH = "/api/notifications";

const PLACEHOLDER_LATENCY_MS = 150;

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notification-payment-received",
    title: "Payment received",
    message: "You received a payment of 250 USDC.",
    category: "payments",
    read: false,
    timestamp: "2026-11-23T09:30:00.000Z",
  },
  {
    id: "notification-security-alert",
    title: "Security alert",
    message: "A new sign-in was detected for your account.",
    category: "security",
    read: false,
    timestamp: "2026-11-23T08:15:00.000Z",
  },
  {
    id: "notification-payroll",
    title: "Payroll processed",
    message: "Your November payroll batch completed successfully.",
    category: "payments",
    read: true,
    timestamp: "2026-11-22T16:45:00.000Z",
    readAt: "2026-11-22T17:00:00.000Z",
  },
];

function getApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/+$/, "");
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function requestJson(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    signal,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Notifications request failed with status ${response.status}.`);
  }

  if (response.status === 204) return null;

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error("Notifications request returned invalid JSON.");
  }
}

function collectionPayload(json: unknown): unknown {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const record = json as Record<string, unknown>;
    if ("notifications" in record) return record.notifications;
    if ("data" in record) return record.data;
  }
  return json;
}

function singlePayload(json: unknown): unknown {
  if (json && typeof json === "object") {
    const record = json as Record<string, unknown>;
    if ("notification" in record) return record.notification;
    if ("data" in record) return record.data;
  }
  return json;
}

/**
 * Fetch the notification list for the active account.
 *
 * The response is parsed with the shared notification schema, so malformed
 * payloads fail before they can poison the store. `signal` is forwarded to
 * `fetch` and also cancels the placeholder delay while no backend is
 * configured.
 */
export async function getNotifications(
  signal?: AbortSignal,
): Promise<NotificationItem[]> {
  const baseUrl = getApiBaseUrl();

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS, signal);
    return parseNotifications(DEMO_NOTIFICATIONS);
  }

  const json = await requestJson(
    `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}`,
    { method: "GET" },
    signal,
  );

  return parseNotifications(collectionPayload(json));
}

/** Mark one notification as read on the backend. */
export async function markNotificationRead(
  id: string,
  signal?: AbortSignal,
): Promise<NotificationItem | null> {
  const baseUrl = getApiBaseUrl();

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS, signal);
    return null;
  }

  const json = await requestJson(
    `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    },
    signal,
  );

  return json === null ? null : parseNotification(singlePayload(json));
}

/** Mark every notification as read on the backend. */
export async function markAllNotificationsRead(
  signal?: AbortSignal,
): Promise<NotificationItem[] | null> {
  const baseUrl = getApiBaseUrl();

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS, signal);
    return null;
  }

  const json = await requestJson(
    `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}/mark-all-read`,
    { method: "POST" },
    signal,
  );

  if (json === null) return null;
  return parseNotifications(collectionPayload(json));
}

/** Remove (dismiss) one notification on the backend. */
export async function dismissNotification(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  const baseUrl = getApiBaseUrl();

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS, signal);
    return;
  }

  await requestJson(
    `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    signal,
  );
}
