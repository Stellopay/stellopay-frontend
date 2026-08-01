/**
 * @file components/landing/benefits.test.tsx
 *
 * Unit tests for the BenefitsSection component.
 *
 * Coverage targets
 * ────────────────
 * 1. Structural rendering — section, heading, subtitle, all cards present
 * 2. Design token usage — no hardcoded hex values; CSS custom properties used
 * 3. Accessibility — ARIA attributes, landmark roles, aria-hidden on decorative elements
 * 4. Content fidelity — correct titles and descriptions for every benefit
 * 5. Featured vs. non-featured card differentiation
 * 6. Card key stability — no index-based keys
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BenefitsSection from "./benefits";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convenience — fetch an element by data-testid. */
function getByTestId(testId: string): HTMLElement {
  return screen.getByTestId(testId);
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("BenefitsSection", () => {
  // ── 1. Structural rendering ──────────────────────────────────────────────

  it("renders a <section> landmark", () => {
    render(<BenefitsSection />);
    const section = screen.getByRole("region", { name: /benefits/i });
    expect(section).toBeDefined();
  });

  it("renders the section heading as an <h2>", () => {
    render(<BenefitsSection />);
    const heading = screen.getByRole("heading", { level: 2, name: /benefits/i });
    expect(heading).toBeDefined();
    expect(heading).toHaveAttribute("id", "benefits-heading");
  });

  it("renders the subtitle paragraph", () => {
    render(<BenefitsSection />);
    const subtitle = getByTestId("benefits-subtitle");
    expect(subtitle.tagName.toLowerCase()).toBe("p");
    expect(subtitle.textContent).toContain("seamless platform");
  });

  it("renders the featured card (Low Fees)", () => {
    render(<BenefitsSection />);
    const card = getByTestId("benefits-featured-card");
    expect(card).toBeDefined();
    expect(within(card).getByRole("heading", { level: 3, name: /low fees/i })).toBeDefined();
  });

  it("renders both non-featured cards", () => {
    render(<BenefitsSection />);
    const grid = getByTestId("benefits-secondary-cards");
    const cards = within(grid).getAllByRole("heading", { level: 3 });
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toMatch(/ease of use/i);
    expect(cards[1].textContent).toMatch(/reliable customer support/i);
  });

  it("renders all three benefit descriptions", () => {
    render(<BenefitsSection />);

    expect(
      screen.getByText(/reduce payroll costs with blockchain-powered transactions/i),
    ).toBeDefined();
    expect(
      screen.getByText(/our intuitive platform simplifies payroll management/i),
    ).toBeDefined();
    expect(
      screen.getByText(/get dedicated assistance whenever you need it/i),
    ).toBeDefined();
  });

  // ── 2. Design token usage (no hardcoded hex) ─────────────────────────────

  it("uses --color-surface-deep token for section background (no hardcoded #040404)", () => {
    render(<BenefitsSection />);
    const section = getByTestId("benefits-section");

    // Must reference the CSS custom property
    expect(section.style.backgroundColor).toBe("var(--color-surface-deep)");

    // Must NOT contain the raw hex value anywhere in the inline style
    expect(section.getAttribute("style")).not.toContain("#040404");
  });

  it("uses --color-brand-card token for the featured card background", () => {
    render(<BenefitsSection />);
    const card = getByTestId("benefits-featured-card");

    expect(card.style.backgroundColor).toBe("var(--color-brand-card)");
    expect(card.getAttribute("style")).not.toContain("#8EB6FF");
    expect(card.getAttribute("style")).not.toContain("#8eb6ff");
  });

  it("uses --color-brand-border token for non-featured card borders", () => {
    render(<BenefitsSection />);
    const grid = getByTestId("benefits-secondary-cards");

    // Both secondary cards live inside the grid
    const cardEase = getByTestId("benefits-card-ease-of-use");
    const cardSupport = getByTestId("benefits-card-reliable-customer-support");

    for (const card of [cardEase, cardSupport]) {
      expect(card.getAttribute("style")).toContain("var(--color-brand-border)");
      expect(card.getAttribute("style")).not.toContain("#598EFF");
      expect(card.getAttribute("style")).not.toContain("#598eff");
    }

    // Silence the "unused variable" lint warning
    void grid;
  });

  it("uses --color-brand-glow token in the glow overlay (no hardcoded rgba)", () => {
    render(<BenefitsSection />);
    const overlay = getByTestId("benefits-glow-overlay");
    const bgStyle = overlay.getAttribute("style") ?? "";

    // Must use the CSS custom property
    expect(bgStyle).toContain("var(--color-brand-glow)");

    // Must NOT reference the raw RGB triple without the token
    expect(bgStyle).not.toMatch(/rgba?\(\s*27\s*,\s*67\s*,\s*245/);
    // The raw hex form should also be absent
    expect(bgStyle).not.toContain("#1B43F5");
    expect(bgStyle).not.toContain("#1b43f5");
  });

  it("applies text-muted-foreground to subtitle (no hardcoded #C7C7C7)", () => {
    render(<BenefitsSection />);
    const subtitle = getByTestId("benefits-subtitle");

    // Tailwind class must be present
    expect(subtitle.className).toContain("text-muted-foreground");

    // Raw hex must be absent from inline style and className
    expect(subtitle.getAttribute("style") ?? "").not.toContain("#C7C7C7");
    expect(subtitle.className).not.toContain("#C7C7C7");
  });

  it("applies text-foreground to featured card heading (no hardcoded #060606)", () => {
    render(<BenefitsSection />);
    const heading = getByTestId("benefits-featured-card-title");

    expect(heading.className).toContain("text-foreground");
    expect(heading.getAttribute("style") ?? "").not.toContain("#060606");
    expect(heading.className).not.toContain("#060606");
  });

  it("applies text-foreground to featured card body (no hardcoded #212121)", () => {
    render(<BenefitsSection />);
    const body = getByTestId("benefits-featured-card-body");

    expect(body.className).toContain("text-foreground");
    expect(body.getAttribute("style") ?? "").not.toContain("#212121");
    expect(body.className).not.toContain("#212121");
  });

  it("applies text-muted-foreground to non-featured card bodies (no hardcoded #A3A3A3)", () => {
    render(<BenefitsSection />);

    const easeBody = getByTestId("benefits-card-body-ease-of-use");
    const supportBody = getByTestId(
      "benefits-card-body-reliable-customer-support",
    );

    for (const el of [easeBody, supportBody]) {
      expect(el.className).toContain("text-muted-foreground");
      expect(el.getAttribute("style") ?? "").not.toContain("#A3A3A3");
      expect(el.className).not.toContain("#A3A3A3");
    }
  });

  // ── 3. Accessibility ──────────────────────────────────────────────────────

  it("the section has aria-labelledby pointing to the heading id", () => {
    render(<BenefitsSection />);
    const section = getByTestId("benefits-section");

    expect(section).toHaveAttribute("aria-labelledby", "benefits-heading");
  });

  it("the glow overlay is aria-hidden (decorative)", () => {
    render(<BenefitsSection />);
    const overlay = getByTestId("benefits-glow-overlay");

    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("decorative icons inside the featured card are aria-hidden", () => {
    render(<BenefitsSection />);
    const card = getByTestId("benefits-featured-card");

    // SVG icons rendered by lucide-react; find all SVGs inside the card
    const svgs = card.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("non-featured card icons are aria-hidden (decorative)", () => {
    render(<BenefitsSection />);
    const grid = getByTestId("benefits-secondary-cards");
    const svgs = grid.querySelectorAll("svg");

    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("all benefit card headings are <h3>", () => {
    render(<BenefitsSection />);

    const featuredTitle = getByTestId("benefits-featured-card-title");
    expect(featuredTitle.tagName.toLowerCase()).toBe("h3");

    const easeTitle = getByTestId("benefits-card-title-ease-of-use");
    expect(easeTitle.tagName.toLowerCase()).toBe("h3");

    const supportTitle = getByTestId(
      "benefits-card-title-reliable-customer-support",
    );
    expect(supportTitle.tagName.toLowerCase()).toBe("h3");
  });

  // ── 4. Featured vs. non-featured differentiation ─────────────────────────

  it("featured card has the brand-card background token, not a border", () => {
    render(<BenefitsSection />);
    const card = getByTestId("benefits-featured-card");

    // Has the card background token
    expect(card.style.backgroundColor).toBe("var(--color-brand-card)");

    // Does NOT have a brand-border inline style
    expect(card.getAttribute("style") ?? "").not.toContain(
      "var(--color-brand-border)",
    );
  });

  it("non-featured cards have the brand-border token, not the card bg", () => {
    render(<BenefitsSection />);
    const easeCard = getByTestId("benefits-card-ease-of-use");
    const supportCard = getByTestId("benefits-card-reliable-customer-support");

    for (const card of [easeCard, supportCard]) {
      expect(card.getAttribute("style")).toContain("var(--color-brand-border)");
      // Must not use the featured card background
      expect(card.style.backgroundColor).not.toBe("var(--color-brand-card)");
    }
  });

  it("featured card heading uses text-foreground (dark on light card)", () => {
    render(<BenefitsSection />);
    const heading = getByTestId("benefits-featured-card-title");
    expect(heading.className).toContain("text-foreground");
  });

  it("non-featured card headings use text-white (light on dark section)", () => {
    render(<BenefitsSection />);
    const easeTitle = getByTestId("benefits-card-title-ease-of-use");
    const supportTitle = getByTestId(
      "benefits-card-title-reliable-customer-support",
    );

    expect(easeTitle.className).toContain("text-white");
    expect(supportTitle.className).toContain("text-white");
  });

  // ── 5. Data-testid completeness ───────────────────────────────────────────

  it("exposes all expected data-testid anchors for QA and E2E targeting", () => {
    render(<BenefitsSection />);

    const expectedIds = [
      "benefits-section",
      "benefits-glow-overlay",
      "benefits-heading",
      "benefits-subtitle",
      "benefits-card-grid",
      "benefits-featured-card",
      "benefits-featured-card-title",
      "benefits-featured-card-body",
      "benefits-secondary-cards",
      "benefits-card-ease-of-use",
      "benefits-card-reliable-customer-support",
      "benefits-card-title-ease-of-use",
      "benefits-card-title-reliable-customer-support",
      "benefits-card-body-ease-of-use",
      "benefits-card-body-reliable-customer-support",
    ];

    for (const id of expectedIds) {
      expect(
        screen.getByTestId(id),
        `Expected data-testid="${id}" to exist in the DOM`,
      ).toBeDefined();
    }
  });

  // ── 6. Card count ─────────────────────────────────────────────────────────

  it("renders exactly three benefit cards in total", () => {
    render(<BenefitsSection />);
    const allHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(allHeadings).toHaveLength(3);
  });

  it("renders the featured card above the secondary card grid", () => {
    render(<BenefitsSection />);
    const featured = getByTestId("benefits-featured-card");
    const grid = getByTestId("benefits-secondary-cards");

    // In DOM order, the featured card comes before the grid
    const position = featured.compareDocumentPosition(grid);
    // DOCUMENT_POSITION_FOLLOWING means grid comes after featured
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
