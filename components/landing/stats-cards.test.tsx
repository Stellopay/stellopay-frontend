import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StatCardItem } from "@/types/landing";
import { StatsCards } from "./stats-cards";

const stats: StatCardItem[] = [
  { value: "$2.5B+", label: "Transaction Volume" },
  { value: "150K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "<3s", label: "Transaction Speed" },
];

type IntersectionCallback = ConstructorParameters<
  typeof IntersectionObserver
>[0];

let intersectionCallback: IntersectionCallback;
let animationFrames: FrameRequestCallback[];
let disconnect: ReturnType<typeof vi.fn>;
let observe: ReturnType<typeof vi.fn>;

function valueFor(label: string): Element {
  const labelElement = screen.getByText(label);
  const valueElement = labelElement.previousElementSibling;

  if (!valueElement) throw new Error(`No value found for ${label}`);
  return valueElement;
}

function intersect(isIntersecting: boolean): void {
  act(() => {
    intersectionCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

function runNextFrame(timestamp: number): void {
  const callback = animationFrames.shift();
  if (!callback) throw new Error("No animation frame was scheduled");

  act(() => callback(timestamp));
}

describe("StatsCards", () => {
  beforeEach(() => {
    animationFrames = [];
    disconnect = vi.fn();
    observe = vi.fn();

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        animationFrames.push(callback);
        return animationFrames.length;
      }),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: vi.fn(function IntersectionObserverMock(
        callback: IntersectionCallback,
      ) {
        intersectionCallback = callback;
        return {
          disconnect,
          observe,
          unobserve: vi.fn(),
          takeRecords: vi.fn(),
        };
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts counting only after the cards intersect the viewport", () => {
    render(<StatsCards stats={stats} />);

    expect(observe).toHaveBeenCalledOnce();
    expect(valueFor("Transaction Volume")).toHaveTextContent("$0.0B+");
    expect(valueFor("Active Users")).toHaveTextContent("0K+");
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    intersect(false);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    intersect(true);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(window.requestAnimationFrame).toHaveBeenCalledOnce();

    runNextFrame(0);
    runNextFrame(1_500);

    expect(valueFor("Transaction Volume")).toHaveTextContent("$2.5B+");
    expect(valueFor("Active Users")).toHaveTextContent("150K+");
    expect(valueFor("Uptime")).toHaveTextContent("99.9%");
    expect(valueFor("Transaction Speed")).toHaveTextContent("<3s");
  });

  it("does not restart after repeated intersections", () => {
    render(<StatsCards stats={stats} />);

    intersect(true);
    runNextFrame(0);
    runNextFrame(1_500);

    const requestCount = vi.mocked(window.requestAnimationFrame).mock.calls
      .length;
    intersect(false);
    intersect(true);

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(requestCount);
    expect(valueFor("Transaction Volume")).toHaveTextContent("$2.5B+");
  });

  it("shows final values immediately when reduced motion is preferred", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList);

    render(<StatsCards stats={stats} />);

    expect(valueFor("Transaction Volume")).toHaveTextContent("$2.5B+");
    expect(valueFor("Active Users")).toHaveTextContent("150K+");
    expect(window.IntersectionObserver).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("preserves non-numeric values", () => {
    render(
      <StatsCards stats={[{ value: "Available", label: "Service Status" }]} />,
    );

    expect(valueFor("Service Status")).toHaveTextContent("Available");
  });

  it("starts immediately when IntersectionObserver is unavailable", () => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: undefined,
    });

    const { unmount } = render(<StatsCards stats={stats} />);

    expect(window.requestAnimationFrame).toHaveBeenCalledOnce();
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it("cleans up an observer before an animation has started", () => {
    const { unmount } = render(<StatsCards stats={stats} />);

    unmount();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
  });
});
