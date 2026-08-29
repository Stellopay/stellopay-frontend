"use client";

/**
 * @fileoverview React hook for account-scoped realtime subscriptions.
 *
 * Subscribes a listener to a realtime channel for the **current** wallet
 * account (scope = `"${network.id}:${address}"`). The subscription lifecycle
 * is fully tied to the account context:
 *
 * - **Account switch / network change** — the previous scope's listener is
 *   removed (React runs the effect cleanup before the next effect subscribes)
 *   and the new scope subscribes. The registry additionally refuses to deliver
 *   to a channel owned by a different scope, so a late event for the previous
 *   account can never update current UI state.
 * - **Logout** — the scope becomes `null`; the listener is removed and no new
 *   subscription is created.
 * - **Unmount** — the effect cleanup removes the listener (and closes the
 *   channel when it was the last listener).
 * - **Reconnect / re-render** — the listener is kept in a ref, so re-renders
 *   never re-subscribe. The registry also dedupes by channel, guaranteeing at
 *   most one subscription per view per account.
 *
 * @example
 * ```tsx
 * function TransactionHistory() {
 *   const { refetch } = useTransactions();
 *   useAccountScopedSubscription<TransactionEvent>("transactions", (event) => {
 *     if (event.kind === "created") refetch();
 *   });
 *   return <Table rows={data} />;
 * }
 * ```
 *
 * @param channel  Name of the realtime channel to subscribe to
 *                 (e.g. `"transactions"`, `"account-summary"`).
 * @param listener Called with every payload delivered on the channel for the
 *                 current account. Keep the reference stable or use
 *                 `useCallback`; the hook re-subscribes only when the scope or
 *                 channel changes, never when the listener identity changes.
 */
import { useEffect, useRef } from "react";
import { useWallet } from "@/context/wallet-context";
import { createAccountScope, realtimeRegistry } from "@/lib/realtime-registry";
import type { RealtimeListener } from "@/lib/realtime-registry";

export function useAccountScopedSubscription<T = unknown>(
  channel: string,
  listener: RealtimeListener<T>,
): void {
  const { address, network } = useWallet();
  const scope = createAccountScope(network.id, address);

  // Keep the latest listener in a ref so a changing listener identity never
  // triggers a re-subscribe. Subscriptions are scoped to the channel, not the
  // callback — this is what keeps "reconnect" at one subscription per view.
  const listenerRef = useRef<RealtimeListener<T>>(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });

  useEffect(() => {
    // No connected account → nothing to subscribe. The previous effect's
    // cleanup has already detached any listener owned by the old scope.
    if (scope === null) return;

    return realtimeRegistry.subscribe(scope, channel, (payload) => {
      listenerRef.current(payload);
    });
  }, [scope, channel]);
}
