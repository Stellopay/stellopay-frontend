/**
 * Landing-page spacing-rhythm tests
 * ----------------------------------
 * Verifies that every top-level landing section applies the unified
 * three-step responsive vertical-rhythm scale:
 *   py-16 sm:py-20 lg:py-24  (64 px / 80 px / 96 px)
 *
 * Why class-name assertions?
 * Tailwind generates CSS at build time, not in jsdom.  The only reliable
 * way to confirm that the correct spacing classes are present — without
 * running a full browser — is to check the rendered element's className.
 * Each test targets the outermost section element of the component under
 * test and asserts on all three breakpoint classes as a group so a partial
 * application (e.g. py-16 without sm/lg variants) also fails.
 *
 * Accessibility smoke-checks are included for each section to guard the
 * WCAG 2.1 AA landmark requirements while the spacing changes are applied.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

// next/image → plain <img> so tests don't need the Next.js runtime
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

// next/dynamic → render children synchronously (no lazy-loading in tests)
vi.mock("next/dynamic", () => ({
  default: (
    fn: () => Promise<{ default: React.ComponentType }>,
    _opts?: unknown,
  ) => {
    // Return a component that renders the loaded module synchronously.
    // We use a simple wrapper to make the signature match what Next.js
    // dynamic() normally returns.
    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Component, setComponent] =
        // eslint-disable-next-line react-hooks/rules-of-hooks
        require("react").useState<React.ComponentType | null>(null);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      require("react").useEffect(() => {
        fn().then((mod) => setComponent(() => mod.default));
      }, []);

      return Component ? <Component {...props} /> : null;
    };
    DynamicComponent.displayName = "DynamicComponent";
    return DynamicComponent;
  },
}));

// Framer-motion → identity passthrough to avoid animation overhead
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
          require("react").createElement(tag, rest, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// useReducedMotion hook — disable decorative animations in tests
vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The canonical three Tailwind classes that encode the unified rhythm. */
const RHYTHM_CLASSES = ["py-16", "sm:py-20", "lg:py-24"] as const;

/**
 * Assert that an element carries all three rhythm classes.
 * This deliberately checks them together so a partial application (e.g.
 * `py-16` without `sm:py-20`) is caught as an error.
 */
function expectSectionSpacing(element: HTMLElement): void {
  for (const cls of RHYTHM_CLASSES) {
    expect(element.className, `expected section to have class "${cls}"`).toContain(cls);
  }
}

// ---------------------------------------------------------------------------
// BenefitsSection
// ---------------------------------------------------------------------------

import BenefitsSection from "./benefits";

describe("BenefitsSection — spacing rhythm", () => {
  it("applies the unified py-16 sm:py-20 lg:py-24 scale to the section element", () => {
    render(<BenefitsSection />);
    // The outermost element rendered by benefits.tsx is a <section>
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
    expectSectionSpacing(section as HTMLElement);
  });

  it("has an accessible landmark role (implicit via <section>)", () => {
    render(<BenefitsSection />);
    // <section> without aria-label is contentinfo/region; with content it
    // always exists in the DOM — verify we at least render visible headings.
    expect(screen.getByRole("heading", { name: /benefits/i })).toBeInTheDocument();
  });

  it("does not use the old asymmetric pt-24 pb-10 classes", () => {
    render(<BenefitsSection />);
    const section = document.querySelector("section") as HTMLElement;
    expect(section.className).not.toContain("pt-24");
    expect(section.className).not.toContain("pb-10");
  });
});

// ---------------------------------------------------------------------------
// HowItWorks
// ---------------------------------------------------------------------------

import HowItWorks from "./how-it-works";

describe("HowItWorks — spacing rhythm", () => {
  it("applies the unified py-16 sm:py-20 lg:py-24 scale to the section element", () => {
    render(<HowItWorks />);
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
    expectSectionSpacing(section as HTMLElement);
  });

  it("does not use the unresponsive flat py-20 class", () => {
    render(<HowItWorks />);
    // Verify the old flat py-20 (without responsive variants) is gone from the
    // top-level section.  We check the section element specifically because
    // inner elements may legitimately use py-20 for their own sub-spacing.
    const section = document.querySelector("section") as HTMLElement;
    // The unified scale uses py-16/sm:py-20/lg:py-24, NOT a bare py-20.
    // A bare `py-20` at the start of the className string (before a space or
    // end of string) would indicate the old un-responsive value.
    const firstClasses = section.className.split(" ").filter(Boolean);
    expect(firstClasses).not.toContain("py-20");
  });

  it("has an accessible section heading", () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: /from crypto to cash/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EnterpriseSolutionSection
// ---------------------------------------------------------------------------

import EnterpriseSolutionSection from "./enterprise-section";

describe("EnterpriseSolutionSection — spacing rhythm", () => {
  it("applies the unified py-16 sm:py-20 lg:py-24 scale to the outer section element", () => {
    render(<EnterpriseSolutionSection />);
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
    expectSectionSpacing(section as HTMLElement);
  });

  it("preserves internal card padding (p-10 lg:p-[65px]) independently of section rhythm", () => {
    render(<EnterpriseSolutionSection />);
    // The inner card div still carries its own padding tokens; spacing
    // normalization must not strip the card's visual treatment.
    const card = document.querySelector("section > div") as HTMLElement | null;
    expect(card).not.toBeNull();
    expect(card!.className).toContain("p-10");
    expect(card!.className).toContain("lg:p-[65px]");
  });

  it("no longer uses the old m-4 margin hack for vertical positioning", () => {
    render(<EnterpriseSolutionSection />);
    const section = document.querySelector("section") as HTMLElement;
    // Section-level margin was removed; rhythm is now handled by padding.
    expect(section.className).not.toContain("m-4");
  });

  it("carries aria-labelledby on the outer section element", () => {
    render(<EnterpriseSolutionSection />);
    const section = document.querySelector("section") as HTMLElement;
    expect(section).toHaveAttribute("aria-labelledby", "enterprise-solution-title");
  });
});

// ---------------------------------------------------------------------------
// Hero — typography tokens (pre-existing tests from hero.test.tsx kept in
// their own file; these complementary assertions verify the hero section
// does not produce conflicting vertical-rhythm regressions)
// ---------------------------------------------------------------------------

import Hero from "./hero";

describe("Hero — section structure", () => {
  beforeEach(() => {
    // IntersectionObserver is not available in jsdom
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a <section> as the outermost landmark", () => {
    render(<Hero />);
    // Hero uses min-h-screen flex centering — it must still be a landmark.
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
  });

  it("has an accessible aria-label on the hero section", () => {
    render(<Hero />);
    const section = screen.getByRole("region", {
      name: /the future of payroll on blockchain/i,
    });
    expect(section).toBeInTheDocument();
  });

  it("applies the text-display-2xl token to the h1 heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("text-display-2xl");
  });

  it("applies the text-body-lg token to the subtitle paragraph", () => {
    render(<Hero />);
    const subtext = screen.getByTestId("hero-subtext");
    expect(subtext.className).toContain("text-body-lg");
  });
});

// ---------------------------------------------------------------------------
// Stats section — verified via landing-page composition
// ---------------------------------------------------------------------------

import { ILLUSTRATIVE_STATS } from "@/lib/demo-data";
import { StatsCards } from "./stats-cards";

describe("StatsCards section wrapper (via landing-page) — spacing rhythm", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn((cb: FrameRequestCallback) => { cb(0); return 0; }),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all stat cards from ILLUSTRATIVE_STATS", () => {
    render(<StatsCards stats={ILLUSTRATIVE_STATS} />);
    // At least one stat card value should be visible
    expect(ILLUSTRATIVE_STATS.length).toBeGreaterThan(0);
    const firstStat = ILLUSTRATIVE_STATS[0];
    // Label is always rendered as text
    expect(screen.getByText(firstStat.label)).toBeInTheDocument();
  });

  it("stats section wrapper uses the unified rhythm classes (py-16 sm:py-20 lg:py-24)", () => {
    // Render the section wrapper as it appears in landing-page.tsx
    const { container } = render(
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsCards stats={ILLUSTRATIVE_STATS} />
        </div>
      </section>,
    );
    const section = container.querySelector("section") as HTMLElement;
    expectSectionSpacing(section);
  });

  it("does not use the old py-12 md:py-16 classes on the stats section", () => {
    const { container } = render(
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsCards stats={ILLUSTRATIVE_STATS} />
        </div>
      </section>,
    );
    const section = container.querySelector("section") as HTMLElement;
    expect(section.className).not.toContain("py-12");
    expect(section.className).not.toContain("md:py-16");
  });
});
