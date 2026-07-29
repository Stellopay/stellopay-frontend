import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OfflineBanner } from "./offline-banner";

/**
 * Helper: dispatch a window event and flush React state updates.
 *
 * NOTE: this helper uses real microtask flushing and is NOT compatible with
 * `vi.useFakeTimers()`. Tests that need fake timers should dispatch events
 * directly in `act()` blocks.
 */
async function dispatchWindowEvent(type: string) {
  act(() => {
    window.dispatchEvent(new Event(type));
  });
  // Allow React effects / state updates to flush.
  await vi.waitFor(() => {
    /* empty – just flush the microtask queue */
  });
}

describe("OfflineBanner", () => {
  let onlineSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onlineSpy = vi
      .spyOn(navigator, "onLine", "get")
      .mockReturnValue(true);
  });

  afterEach(() => {
    onlineSpy.mockRestore();
    vi.useRealTimers();
  });

  // ------------------------------------------------------------------
  // Happy path – online
  // ------------------------------------------------------------------

  it("renders nothing when the browser is online", () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  // ------------------------------------------------------------------
  // Offline detection
  // ------------------------------------------------------------------

  it("shows the offline banner when navigator.onLine is false on mount", () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineBanner />);

    expect(
      screen.getByText(/you are currently offline/i),
    ).toBeInTheDocument();
  });

  it("shows the offline banner after an offline event is dispatched", async () => {
    render(<OfflineBanner />);

    await dispatchWindowEvent("offline");

    expect(
      screen.getByText(/you are currently offline/i),
    ).toBeInTheDocument();
  });

  it("uses role=alert and aria-live=assertive for assistive technology", async () => {
    render(<OfflineBanner />);
    await dispatchWindowEvent("offline");

    const banner = screen.getByRole("alert");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("aria-live", "assertive");
  });

  // ------------------------------------------------------------------
  // Dismiss behaviour
  // ------------------------------------------------------------------

  it("dismisses the offline banner when the close button is clicked", async () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineBanner />);

    const dismissButton = screen.getByLabelText(
      "Dismiss offline notification",
    );
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/you are currently offline/i),
      ).not.toBeInTheDocument();
    });
  });

  it("reappears after dismissal when another offline event fires", async () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineBanner />);

    // Dismiss.
    fireEvent.click(
      screen.getByLabelText("Dismiss offline notification"),
    );
    await waitFor(() => {
      expect(
        screen.queryByText(/you are currently offline/i),
      ).not.toBeInTheDocument();
    });

    // Simulate coming online then offline again.
    await dispatchWindowEvent("online");
    await dispatchWindowEvent("offline");

    expect(
      screen.getByText(/you are currently offline/i),
    ).toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Reconnection success state
  // ------------------------------------------------------------------

  it("shows a reconnected success state after an online event", async () => {
    render(<OfflineBanner />);
    await dispatchWindowEvent("offline");
    await dispatchWindowEvent("online");

    expect(
      screen.getByText(/your internet connection was restored/i),
    ).toBeInTheDocument();
  });

  it("does not show a dismiss button in the reconnected state", async () => {
    render(<OfflineBanner />);
    await dispatchWindowEvent("offline");
    await dispatchWindowEvent("online");

    expect(
      screen.queryByLabelText("Dismiss offline notification"),
    ).not.toBeInTheDocument();
  });

  it("auto-dismisses the reconnected state after the timeout", () => {
    vi.useFakeTimers();
    render(<OfflineBanner />);

    // Dispatch offline → online synchronously inside act.
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(
      screen.getByText(/your internet connection was restored/i),
    ).toBeInTheDocument();

    // Advance the auto-dismiss timer past 3 000 ms.
    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    // After advancing, the reconnected state should be gone synchronously.
    expect(
      screen.queryByText(/your internet connection was restored/i),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  // ------------------------------------------------------------------
  // Edge cases
  // ------------------------------------------------------------------

  it("clears the reconnected state when going offline again", async () => {
    render(<OfflineBanner />);
    await dispatchWindowEvent("offline");
    await dispatchWindowEvent("online");

    expect(
      screen.getByText(/your internet connection was restored/i),
    ).toBeInTheDocument();

    await dispatchWindowEvent("offline");

    // Reconnected message should be gone; offline message should appear.
    expect(
      screen.queryByText(/your internet connection was restored/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/you are currently offline/i),
    ).toBeInTheDocument();
  });

  it("respects a pre-existing offline state on mount", () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineBanner />);

    const banner = screen.getByRole("alert");
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain("offline");
  });

  it("renders decorative icons with aria-hidden", async () => {
    onlineSpy.mockReturnValue(false);
    render(<OfflineBanner />);

    // WifiOff icon should be marked as decorative.
    const icon = document.querySelector(".lucide-wifi-off");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<OfflineBanner />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  // ------------------------------------------------------------------
  // Negative test – no false positives
  // ------------------------------------------------------------------

  it("does NOT show the banner when online events fire on an already-online browser", async () => {
    render(<OfflineBanner />);

    await dispatchWindowEvent("online");

    // Should not render the reconnected message because we never went offline.
    expect(
      screen.queryByText(/your internet connection was restored/i),
    ).not.toBeInTheDocument();
  });
});
