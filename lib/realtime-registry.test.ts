import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  RealtimeRegistry,
  createAccountScope,
  type AccountScope,
} from "./realtime-registry";

const SCOPE_A: AccountScope =
  "stellar:GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const SCOPE_B: AccountScope =
  "stellar:GBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBCB";
const CHANNEL = "transactions";

function makeRegistry() {
  return new RealtimeRegistry();
}

describe("createAccountScope", () => {
  it("combines network id and address into a scope", () => {
    expect(createAccountScope("stellar", "GABC")).toBe("stellar:GABC");
  });

  it("returns null when there is no connected address", () => {
    expect(createAccountScope("stellar", null)).toBeNull();
  });
});

describe("RealtimeRegistry.subscribe / emit", () => {
  it("delivers emitted payloads to the listener of the owning scope", () => {
    const registry = makeRegistry();
    const listener = vi.fn();

    registry.subscribe(SCOPE_A, CHANNEL, listener);
    registry.emit(CHANNEL, { id: "tx-1" });

    expect(listener).toHaveBeenCalledExactlyOnceWith({ id: "tx-1" });
  });

  it("fans out to multiple listeners without opening a second subscription", () => {
    const registry = makeRegistry();
    const first = vi.fn();
    const second = vi.fn();

    registry.subscribe(SCOPE_A, CHANNEL, first);
    registry.subscribe(SCOPE_A, CHANNEL, second);

    // Same scope + same channel → still exactly one channel record.
    expect(registry.getActiveChannelCount(CHANNEL)).toBe(1);
    expect(registry.getListenerCount(CHANNEL)).toBe(2);

    registry.emit(CHANNEL, "event");
    expect(first).toHaveBeenCalledExactlyOnceWith("event");
    expect(second).toHaveBeenCalledExactlyOnceWith("event");
  });

  it("unsubscribe removes only that listener and closes the channel when it was the last", () => {
    const registry = makeRegistry();
    const first = vi.fn();
    const second = vi.fn();

    const unsubscribeFirst = registry.subscribe(SCOPE_A, CHANNEL, first);
    const unsubscribeSecond = registry.subscribe(SCOPE_A, CHANNEL, second);

    unsubscribeFirst();
    registry.emit(CHANNEL, "event");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith("event");
    expect(registry.getListenerCount(CHANNEL)).toBe(1);

    // Remove the last listener → channel closes entirely.
    unsubscribeSecond();
    expect(registry.getActiveChannelCount(CHANNEL)).toBe(0);
    expect(registry.getListenerCount(CHANNEL)).toBe(0);
  });

  it("unsubscribe is idempotent and safe after the channel is gone", () => {
    const registry = makeRegistry();
    const unsubscribe = registry.subscribe(SCOPE_A, CHANNEL, vi.fn());

    registry.unsubscribeScope(SCOPE_A);
    expect(() => unsubscribe()).not.toThrow();
    expect(registry.getActiveChannelCount(CHANNEL)).toBe(0);
  });

  it("emit on a closed channel is a no-op", () => {
    const registry = makeRegistry();
    expect(() => registry.emit(CHANNEL, "nobody-listens")).not.toThrow();
  });
});

describe("RealtimeRegistry account scoping", () => {
  it("re-subscribing the same scope+channel reuses the channel (one subscription per view)", () => {
    const registry = makeRegistry();

    registry.subscribe(SCOPE_A, CHANNEL, vi.fn());
    registry.subscribe(SCOPE_A, CHANNEL, vi.fn());
    registry.subscribe(SCOPE_A, CHANNEL, vi.fn());

    expect(registry.getActiveChannelCount(CHANNEL)).toBe(1);
    expect(registry.getChannelScope(CHANNEL)).toBe(SCOPE_A);
  });

  it("tears down the previous account's channel before re-opening under a new scope", () => {
    const registry = makeRegistry();
    const oldAccountListener = vi.fn();
    const newAccountListener = vi.fn();

    registry.subscribe(SCOPE_A, CHANNEL, oldAccountListener);

    // Account switch: same view, new account. The old channel must be torn
    // down and the channel re-opened under SCOPE_B before the new listener is
    // attached.
    registry.subscribe(SCOPE_B, CHANNEL, newAccountListener);

    expect(registry.getChannelScope(CHANNEL)).toBe(SCOPE_B);
    expect(registry.getActiveChannelCount(CHANNEL)).toBe(1);

    // A late event for the previous account must not reach the new listener.
    registry.emit(CHANNEL, "late-event");
    expect(oldAccountListener).not.toHaveBeenCalled();
    expect(newAccountListener).toHaveBeenCalledExactlyOnceWith("late-event");
  });

  it("an unsubscribed old-scope listener cannot reattach to the new scope channel", () => {
    const registry = makeRegistry();
    const oldAccountListener = vi.fn();

    const unsubscribeOld = registry.subscribe(
      SCOPE_A,
      CHANNEL,
      oldAccountListener,
    );

    // Ownership swap closes the old channel; the old unsubscribe is a no-op.
    registry.subscribe(SCOPE_B, CHANNEL, vi.fn());
    unsubscribeOld();

    registry.emit(CHANNEL, "event");
    expect(oldAccountListener).not.toHaveBeenCalled();
    expect(registry.getChannelScope(CHANNEL)).toBe(SCOPE_B);
  });

  it("unsubscribeScope removes every channel owned by a scope and leaves others intact", () => {
    const registry = makeRegistry();
    const scopeAListener = vi.fn();
    const scopeBListener = vi.fn();

    registry.subscribe(SCOPE_A, "a:transactions", scopeAListener);
    registry.subscribe(SCOPE_A, "a:summary", scopeAListener);
    registry.subscribe(SCOPE_B, "b:transactions", scopeBListener);

    registry.unsubscribeScope(SCOPE_A);

    expect(registry.getActiveChannelCount()).toBe(1);
    expect(registry.getChannelScope("b:transactions")).toBe(SCOPE_B);
    expect(registry.getActiveChannelCount("a:transactions")).toBe(0);
    expect(registry.getActiveChannelCount("a:summary")).toBe(0);

    registry.emit("a:transactions", "stale");
    registry.emit("b:transactions", "fresh");
    expect(scopeAListener).not.toHaveBeenCalled();
    expect(scopeBListener).toHaveBeenCalledExactlyOnceWith("fresh");
  });

  it("unsubscribeScope is a no-op for an unknown or null scope", () => {
    const registry = makeRegistry();
    registry.subscribe(SCOPE_A, CHANNEL, vi.fn());

    expect(() => {
      registry.unsubscribeScope("stellar:GUNKNOWN");
      registry.unsubscribeScope(null);
    }).not.toThrow();
    expect(registry.getActiveChannelCount(CHANNEL)).toBe(1);
  });

  it("clear removes every channel and listener", () => {
    const registry = makeRegistry();
    const listener = vi.fn();

    registry.subscribe(SCOPE_A, "a:transactions", listener);
    registry.subscribe(SCOPE_B, "b:transactions", listener);
    registry.clear();

    expect(registry.getActiveChannelCount()).toBe(0);
    registry.emit("a:transactions", "event");
    registry.emit("b:transactions", "event");
    expect(listener).not.toHaveBeenCalled();
  });
});
