import { render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const matchMediaMatches = vi.hoisted(() => ({ value: false }));
const motionDivCalls = vi.hoisted(() => ({ calls: [] as any[] }));

vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(
      ({
        variants,
        initial,
        whileInView,
        viewport,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        variants?: unknown;
        initial?: unknown;
        whileInView?: unknown;
        viewport?: unknown;
      }) => {
        motionDivCalls.calls.push({ variants, initial, whileInView, viewport });
        return <div {...props} />;
      },
    ),
  },
}));

import HowItWorks from "./how-it-works";

describe("HowItWorks", () => {
  beforeEach(() => {
    matchMediaMatches.value = false;
    motionDivCalls.calls = [];
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchMediaMatches.value,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all three steps with their titles", () => {
    render(<HowItWorks />);

    expect(screen.getByText("Connect Your Wallet")).toBeInTheDocument();
    expect(screen.getByText("Make Crypto Payments")).toBeInTheDocument();
    expect(screen.getByText("Receive in Naira")).toBeInTheDocument();
  });

  it("renders all step numbers", () => {
    render(<HowItWorks />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("renders the metrics section with all four metrics", () => {
    render(<HowItWorks />);

    expect(screen.getByText("$2.5B+")).toBeInTheDocument();
    expect(screen.getByText("150K+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("<3s")).toBeInTheDocument();
  });

  it("passes opacity-only variants to motion.div when prefers-reduced-motion is set", () => {
    matchMediaMatches.value = true;

    render(<HowItWorks />);

    // useReducedMotion starts as false and updates after the effect fires,
    // so motion.div renders 3× on initial render + 3× on re-render = 6 total.
    // Check only the final render (last 3 calls) for the correct variants.
    const stepCalls = motionDivCalls.calls.slice(-3);

    stepCalls.forEach((call) => {
      const { variants } = call;
      expect(variants).toBeDefined();
      // Reduced-motion variants: hidden has no y transform, visible has no y transform
      expect(variants.hidden).not.toHaveProperty("y");
      expect(variants.visible).not.toHaveProperty("y");
      // Both variants should still have opacity
      expect(variants.hidden).toHaveProperty("opacity", 0);
      expect(variants.visible).toHaveProperty("opacity", 1);
    });
  });

  it("passes animated variants with y-transform to motion.div when reduced motion is not preferred", () => {
    matchMediaMatches.value = false;

    render(<HowItWorks />);

    // When matchMedia returns false (same as initial state), React bails out
    // of the re-render, so we get exactly 3 calls.
    expect(motionDivCalls.calls).toHaveLength(3);

    motionDivCalls.calls.forEach((call) => {
      const { variants } = call;
      expect(variants).toBeDefined();
      // Normal variants: hidden has y transform, visible has y transform back to 0
      expect(variants.hidden).toHaveProperty("y", 40);
      expect(variants.visible).toHaveProperty("y", 0);
      expect(variants.visible).toHaveProperty("opacity", 1);
    });
  });

  it("passes viewport once:true and initial:hidden to every motion.div", () => {
    render(<HowItWorks />);

    const stepCalls = motionDivCalls.calls.slice(-3);

    stepCalls.forEach((call) => {
      expect(call.initial).toBe("hidden");
      expect(call.whileInView).toBe("visible");
      expect(call.viewport).toEqual({ once: true, amount: 0.2 });
    });
  });

  it("renders the correct dark mode background classes", () => {
    matchMediaMatches.value = false;

    const { container } = render(<HowItWorks />);

    const section = container.querySelector("section");
    expect(section).toHaveClass("dark:bg-[#181818]");
  });
});
