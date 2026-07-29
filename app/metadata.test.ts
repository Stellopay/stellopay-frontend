import { describe, expect, it, vi } from "vitest";

const { mockLocalFont } = vi.hoisted(() => ({
  mockLocalFont: vi.fn(() => ({ variable: "font-local" })),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: mockLocalFont,
}));

import {
  metadata as rootMetadata,
  viewport as rootViewport,
} from "@/app/layout";
import sitemap, { BASE_URL, PUBLIC_ROUTES } from "@/app/sitemap";
import robots, { DISALLOWED_PATHS } from "@/app/robots";
import { metadata as dashboardMetadata } from "@/app/dashboard/layout";
import { metadata as transactionsMetadata } from "@/app/transactions/layout";
import { metadata as settingsMetadata } from "@/app/settings/preferences/layout";
import { metadata as loginMetadata } from "@/app/auth/login/page";
import { metadata as signUpMetadata } from "@/app/auth/sign-up/page";
import { metadata as verifyEmailMetadata } from "@/app/verify-email/layout";
import { landingStructuredData } from "@/app/structured-data";

describe("Route Metadata Exports", () => {
  it("defines standard metadata properties on the root layout", () => {
    expect(rootMetadata).toBeDefined();
    expect(rootMetadata.title).toBeDefined();
    expect(rootMetadata.description).toBeDefined();
    expect(rootMetadata.openGraph).toBeDefined();
    expect(rootMetadata.twitter).toBeDefined();
    expect(rootMetadata.manifest).toBe("/manifest.json");
  });

  it("exports a dedicated viewport object on the root layout", () => {
    expect(rootViewport).toBeDefined();
    expect(rootViewport.themeColor).toBeDefined();
    expect(rootViewport.width).toBe("device-width");
  });

  it("preloads above-the-fold local fonts and uses swap to avoid FOIT", () => {
    const localFonts = mockLocalFont.mock.calls.map(([options]) => options);

    expect(localFonts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "../public/font/clash-display-variable.ttf",
          variable: "--font-clash",
          display: "swap",
          preload: true,
        }),
        expect.objectContaining({
          src: "../public/font/general-sans-variable.ttf",
          // Matches the body typography token in app/globals.css.
          variable: "--font-general-sans",
          display: "swap",
          preload: true,
        }),
      ]),
    );
  });

  it("each route exports unique page titles and descriptions", () => {
    const titles = [
      typeof rootMetadata.title === "object" &&
      rootMetadata.title !== null &&
      "default" in rootMetadata.title
        ? rootMetadata.title.default
        : rootMetadata.title,
      dashboardMetadata.title,
      transactionsMetadata.title,
      settingsMetadata.title,
      loginMetadata.title,
      signUpMetadata.title,
      verifyEmailMetadata.title,
    ];

    const descriptions = [
      rootMetadata.description,
      dashboardMetadata.description,
      transactionsMetadata.description,
      settingsMetadata.description,
      loginMetadata.description,
      signUpMetadata.description,
      verifyEmailMetadata.description,
    ];

    // Assert titles are unique and defined
    titles.forEach((title) => {
      expect(title).toBeDefined();
      expect(typeof title).toBe("string");
    });
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);

    // Assert descriptions are unique and defined
    descriptions.forEach((desc) => {
      expect(desc).toBeDefined();
      expect(typeof desc).toBe("string");
    });
    const uniqueDescriptions = new Set(descriptions);
    expect(uniqueDescriptions.size).toBe(descriptions.length);
  });

  it("applies noindex robots tags to private or sensitive authenticated routes", () => {
    // Dashboard, Transactions, Settings, and Verify Email routes should have robots noindex/nofollow
    const privateMetadata = [
      dashboardMetadata,
      transactionsMetadata,
      settingsMetadata,
      verifyEmailMetadata,
    ];

    privateMetadata.forEach((meta) => {
      expect(meta.robots).toBeDefined();
      expect(meta.robots).toEqual({
        index: false,
        follow: false,
      });
    });
  });

  it("ensures public route metadata does not place user or account data in titles or descriptions", () => {
    const allMetadata = [
      rootMetadata,
      dashboardMetadata,
      transactionsMetadata,
      settingsMetadata,
      loginMetadata,
      signUpMetadata,
      verifyEmailMetadata,
    ];

    allMetadata.forEach((meta) => {
      const titleStr =
        typeof meta.title === "string"
          ? meta.title
          : JSON.stringify(meta.title);
      const descStr = meta.description || "";

      // Ensure no dynamically interpolated session/user tags exist in static metadata text
      expect(titleStr).not.toContain("${");
      expect(descStr).not.toContain("${");
    });
  });

  describe("Landing Page JSON-LD Structured Data", () => {
    it("exports a valid structured data object with @graph", () => {
      expect(landingStructuredData).toBeDefined();
      expect(landingStructuredData).toHaveProperty(
        "@context",
        "https://schema.org",
      );
      expect(landingStructuredData).toHaveProperty("@graph");
    });

    it("@graph contains exactly three schema.org entities", () => {
      const { "@graph": graph } = landingStructuredData;
      expect(Array.isArray(graph)).toBe(true);
      expect(graph).toHaveLength(3);
    });

    it("includes an Organization entity with required properties", () => {
      const org = landingStructuredData["@graph"].find(
        (item: Record<string, unknown>) => item["@type"] === "Organization",
      );
      expect(org).toBeDefined();
      expect(org).toHaveProperty("name", "StelloPay");
      expect(org).toHaveProperty("url", "https://stellopay.com");
      expect(org).toHaveProperty("logo");
      expect(org).toHaveProperty("description");
      expect(org).toHaveProperty("sameAs");
      expect(Array.isArray(org!.sameAs)).toBe(true);
    });

    it("includes a WebSite entity with SearchAction", () => {
      const site = landingStructuredData["@graph"].find(
        (item: Record<string, unknown>) => item["@type"] === "WebSite",
      );
      expect(site).toBeDefined();
      expect(site).toHaveProperty("name", "StelloPay");
      expect(site).toHaveProperty("url", "https://stellopay.com");
      expect(site).toHaveProperty("potentialAction");
      expect(
        (site!.potentialAction as Record<string, unknown>)["@type"],
      ).toBe("SearchAction");
    });

    it("includes a WebApplication entity with required SoftwareApplication properties", () => {
      const app = landingStructuredData["@graph"].find(
        (item: Record<string, unknown>) => {
          const types = item["@type"];
          return (
            Array.isArray(types) &&
            types.includes("WebApplication") &&
            types.includes("SoftwareApplication")
          );
        },
      );
      expect(app).toBeDefined();
      expect(app).toHaveProperty("name", "StelloPay");
      expect(app).toHaveProperty("url", "https://stellopay.com");
      expect(app).toHaveProperty("applicationCategory", "FinanceApplication");
      expect(app).toHaveProperty("operatingSystem", "Web");
      expect(app).toHaveProperty("description");
      expect(app).toHaveProperty("offers");
      expect(app).toHaveProperty("provider");
    });

    it("WebApplication offers freemium pricing data", () => {
      const app = landingStructuredData["@graph"].find(
        (item: Record<string, unknown>) =>
          Array.isArray(item["@type"]) &&
          item["@type"].includes("WebApplication"),
      );
      const offers = app!.offers as Record<string, unknown>;
      expect(offers).toHaveProperty("@type", "Offer");
      expect(offers).toHaveProperty("price", "0");
      expect(offers).toHaveProperty("priceCurrency", "USD");
    });

    it("JSON-LD does not contain sensitive or PII data", () => {
      const json = JSON.stringify(landingStructuredData);
      // No Stellar secret keys (S-prefixed base32)
      expect(json).not.toMatch(/\bS[A-Z2-7]{55}\b/);
      // No template interpolation artifacts
      expect(json).not.toContain("${");
    });

    it("all URLs in structured data use HTTPS", () => {
      const json = JSON.stringify(landingStructuredData);
      const urls = json.match(/"https?:\/\/[^"]+"/g) || [];
      expect(urls.length).toBeGreaterThan(0);
      urls.forEach((url: string) => {
        expect(url).toMatch(/^"https:\/\//);
      });
    });
  });
});
