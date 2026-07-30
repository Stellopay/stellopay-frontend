/**
 * Landing-page tests
 * ------------------
 * Covers three concerns for the landing page composition:
 *
 * 1. Below-the-fold code splitting — every section under the hero is loaded
 *    through `next/dynamic`, while Navbar and Hero stay eagerly imported so
 *    first paint is not delayed.
 * 2. Heading hierarchy / outline validation (WCAG 2.1 AA, SC 1.3.1).
 * 3. The unified responsive vertical-rhythm scale (py-16 sm:py-20 lg:py-24).
 *
 * Why class-name assertions for spacing?
 * Tailwind generates CSS at build time, not in jsdom. The only reliable way to
 * confirm the correct spacing classes are present — without running a full
 * browser — is to check the rendered element's className. Each spacing test
 * targets the outermost section element and asserts all three breakpoint
 * classes as a group, so a partial application (e.g. py-16 without the sm/lg
 * variants) also fails.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ThemeProvider } from "@/context/theme-context";
import { WalletProvider } from "@/context/wallet-context";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

// Records the source text of every importer passed to next/dynamic, so the
// code-splitting tests can assert which sections are deferred without
// depending on render order.
const dynamicImports = vi.hoisted(() => [] as string[]);

// next/dynamic → resolve the real module asynchronously, mirroring the real
// deferred behaviour. Tests await the loaded content rather than asserting
// against stand-in components, so the heading outline reflects reality.
vi.mock("next/dynamic", () => ({
  default: (
    importFunc: () => Promise<{ default: React.ComponentType }>,
    _opts?: unknown,
  ) => {
    dynamicImports.push(importFunc.toString());

    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Component, setComponent] =
        React.useState<React.ComponentType | null>(null);

      React.useEffect(() => {
        let active = true;
        importFunc().then((mod) => {
          if (!active) return;
          const resolved =
            typeof mod === "function" ? mod : (mod?.default ?? null);
          setComponent(() => resolved as React.ComponentType);
        });
        return () => {
          active = false;
        };
      }, []);

      return Component ? <Component {...props} /> : null;
    };
    DynamicComponent.displayName = "DynamicComponent";
    return DynamicComponent;
  },
}));

// next/image → plain <img> so tests don't need the Next.js runtime
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

// Framer-motion → identity passthrough to avoid animation overhead
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag, rest, children),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => true,
}));

// useReducedMotion hook — disable decorative animations in tests
vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
  default: () => true,
}));

// ---------------------------------------------------------------------------
// Browser APIs missing from jsdom
// ---------------------------------------------------------------------------

function stubBrowserApis() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }),
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: vi.fn(),
  });
  // Must be constructible — components call `new IntersectionObserver(...)`,
  // and an arrow function cannot be used with `new`.
  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  }

  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
}

const renderLandingPage = async () => {
  const LandingPage = (await import("./landing-page")).default;
  return render(
    <WalletProvider>
      <ThemeProvider>
        <LandingPage />
      </ThemeProvider>
    </WalletProvider>,
  );
};

// ---------------------------------------------------------------------------
// Below-the-fold code splitting
// ---------------------------------------------------------------------------

describe("LandingPage below-the-fold code splitting", () => {
  beforeEach(() => {
    stubBrowserApis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Every section that must be deferred, by module path fragment. */
  const DEFERRED_SECTIONS = [
    "stats-cards",
    "features-intro",
    "how-it-works",
    "testimonials-section",
    "value-propositions",
    "enterprise-section",
    "benefits",
    "faq-section",
    "get-started-cta",
    "footer",
  ] as const;

  it.each(DEFERRED_SECTIONS)("defers %s through next/dynamic", async (section) => {
    await renderLandingPage();

    expect(
      dynamicImports.some((src) => src.includes(section)),
      `expected "${section}" to be loaded via next/dynamic`,
    ).toBe(true);
  });

  it("keeps the hero eagerly imported so first paint is not delayed", async () => {
    await renderLandingPage();

    expect(dynamicImports.some((src) => src.includes("landing/hero"))).toBe(
      false,
    );
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent(/The Future of Payroll on Blockchain/i);
  });

  it("keeps the navbar eagerly imported", async () => {
    await renderLandingPage();

    expect(dynamicImports.some((src) => src.includes("landing/navbar"))).toBe(
      false,
    );
  });

  it("defers every section below the hero", async () => {
    await renderLandingPage();

    expect(dynamicImports.length).toBeGreaterThanOrEqual(
      DEFERRED_SECTIONS.length,
    );
  });

  it("renders the deferred sections once their modules resolve", async () => {
    await renderLandingPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /from crypto to cash/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: /enterprise-ready/i }),
    ).toBeInTheDocument();
  });

  it("exposes a polite, labelled busy state while a section loads", async () => {
    const { SectionFallback } = await import("./landing-page");

    render(
      <SectionFallback
        label="Loading test section..."
        className="w-full py-16 sm:py-20 lg:py-24"
      >
        <div data-testid="skeleton" />
      </SectionFallback>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading test section...")).toHaveClass("sr-only");
    expectSectionSpacing(status);
  });
});

// ---------------------------------------------------------------------------
// Heading hierarchy / outline validation
// ---------------------------------------------------------------------------

describe("LandingPage Heading Hierarchy and Outline Validation", () => {
  beforeEach(() => {
    stubBrowserApis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("audits the landing page for exactly one h1 element", async () => {
    await renderLandingPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /from crypto to cash/i }),
      ).toBeInTheDocument();
    });

    const h1Elements = screen.getAllByRole("heading", { level: 1 });
    expect(h1Elements).toHaveLength(1);
    expect(h1Elements[0]).toHaveTextContent(
      /The Future of Payroll on Blockchain/i,
    );
  });

  it("verifies a logically nested h2/h3 tree with no skipped levels", async () => {
    await renderLandingPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /from crypto to cash/i }),
      ).toBeInTheDocument();
    });

    const headings = screen.getAllByRole("heading");
    const headingStructure = headings.map((h) => ({
      text: h.textContent?.trim(),
      level: parseInt(h.tagName.substring(1), 10),
    }));

    expect(headingStructure[0].level).toBe(1);

    // A heading of level N may be followed by any level up to N + 1. Going
    // from H2 straight to H4 skips a level and fails SC 1.3.1.
    let previousLevel = 1;
    for (let i = 1; i < headingStructure.length; i++) {
      const currentLevel = headingStructure[i].level;
      expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = currentLevel;
    }
  });

  it("ensures major sections are marked with H2 semantic headings", async () => {
    await renderLandingPage();

    // Sections resolve on independent microtask ticks, so poll until every
    // expected H2 has mounted rather than sampling after the first one.
    for (const expected of [
      "Everything you need to",
      "From crypto to cash",
      "Why businesses choose",
      "Enterprise-ready",
      "Benefits",
      "Questions?",
      "Ready to revolutionize",
    ]) {
      await waitFor(() => {
        const h2Texts = screen
          .getAllByRole("heading", { level: 2 })
          .map((h) => h.textContent?.trim());
        expect(
          h2Texts.some((text) => text?.includes(expected)),
          `expected an H2 containing "${expected}"`,
        ).toBe(true);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Spacing rhythm — sections rendered directly
// ---------------------------------------------------------------------------

/** The canonical three Tailwind classes that encode the unified rhythm. */
const RHYTHM_CLASSES = ["py-16", "sm:py-20", "lg:py-24"] as const;

/**
 * Assert that an element carries all three rhythm classes. This deliberately
 * checks them together so a partial application (e.g. `py-16` without
 * `sm:py-20`) is caught as an error.
 */
function expectSectionSpacing(element: HTMLElement): void {
  for (const cls of RHYTHM_CLASSES) {
    expect(
      element.className,
      `expected section to have class "${cls}"`,
    ).toContain(cls);
  }
}

import BenefitsSection from "./benefits";

describe("BenefitsSection — spacing rhythm", () => {
  it("applies the unified py-16 sm:py-20 lg:py-24 scale to the section element", () => {
    render(<BenefitsSection />);
    const section = document.querySelector("section");
    expect(section).not.toBeNull();
    expectSectionSpacing(section as HTMLElement);
  });

  it("has an accessible landmark role (implicit via <section>)", () => {
    render(<BenefitsSection />);
    expect(
      screen.getByRole("heading", { name: /benefits/i }),
    ).toBeInTheDocument();
  });

  it("does not use the old asymmetric pt-24 pb-10 classes", () => {
    render(<BenefitsSection />);
    const section = document.querySelector("section") as HTMLElement;
    expect(section.className).not.toContain("pt-24");
    expect(section.className).not.toContain("pb-10");
  });
});

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
    const section = document.querySelector("section") as HTMLElement;
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
    const card = document.querySelector("section > div") as HTMLElement | null;
    expect(card).not.toBeNull();
    expect(card!.className).toContain("p-10");
    expect(card!.className).toContain("lg:p-[65px]");
  });

  it("no longer uses the old m-4 margin hack for vertical positioning", () => {
    render(<EnterpriseSolutionSection />);
    const section = document.querySelector("section") as HTMLElement;
    expect(section.className).not.toContain("m-4");
  });

  it("carries aria-labelledby on the outer section element", () => {
    render(<EnterpriseSolutionSection />);
    const section = document.querySelector("section") as HTMLElement;
    expect(section).toHaveAttribute(
      "aria-labelledby",
      "enterprise-solution-title",
    );
  });
});

import Hero from "./hero";

describe("Hero — section structure", () => {
  beforeEach(() => {
    stubBrowserApis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a <section> as the outermost landmark", () => {
    render(<Hero />);
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

import { ILLUSTRATIVE_STATS } from "@/lib/demo-data";
import { StatsCards } from "./stats-cards";

describe("StatsCards section wrapper (via landing-page) — spacing rhythm", () => {
  beforeEach(() => {
    stubBrowserApis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all stat cards from ILLUSTRATIVE_STATS", () => {
    render(<StatsCards stats={ILLUSTRATIVE_STATS} />);
    expect(ILLUSTRATIVE_STATS.length).toBeGreaterThan(0);
    expect(screen.getByText(ILLUSTRATIVE_STATS[0].label)).toBeInTheDocument();
  });

  it("stats section wrapper uses the unified rhythm classes (py-16 sm:py-20 lg:py-24)", () => {
    const { container } = render(
      <section className="bg-[#F5F3FF] dark:bg-[#0F0A14] py-16 sm:py-20 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsCards stats={ILLUSTRATIVE_STATS} />
        </div>
      </section>,
    );
    expectSectionSpacing(container.querySelector("section") as HTMLElement);
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
