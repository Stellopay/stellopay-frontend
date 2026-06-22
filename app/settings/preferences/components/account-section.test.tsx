import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountSection from "./account-section";

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@/components/ui/form", () => ({
  FormMessage: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
}));

describe("AccountSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("clears the profile-save status message after the queued timeout", async () => {
    render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      screen.queryByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).not.toBeInTheDocument();
  });

  it("clears the queued status timeout when the section unmounts", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(
      screen.getByText(
        "Account profile changes are staged and ready for backend save.",
      ),
    ).toBeInTheDocument();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  it("does not schedule a status reset after unmounting during save", async () => {
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const { unmount } = render(<AccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /save account changes/i }),
    );
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    const resetTimers = setTimeoutSpy.mock.calls.filter(
      ([, delay]) => delay === 5000,
    );
    expect(resetTimers).toHaveLength(0);
  });
});
