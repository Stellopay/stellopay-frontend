import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import LandingPage from "./landing-page";
import { ThemeProvider } from "@/context/theme-context";
import { WalletProvider } from "@/context/wallet-context";

vi.mock("next/dynamic", () => {
  return {
    default: (importFunc: any) => {
      const fnStr = importFunc.toString();
      if (fnStr.includes("how-it-works")) {
        return function DummyHowItWorks() {
          return (
            <section>
              <h2>From crypto to cash — <span className="text-transparent">in just three steps</span></h2>
              <h3>Connect Your Wallet</h3>
              <h3>Make Crypto Payments</h3>
              <h3>Receive in Naira</h3>
            </section>
          );
        };
      }
      if (fnStr.includes("enterprise-section")) {
        return function DummyEnterprise() {
          return (
            <section aria-labelledby="enterprise-solution-title" aria-describedby="enterprise-solution-desc">
              <h2 id="enterprise-solution-title">
                Enterprise-ready <br />
                <span>blockchain solution</span>
              </h2>
              <p id="enterprise-solution-desc">StelloPay is built for scale.</p>
            </section>
          );
        };
      }
      if (fnStr.includes("faq-section")) {
        return function DummyFAQ() {
          return (
            <section>
              <h2>
                Have any <span>Questions?</span> We&apos;ve Got Your Answers
              </h2>
              <h3>Do I need a crypto wallet?</h3>
              <h3>What are the supported currencies?</h3>
            </section>
          );
        };
      }
      return () => <div data-testid="fallback-mock" />;
    },
  };
});

describe("LandingPage Heading Hierarchy and Outline Validation", () => {
  it("audits the landing page for exactly one h1 element", () => {
    render(
      <WalletProvider>
        <ThemeProvider>
          <LandingPage />
        </ThemeProvider>
      </WalletProvider>
    );
    const h1Elements = screen.getAllByRole("heading", { level: 1 });
    expect(h1Elements).toHaveLength(1);
    expect(h1Elements[0]).toHaveTextContent(/The Future of Payroll on Blockchain/i);
  });

  it("verifies a logically nested h2/h3 tree with no skipped levels", () => {
    render(
      <WalletProvider>
        <ThemeProvider>
          <LandingPage />
        </ThemeProvider>
      </WalletProvider>
    );
    
    // Query all elements with a heading role
    const headings = screen.getAllByRole("heading");
    
    // Extract heading levels in order of document appearance
    const headingStructure = headings.map((h) => ({
      text: h.textContent?.trim(),
      level: parseInt(h.tagName.substring(1), 10),
    }));

    // Output structure in test logs for audit visibility
    console.log("Audited Heading Outline:", headingStructure);

    // Assert that the first heading is the H1
    expect(headingStructure[0].level).toBe(1);

    // Verify there are no skipped levels.
    // A heading of level N can be followed by any level up to N + 1.
    // For example, an H2 can be followed by an H3 (nesting down), or another H2 (same level),
    // or an H1 (if another main part begins, though here we only have one H1), but NOT an H4.
    let previousLevel = 1;
    for (let i = 1; i < headingStructure.length; i++) {
      const currentLevel = headingStructure[i].level;
      
      // Ensure we do not skip levels downwards (e.g. from H1 directly to H3, or H2 to H4)
      expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      
      previousLevel = currentLevel;
    }
  });

  it("ensures major sections are marked with H2 semantic headings", () => {
    render(
      <WalletProvider>
        <ThemeProvider>
          <LandingPage />
        </ThemeProvider>
      </WalletProvider>
    );
    
    // All top-level landing page sections must use H2
    const h2Headings = screen.getAllByRole("heading", { level: 2 });
    const h2Texts = h2Headings.map(h => h.textContent?.trim());

    expect(h2Texts.some(text => text?.includes("Everything you need to"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("From crypto to cash"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("Why businesses choose"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("Enterprise-ready"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("Benefits"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("Questions?"))).toBe(true);
    expect(h2Texts.some(text => text?.includes("Ready to revolutionize"))).toBe(true);
  });
});
