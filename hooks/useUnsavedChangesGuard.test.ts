import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/** Fires a real `beforeunload` event and returns it so callers can inspect
 * whether `preventDefault()` was called and what `returnValue` ended up as. */
function dispatchBeforeUnload(): Event {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

function clickAnchor(href: string, options: Partial<MouseEventInit> = {}) {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  anchor.textContent = "Go";
  document.body.appendChild(anchor);

  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...options,
  });
  anchor.dispatchEvent(event);
  document.body.removeChild(anchor);
  return event;
}

describe("useUnsavedChangesGuard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("beforeunload", () => {
    it("does not prevent unload when there are no unsaved changes", () => {
      renderHook(() => useUnsavedChangesGuard(false));
      const event = dispatchBeforeUnload();
      expect(event.defaultPrevented).toBe(false);
    });

    it("prevents unload when there are unsaved changes", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      const event = dispatchBeforeUnload();
      expect(event.defaultPrevented).toBe(true);
    });

    it("picks up a change to isDirty after the initial render", () => {
      const { rerender } = renderHook(
        ({ dirty }) => useUnsavedChangesGuard(dirty),
        { initialProps: { dirty: false } },
      );

      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

      rerender({ dirty: true });
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
    });

    it("removes the listener on unmount", () => {
      const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
      unmount();
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
  });

  describe("in-app link navigation", () => {
    it("allows navigation when there are no unsaved changes", () => {
      renderHook(() => useUnsavedChangesGuard(false));
      const confirmSpy = vi.spyOn(window, "confirm");
      const event = clickAnchor("/dashboard");
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it("confirms and allows navigation when the user accepts", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const event = clickAnchor("/dashboard");
      expect(event.defaultPrevented).toBe(false);
    });

    it("confirms and blocks navigation when the user cancels", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const event = clickAnchor("/dashboard");
      expect(event.defaultPrevented).toBe(true);
    });

    it("ignores hash-only links", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      const confirmSpy = vi.spyOn(window, "confirm");
      clickAnchor("#section");
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("ignores modified clicks (e.g. cmd/ctrl-click to open a new tab)", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      const confirmSpy = vi.spyOn(window, "confirm");
      clickAnchor("/dashboard", { metaKey: true });
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("ignores links targeting a new tab", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      const confirmSpy = vi.spyOn(window, "confirm");
      const anchor = document.createElement("a");
      anchor.setAttribute("href", "/dashboard");
      anchor.setAttribute("target", "_blank");
      document.body.appendChild(anchor);
      anchor.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
      document.body.removeChild(anchor);
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("ignores clicks already marked defaultPrevented by an earlier capture-phase handler", () => {
      // A capture-phase listener registered on `document` before the hook's
      // own runs first (capture listeners on the same target fire in
      // registration order), so this simulates another guard upstream
      // already having handled the click.
      const earlierHandler = (e: Event) => e.preventDefault();
      document.addEventListener("click", earlierHandler, true);

      renderHook(() => useUnsavedChangesGuard(true));
      const confirmSpy = vi.spyOn(window, "confirm");
      clickAnchor("/dashboard");
      expect(confirmSpy).not.toHaveBeenCalled();

      document.removeEventListener("click", earlierHandler, true);
    });

    it("ignores clicks on elements with no ancestor anchor", () => {
      renderHook(() => useUnsavedChangesGuard(true));
      const confirmSpy = vi.spyOn(window, "confirm");
      const div = document.createElement("div");
      document.body.appendChild(div);
      div.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
      document.body.removeChild(div);
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("removes the click listener on unmount", () => {
      const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
      unmount();
      const confirmSpy = vi.spyOn(window, "confirm");
      clickAnchor("/dashboard");
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  describe("confirmDiscard", () => {
    it("returns true immediately when there are no unsaved changes", () => {
      const { result } = renderHook(() => useUnsavedChangesGuard(false));
      const confirmSpy = vi.spyOn(window, "confirm");
      expect(result.current.confirmDiscard()).toBe(true);
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("reflects the user's confirm() choice when there are unsaved changes", () => {
      const { result } = renderHook(() => useUnsavedChangesGuard(true));

      vi.spyOn(window, "confirm").mockReturnValue(true);
      expect(result.current.confirmDiscard()).toBe(true);

      vi.spyOn(window, "confirm").mockReturnValue(false);
      expect(result.current.confirmDiscard()).toBe(false);
    });

    it("uses the custom message when provided", () => {
      renderHook(() => useUnsavedChangesGuard(true, { message: "Custom warning" }));
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      dispatchClickAndDiscard();
      expect(confirmSpy).toHaveBeenCalledWith("Custom warning");

      function dispatchClickAndDiscard() {
        clickAnchor("/dashboard");
      }
    });
  });

  it("does not throw when act() batches an isDirty flip and a click together", () => {
    const { rerender } = renderHook(
      ({ dirty }) => useUnsavedChangesGuard(dirty),
      { initialProps: { dirty: false } },
    );
    act(() => {
      rerender({ dirty: true });
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    expect(() => clickAnchor("/dashboard")).not.toThrow();
  });
});
