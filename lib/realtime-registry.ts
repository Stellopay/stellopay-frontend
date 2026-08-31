/**
 * @fileoverview Account-scoped registry for realtime subscriptions.
 *
 * The registry is the single source of truth for every realtime channel the
 * app opens (transactions, account summary, payment history, ...). Channels are
 * owned by an **account scope** -- `"${network.id}:${address}` for a connected
 * wallet, or `null` when logged out.
 *
 * Why this exists (issue #1179):
 *
 * - **Track subscription ownership** - every channel records the scope that
 *   created it, so we always know which account a subscription belongs to.
 * - **Tear down channels before replacing account context** - when a channel
 *   is re-subscribed under a different scope, the previous scope's channel
   * is torn down first. A late event for the old account can never reach a
 *   listener registered by the new account.
 * - **At most one subscription per view** - subscribing to a channel that is
 *   already open for the same scope reuses the existing channel and only adds a
 *   listener, so reconnect/refetch never stack duplicate connections.
 * - **Deterministic teardown** - `unsubscribeScope` (logout / account switch)
 *   and `clear`() (app teardown) remove every listener of the affected
 *   channels.
 *
 * The transport itself is intentionally decoupled: today the app is mock-data
 * only, so events are delivered via {@link emit}. When a real backend lands,
 * only the transport (a WebSocket / SSE client) changes - the registry,
 * ownership tracking, and teardown contract stay identical.
 */

export type AccountScope = string | null;

export type RealtimeListener<T = unknown> = (payload: T) => void;

/** Serialize the active wallet into an account scope, or `null` when logged out. */
export function createAccountScope(
  networkId: string,
  address: string | null,
): AccountScope {
  return address ? `${networkId}:${address}` : null;
}

interface ChannelRecord {
  /** Scope that owns this channel. */
  scope: AccountScope;
  /** Listeners currently registered on the channel. */
  listeners: Set<RealtimeListener>;
}

/**
 * Internal record for the request cache.
 * Tracks an in-flight or resolved request for a given key.
 */
interface RequestEntry<T> {
  /** The shared promise consumers receive. */
  promise: Promise<T>;
  /** Abort controller for the in-flight request, null once settled. */
  controller: AbortController | null;
  /** Number of consumers waiting on this entry. */
  refCount: number;
  /** Resolved payload (when resolved). */
  data?: T;
  /** True once the promise has settled successfully. */
  resolved: boolean;
}

/**
 * Account-scoped realtime subscription registry.
 *
 * Each channel maps to exactly one {@link ChannelRecord} (one "connection").
 * Multiple components may listen to the same channel; they share the record
 * rather than opening a second subscription.
 */
export class RealtimeRegistry {
  private readonly channels = new Map<string, ChannelRecord>();
  private readonly requestCache = new Map<string, RequestEntry<unknown>>();

  /**
   * Subscribe a listener to a channel on behalf of `scope`.
   *
   * - Channel not open yet → opened and owned by `scope`.
   * - Channel open for the same `scope` → listener added to the existing
   *   channel (no duplicate subscription).
   * - Channel open for a **different** scope → stale subscription from a
   *   previous account; the channel is torn down and re-opened under the new
   *   scope before the listener is attached.
   *
   * Returns an unsubscribe function that removes only this listener and closes
   * the channel when it was the last one. Unsubscribing is idempotent.
   */
  subscribe<T = unknown>(
    scope: AccountScope,
    channel: string,
    listener: RealtimeListener<T>,
  ): () => void {
    const existing = this.channels.get(channel);

    if (existing && existing.scope !== scope) {
      // Ownership changed: a previous account still owns this channel. Tear it
      // down so no event for the old account can reach a new-account listener.
      this.channels.delete(channel);
      this.requestCache.delete(channel);
    }

    let record = this.channels.get(channel);
    if (!record) {
      record = { scope, listeners: new Set() };
      this.channels.set(channel, record);
    }

    const typedListener = listener as RealtimeListener;
    record.listeners.add(typedListener);

    return () => {
      const current = this.channels.get(channel);
      // The channel may already be gone (unsubscribeScope / clear / ownership
      // swap). Unsubscribe is intentionally idempotent.
      if (!current) return;
      current.listeners.delete(typedListener);
      if (current.listeners.size === 0) {
        this.channels.delete(channel);
      }
    };
  }

  /**
   * Tear down every channel owned by `scope`. Used on logout and account
   * switch so no listener of the previous account stays attached.
   */
  unsubscribeScope(scope: AccountScope): void {
    for (const [channel, record] of this.channels) {
      if (record.scope === scope) {
        this.channels.delete(channel);
        this.requestCache.delete(channel);
      }
    }
  }

  /** Tear down every channel and listener (global logout / app teardown). */
  clear(): void {
    this.channels.clear();
    this.requestCache.clear();
  }

  /**
   * Deliver a payload to every listener of `channel` and invalidate the
   * request cache for this channel, even when no channel is open. This is the
   * seam a real WebSocket/SSE transport plugs into.
   *
   * The cache invalidation is the single invalidation source for notification
   * dashboards, so the next `acquire` call fetches fresh data.
   */
  emit<T = unknown>(channel: string, payload: T): void {
    this.requestCache.delete(channel);
    const record = this.channels.get(channel);
    if (!record) return;
    for (const listener of record.listeners) {
      listener(payload);
    }
  }

  /**
   * Acquire a shared request for `key`.
   *
   * Concurrent callers with the same `key` receive the same in-flight promise.
   * The first caller triggers `fetcher`; when every caller has disposed, the
   * request is aborted. If the request has already succeeded, a resolved
   * promise is returned (until {@link emit} invalidates the cache).
   *
   * @returns A promise and a `dispose` function to call when the consumer no
   *   longer needs the result.
   */
  acquire<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
  ): { promise: Promise<T>; dispose: () => void } {
    const existing = this.requestCache.get(key) as RequestEntry<T> | undefined;

    if (existing && !existing.resolved) {
      // Request already in flight — share it.
      existing.refCount += 1;
      return {
        promise: existing.promise,
        dispose: () => this.disposeRequest(key),
      };
    }

    if (existing && existing.resolved) {
      // Cache hit — return the resolved promise. The cache is invalidated on
      // `emit`, so this value is considered fresh.
      return {
        promise: Promise.resolve(existing.data as T),
        dispose: () => {},
      };
    }

    // No entry much - start a new request.
    const controller = new AbortController();
    const entry: RequestEntry<T> = {
      promise: undefined as unknown as Promise<T>,
      controller,
      refCount: 1,
      resolved: false,
    };

    const promise = fetcher(controller.signal).then(
      (data) => {
        entry.data = data;
        entry.resolved = true;
        entry.controller = null;
        return data;
      },
      (error) => {
        // Remove the entry so the next call can retry.
        this.requestCache.delete(key);
        throw error;
      },
    );

    entry.promise = promise;
    this.requestCache.set(key, entry);

    return {
      promise,
      dispose: () => this.disposeRequest(key),
    };
  }

  private disposeRequest(key: string): void {
    const entry = this.requestCache.get(key);
    if (!entry) return;

    entry.refCount -= 1;
    if (entry.refCount <= 0 && !entry.resolved) {
      entry.controller?.abort();
      this.requestCache.delete(key);
    }
  }

  /**
   * Number of channels currently open. Exposed for tests and debugging; a
   * "reconnect creates at most one subscription per view" assertion is simply
   * `getActiveChannelCount("transactions") === 1`.
   */
  getActiveChannelCount(channel?: string): number {
    if (channel === undefined) return this.channels.size;
    return this.channels.has(channel) ? 1 : 0;
  }

  /** Number of listeners currently attached to `channel` (0 when not open). */
  getListenerCount(channel: string): number {
    return this.channels.get(channel)?.listeners.size ?? 0;
  }

  /** Scope that currently owns `channel`, or `null` when the channel is closed. */
  getChannelScope(channel: string): AccountScope {
    return this.channels.get(channel)?.scope ?? null;
  }
}

/**
 * App-wide singleton. All components, hooks, and the wallet provider share
 * this instance so teardown is coordinated in one place.
 */
export const realtimeRegistry = new RealtimeRegistry();
