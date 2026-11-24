"use client";

/**
 * @fileoverview Account-scoped notifications store.
 *
 * One module-level store backs the navbar badge, dashboard header, and any
 * future notification surface. State is keyed by the wallet account scope
 * (`"${network.id}:${address}"`) so switching accounts can never render the
 * previous account's notifications.
 *
 * Fetches are deduplicated through `realtimeRegistry.acquire`, which shares
 * one in-flight request across every mounted consumer and aborts it when the
 * last consumer detaches. Mutations are optimistic: the store applies the
 * change immediately, then rolls the previous snapshot back if the request
 * rejects.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { useWallet } from "@/context/wallet-context";
import {
  createAccountScope,
  realtimeRegistry,
  type AccountScope,
} from "@/lib/realtime-registry";
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import type { NotificationItem } from "@/types/notification-item";

export type { NotificationItem } from "@/types/notification-item";

export type NotificationsStatus = "idle" | "loading" | "success" | "error";

export interface NotificationsState {
  scope: AccountScope;
  data: NotificationItem[] | null;
  status: NotificationsStatus;
  /** Last fetch/invalidation error. */
  error: Error | null;
  /** Last optimistic-mutation error. */
  mutationError: Error | null;
}

export interface UseNotificationsResult {
  data: NotificationItem[] | null;
  /** Alias kept for consumers that prefer the domain name. */
  notifications: NotificationItem[] | null;
  status: NotificationsStatus;
  /** Fetch error, falling back to the most recent mutation error. */
  error: Error | null;
  mutationError: Error | null;
  isLoading: boolean;
  loading: boolean;
  scope: AccountScope;
  refetch: () => void;
}

export type NotificationMutationDescriptor =
  | { type: "mark-read" | "markRead"; id: string }
  | { type: "mark-all-read" | "markAllRead" }
  | { type: "dismiss" | "dismissNotification" | "delete"; id: string };

export type NotificationMutation =
  | NotificationMutationDescriptor
  | ((items: NotificationItem[]) => NotificationItem[]);

export type NotificationMutationRequest = (
  signal: AbortSignal,
) => Promise<unknown>;

export interface ApplyNotificationMutationOptions {
  /** Override the active wallet scope (mainly for tests/tools). */
  scope?: AccountScope;
  /** Custom persistence call; required when `mutation` is an updater. */
  request?: NotificationMutationRequest;
  /** Injectable clock for deterministic `readAt` values. */
  now?: () => string;
}

const IDLE_STATE: NotificationsState = {
  scope: null,
  data: null,
  status: "idle",
  error: null,
  mutationError: null,
};

const states = new Map<string, NotificationsState>();
const listeners = new Set<() => void>();
const scopeConsumers = new Map<string, number>();
const scopeDisposers = new Map<string, () => void>();
const scopeLoadIds = new Map<string, number>();

let activeScope: AccountScope = null;

function stateKey(scope: AccountScope): string {
  return scope ?? "";
}

function requestKey(scope: AccountScope): string {
  return `notifications:${scope ?? "anonymous"}`;
}

function getState(scope: AccountScope): NotificationsState {
  if (scope === null) return IDLE_STATE;
  return states.get(scope) ?? IDLE_STATE;
}

function ensureState(scope: AccountScope): void {
  if (scope === null || states.has(scope)) return;
  states.set(scope, { ...IDLE_STATE, scope });
}

function setState(
  scope: AccountScope,
  updater: (state: NotificationsState) => NotificationsState,
): void {
  if (scope === null) return;
  ensureState(scope);
  const current = states.get(scope) ?? { ...IDLE_STATE, scope };
  const next = updater(current);
  if (next === current) return;
  states.set(scope, next);
  notifyListeners();
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function subscribeToStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function toError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

function nextLoadId(scope: AccountScope): number {
  const next = (scopeLoadIds.get(stateKey(scope)) ?? 0) + 1;
  scopeLoadIds.set(stateKey(scope), next);
  return next;
}

function beginFetch(scope: AccountScope): void {
  const loadId = nextLoadId(scope);
  const key = requestKey(scope);

  // Abort any previous request for this account before starting a fresh one.
  realtimeRegistry.invalidateRequest(key);

  setState(scope, (state) => ({
    ...state,
    status: "loading",
    error: null,
    mutationError: null,
  }));

  const { promise, dispose } = realtimeRegistry.acquire(
    key,
    (signal) => getNotifications(signal),
  );
  scopeDisposers.set(stateKey(scope), dispose);

  promise.then(
    (data) => {
      if (scopeLoadIds.get(stateKey(scope)) !== loadId) return;
      setState(scope, (state) => ({
        ...state,
        data,
        status: "success",
        error: null,
        mutationError: null,
      }));
    },
    (error: unknown) => {
      if (scopeLoadIds.get(stateKey(scope)) !== loadId) return;
      if (isAbortError(error)) {
        setState(scope, (state) => ({
          ...state,
          status: state.data ? "success" : "idle",
        }));
        return;
      }
      setState(scope, (state) => ({
        ...state,
        status: "error",
        error: toError(error, "Failed to load notifications"),
      }));
    },
  );
}

function retainScope(scope: AccountScope): () => void {
  const key = stateKey(scope);
  const count = (scopeConsumers.get(key) ?? 0) + 1;
  scopeConsumers.set(key, count);
  activeScope = scope;
  ensureState(scope);

  const state = getState(scope);
  if (
    count === 1 &&
    (state.status === "idle" || state.status === "error")
  ) {
    beginFetch(scope);
  }

  return () => {
    const remaining = (scopeConsumers.get(key) ?? 1) - 1;
    if (remaining <= 0) {
      scopeConsumers.delete(key);
      const dispose = scopeDisposers.get(key);
      scopeDisposers.delete(key);
      dispose?.();

      setState(scope, (current) =>
        current.status === "loading"
          ? {
              ...current,
              status: current.data ? "success" : "idle",
            }
          : current,
      );

      if (activeScope === scope) activeScope = null;
    } else {
      scopeConsumers.set(key, remaining);
    }
  };
}

function invalidateScope(scope: AccountScope): void {
  if (scope === null) return;

  realtimeRegistry.invalidateRequest(requestKey(scope));
  nextLoadId(scope);

  if ((scopeConsumers.get(stateKey(scope)) ?? 0) > 0) {
    beginFetch(scope);
    return;
  }

  states.delete(scope);
  notifyListeners();
}

/**
 * Invalidate cached notifications and refetch every active consumer.
 *
 * With no argument every account scope is invalidated; pass a scope returned
 * by {@link UseNotificationsResult.scope} to target one account.
 */
export function invalidateNotifications(scope?: AccountScope): void {
  if (scope !== undefined) {
    invalidateScope(scope);
    return;
  }

  const scopes = new Set<AccountScope>([
    ...Array.from(states.values()).map((state) => state.scope),
    ...Array.from(scopeConsumers.keys()).map((key) =>
      key === "" ? null : key,
    ),
  ]);

  scopes.forEach((scopeKey) => {
    if (scopeKey !== null) invalidateScope(scopeKey);
  });
}

function descriptorUpdater(
  mutation: NotificationMutationDescriptor,
  readAt: string,
): (items: NotificationItem[]) => NotificationItem[] {
  switch (mutation.type) {
    case "mark-read":
    case "markRead":
      return (items) =>
        items.map((item) =>
          item.id === mutation.id && !item.read
            ? { ...item, read: true, readAt }
            : item,
        );
    case "mark-all-read":
    case "markAllRead":
      return (items) =>
        items.map((item) =>
          item.read ? item : { ...item, read: true, readAt },
        );
    case "dismiss":
    case "dismissNotification":
    case "delete":
      return (items) => items.filter((item) => item.id !== mutation.id);
  }
}

function defaultMutationRequest(
  mutation: NotificationMutationDescriptor,
): NotificationMutationRequest {
  switch (mutation.type) {
    case "mark-read":
    case "markRead":
      return (signal) => markNotificationRead(mutation.id, signal);
    case "mark-all-read":
    case "markAllRead":
      return (signal) => markAllNotificationsRead(signal);
    case "dismiss":
    case "dismissNotification":
    case "delete":
      return (signal) => dismissNotification(mutation.id, signal);
  }
}

/**
 * Apply an optimistic notification mutation with rollback.
 *
 * `mutation` may be a descriptor (`mark-read`, `mark-all-read`, `dismiss`) or
 * an updater function. Descriptor mutations persist through the notifications
 * API; updater mutations require `options.request` (or a request function as
 * the second argument) so the optimistic change is always backed by a real
 * request.
 *
 * The returned promise rejects after the previous snapshot has been restored
 * and `mutationError` has been published, so callers can surface the failure.
 */
export async function applyNotificationMutation(
  mutation: NotificationMutation,
  options: ApplyNotificationMutationOptions | NotificationMutationRequest = {},
): Promise<void> {
  const normalized: ApplyNotificationMutationOptions =
    typeof options === "function" ? { request: options } : options;

  const scope =
    normalized.scope !== undefined ? normalized.scope : activeScope;
  if (scope === null) {
    throw new Error(
      "Cannot apply a notification mutation without an active account scope.",
    );
  }

  const state = getState(scope);
  if (!state.data) {
    throw new Error("Notifications are not loaded for the active account.");
  }

  const readAt = normalized.now?.() ?? new Date().toISOString();
  const updater =
    typeof mutation === "function"
      ? mutation
      : descriptorUpdater(mutation, readAt);
  const request =
    normalized.request ??
    (typeof mutation === "function" ? undefined : defaultMutationRequest(mutation));

  if (!request) {
    throw new Error("A persistence request is required for updater mutations.");
  }

  const previousData = state.data;
  const optimisticData = updater(previousData);

  setState(scope, (current) => ({
    ...current,
    data: optimisticData,
    mutationError: null,
  }));

  try {
    await request(new AbortController().signal);
  } catch (error) {
    const mutationError = toError(error, "Failed to update notification");
    setState(scope, (current) => ({
      ...current,
      data: current.data === optimisticData ? previousData : current.data,
      mutationError,
    }));
    throw mutationError;
  }

  setState(scope, (current) => ({
    ...current,
    mutationError: null,
  }));
}

/** Count unread notifications without allocating an intermediate array. */
export function selectUnreadCount(
  items: readonly Pick<NotificationItem, "read">[] | null | undefined,
): number {
  if (!items) return 0;
  let count = 0;
  for (const item of items) {
    if (!item.read) count += 1;
  }
  return count;
}

const getServerSnapshot = () => IDLE_STATE;

/**
 * Subscribe to the account-scoped notifications store.
 *
 * The hook uses the wallet's account scope, so a wallet switch or logout
 * immediately detaches the previous scope's consumers and presents the new
 * scope's state (or an empty idle state while logged out).
 */
export function useNotifications(): UseNotificationsResult {
  const { address, network } = useWallet();
  const scope = createAccountScope(network.id, address);

  const subscribe = useCallback(
    (listener: () => void) => subscribeToStore(listener),
    [],
  );
  const getSnapshot = useCallback(
    () => getState(scope),
    [scope],
  );

  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (scope === null) return;
    return retainScope(scope);
  }, [scope]);

  const refetch = useCallback(() => {
    if (scope !== null) invalidateNotifications(scope);
  }, [scope]);

  return {
    data: state.data,
    notifications: state.data,
    status: state.status,
    error: state.error ?? state.mutationError,
    mutationError: state.mutationError,
    isLoading: state.status === "loading",
    loading: state.status === "loading",
    scope,
    refetch,
  };
}
