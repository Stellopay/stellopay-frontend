"use client";

/**
 * @fileoverview React hook for account-scoped realtime subscriptions.
 *
 * Subscribes a listener to a realtime channel for the **current** wallet
 * account (scope = `"${network.id}:${address}"`). The subscription lifecycle
 * is fully tied to the account context:
 *
 * - **Account switch / network change** - the previous scope's listener is
 *   removed (React runs the effect cleanup before the next effect subscribes)
 *   and the new scope subscribes. The registry additionally refuses to deliver
 *   to a channel owned by a different scope, so a late event for the previous
 *   account can never update current UI state.
 * - **Logout** - the scope becomes `null`; the listener is removed and no new
 *   subscription is created.
 * - **Unmount** - the effect cleanup removes the listener (and closes the
 *   channel when it was the last listener).
 * - **Reconnect / re-render** - the listener is kept in a ref, so re-renders
 *   never re-subscribe. The registry also dedupes by channel, guaranteeing at
 *   most one subscription per view per account.
 *
 * This hook also implements a shared request/cache layer keyed by account scope
 * and channel name. When multiple consumers mount for the same scope/channel,
 * they share a single underlying realtime subscription instead of creating
 * duplicate subscriptions. Unmounting one consumer does not cancel the shared
 * subscription for other consumers. The event passed to the registry acts as the
 * one invalidation source for all dependent views.
 *
 * @example
 * `tsx
 * function TransactionHistory() {
 *   const { refetch } = useTransactions();
 *   useAccountScopedSubscription<TransactionEvent>("transactions", (event) => {
 *     if (event.kind === "created") refetch();
 *   });
 *   return <Table rows={data} />;
 * }
 * `
 *
 * @param channel  Name of the realtime channel to subscribe to
 *                 (e.g. `transactions`, `account-summary`).
 * @param listener Called with every payload delivered on the channel for the
 *                current account. Keep the reference stable or use
 *                `useCallback`; the hook re-subscribes only when the scope or
 *                channel changes, never when the listener identity changes.
 */
import { useEffect, useRef } from "react";
import { useWallet } from "@/context/wallet-context";
import { createAccountScope, realtimeRegistry } from "@/lib/realtime-registry";
import type { RealtimeListener } from "@/lib/realtime-registry";
import {
  ApiResponseValidationError,
  parseStreamPayload,
} from "@/lib/api";
import type { ValidatedStreamPayload } from "@/lib/api";

// Map of active shared subscriptions keyed by `${scope}:${channel}`.
// This implements a shared request/cache layer: concurrent consumers with the
// same account scope and channel share a single realtime subscription. When all
// consumers unmount, the subscription is cancelled.
const sharedSubscriptions = new Map<string, SharedSubscription>();

interface SharedSubscription {
  listeners: Set<RealtimeListener<unknown>>;
  unsubscribe: () => void;
  refCount: number;
}

function getSharedSubscriptionKey(scope: string, channel: string): string {
  return `${scope}:${channel}`;
}

function createSharedSubscription(
  scope: string,
  channel: string,
): SharedSubscription {
  const shared: SharedSubscription = {
    listeners: new Set(),
    unsubscribe: () => {},
    refCount: 0,
  };

  shared.unsubscribe = realtimeRegistry.subscribe(
    scope,
    channel,
    (payload: unknown) => {
      // Deliver the same event to every active consumer. If one consumer
      // unmounts and later remounts, it will re-register its listener.
      shared.listeners.forEach((listener) => listener(payload));
    },
  );

  return shared;
}

export function useAccountScopedSubscription<T = unknown>(
  channel: string,
  listener: RealtimeListener<T>,
): void {
  const { address, network } = useWallet();
  const scope = createAccountScope(network.id, address);

  // Keep the latest listener in a ref so a changing listener identity never
  // triggers a re-subscribe. Subscriptions are scoped to the channel, not the
  // callback.
  const listenerRef = useRef<RealtimeListener<T>>(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });

  useEffect(() => {
    // No connected account → nothing to subscribe. The previous effect's cleanup
    // has already detached any listener owned by the old scope.
    if (scope === null) return;

    const key = getSharedSubscriptionKey(scope, channel);
    let shared = sharedSubscriptions.get(key);

    if (!shared) {
      shared = createSharedSubscription(scope, channel);
      sharedSubscriptions.set(key, shared);
    }

    shared.refCount += 1;

    // Create a stable wrapper that forwards the payload to the current listener.
    // This wrapper is what gets stored in the shared listener set.
    const wrappedListener: RealtimeListener<unknown> = (payload) => {
      (listenerRef.current as RealtimeListener<unknown>)(payload);
    };

    shared.listeners.add(wrappedListener);

    return () => {
      shared!.listeners.delete(wrappedListener);
      shared!.refCount -= 1;

      if (shared!.refCount === 0) {
        shared!.unsubscribe();
        sharedSubscriptions.delete(key);
      }
    };
  }, [scope, channel]);
}

/**
 * Subscribe to a typed realtime envelope. Invalid payloads never reach the
 * listener, so a state update can only be made from validated data.
 */
export function useValidatedAccountScopedSubscription(
  channel: string,
  listener: RealtimeListener<ValidatedStreamPayload>,
  onValidationError?: (error: ApiResponseValidationError) => void,
): void {
  const listenerRef = useRef(listener);
  const errorRef = useRef(onValidationError);

  useEffect(() => {
    listenerRef.current = listener;
    errorRef.current = onValidationError;
  }, [listener, onValidationError]);

  useAccountScopedSubscription(channel, (payload: unknown) => {
    try {
      listenerRef.current(parseStreamPayload(payload));
    } catch (error) {
      if (error instanceof ApiResponseValidationError) {
        errorRef.current?.(error);
        return;
      }
      throw error;
    }
  });
}
