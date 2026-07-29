/**
 * Tests for useGlobalShortcuts Hook
 *
 * Tests keyboard chord detection, navigation, input suppression, and edge cases
 */

import { renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useGlobalShortcuts, SHORTCUTS, CHORD_TIMEOUT_MS } from "./useGlobalShortcuts";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("useGlobalShortcuts Hook", () => {
  let mockRouter: any;
  let mockPush: any;

  beforeEach(() => {
    mockPush = vi.fn();
    mockRouter = { push: mockPush };
    (useRouter as any).mockReturnValue(mockRouter);

    // Clear all timers before each test
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Basic Chord Detection", () => {
    it("should navigate to dashboard on 'g' then 'd'", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should navigate to transactions on 'g' then 't'", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "t" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/transactions");
    });

    it("should navigate to settings on 'g' then 's'", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "s" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/settings/preferences");
    });
  });

  describe("Case Insensitivity", () => {
    it("should work with uppercase 'G'", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "G" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should work with uppercase 'D'", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "D" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should work with mixed case", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "G" });
      const event2 = new KeyboardEvent("keydown", { key: "T" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/transactions");
    });
  });

  describe("Timeout Behavior", () => {
    it("should reset chord if second key not pressed within timeout", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      window.dispatchEvent(event1);

      // Advance time past the timeout
      vi.advanceTimersByTime(CHORD_TIMEOUT_MS + 100);

      // Now press 'd' - should not trigger because chord was reset
      const event2 = new KeyboardEvent("keydown", { key: "d" });
      window.dispatchEvent(event2);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should allow second key within timeout window", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      window.dispatchEvent(event1);

      // Advance time within the timeout
      vi.advanceTimersByTime(CHORD_TIMEOUT_MS - 100);

      const event2 = new KeyboardEvent("keydown", { key: "d" });
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Input Suppression", () => {
    it("should not trigger shortcut when focus is on text input", () => {
      renderHook(() => useGlobalShortcuts());

      const input = document.createElement("input");
      input.type = "text";
      document.body.appendChild(input);
      input.focus();

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it("should not trigger shortcut when focus is on textarea", () => {
      renderHook(() => useGlobalShortcuts());

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it("should trigger shortcut when focus is on button input", () => {
      renderHook(() => useGlobalShortcuts());

      const button = document.createElement("input");
      button.type = "button";
      document.body.appendChild(button);
      button.focus();

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");

      document.body.removeChild(button);
    });

    it("should trigger shortcut when focus is on checkbox input", () => {
      renderHook(() => useGlobalShortcuts());

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      document.body.appendChild(checkbox);
      checkbox.focus();

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");

      document.body.removeChild(checkbox);
    });
  });

  describe("Edge Cases", () => {
    it("should reset chord on any key other than valid second keys", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const eventOther = new KeyboardEvent("keydown", { key: "x" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(eventOther);
      window.dispatchEvent(event2);

      // Should not navigate because chord was broken
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle double 'g' press (reset)", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event1b = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event1b);
      window.dispatchEvent(event2);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should trigger shortcut on body element (no focus)", () => {
      renderHook(() => useGlobalShortcuts());

      // Remove focus from any element
      document.body.blur();

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      // Should still trigger since body is not a text input
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle invalid second keys gracefully", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const eventInvalid = new KeyboardEvent("keydown", { key: "x" });

      window.dispatchEvent(event1);
      window.dispatchEvent(eventInvalid);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Multiple Shortcuts in Sequence", () => {
    it("should allow multiple shortcuts in sequence", () => {
      renderHook(() => useGlobalShortcuts());

      // First shortcut: g + d
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));

      expect(mockPush).toHaveBeenCalledWith("/dashboard");

      mockPush.mockClear();

      // Second shortcut: g + t
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));

      expect(mockPush).toHaveBeenCalledWith("/transactions");

      mockPush.mockClear();

      // Third shortcut: g + s
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));

      expect(mockPush).toHaveBeenCalledWith("/settings/preferences");
    });
  });

  describe("Cleanup", () => {
    it("should remove event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useGlobalShortcuts());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it("should clear timeout on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(() => useGlobalShortcuts());

      // Press 'g' to start a chord
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));

      unmount();

      // Timeout should be cleared on unmount
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Shortcuts Configuration", () => {
    it("should export SHORTCUTS config", () => {
      expect(SHORTCUTS).toBeDefined();
      expect(SHORTCUTS.d).toBeDefined();
      expect(SHORTCUTS.t).toBeDefined();
      expect(SHORTCUTS.s).toBeDefined();
    });

    it("should have correct route mappings", () => {
      expect(SHORTCUTS.d.route).toBe("/dashboard");
      expect(SHORTCUTS.t.route).toBe("/transactions");
      expect(SHORTCUTS.s.route).toBe("/settings/preferences");
    });

    it("should have descriptive descriptions", () => {
      expect(SHORTCUTS.d.description).toContain("Dashboard");
      expect(SHORTCUTS.t.description).toContain("Transactions");
      expect(SHORTCUTS.s.description).toContain("Settings");
    });

    it("should export CHORD_TIMEOUT_MS", () => {
      expect(CHORD_TIMEOUT_MS).toBe(1000);
    });
  });

  describe("Special Keys", () => {
    it("should handle Space and other special keys", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const eventSpace = new KeyboardEvent("keydown", { key: " " });

      window.dispatchEvent(event1);
      window.dispatchEvent(eventSpace);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle Arrow keys", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g" });
      const eventArrow = new KeyboardEvent("keydown", { key: "ArrowDown" });

      window.dispatchEvent(event1);
      window.dispatchEvent(eventArrow);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle Meta/Ctrl keys with first key", () => {
      renderHook(() => useGlobalShortcuts());

      const event1 = new KeyboardEvent("keydown", { key: "g", ctrlKey: true });
      const event2 = new KeyboardEvent("keydown", { key: "d" });

      window.dispatchEvent(event1);
      window.dispatchEvent(event2);

      // Should still work even with modifiers on first key
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
