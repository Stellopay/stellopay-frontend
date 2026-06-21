import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountSection from "@/app/settings/preferences/components/account-section";

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img alt={alt} src={String(src)} {...props} />
  ),
}));

describe("AccountSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not update state after unmounting during a pending save", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { unmount } = render(<AccountSection />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save account changes/i }),
      );
    });
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6500);
    });

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("clears the status message after five seconds", async () => {
    render(<AccountSection />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save account changes/i }),
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(
      screen.getByText(/account profile changes are staged/i),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(
      screen.queryByText(/account profile changes are staged/i),
    ).not.toBeInTheDocument();
  });

  it("resets the prior status timer on consecutive saves", async () => {
    render(<AccountSection />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save account changes/i }),
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save account changes/i }),
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });
    expect(
      screen.getByText(/account profile changes are staged/i),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(
      screen.queryByText(/account profile changes are staged/i),
    ).not.toBeInTheDocument();
  });
});
