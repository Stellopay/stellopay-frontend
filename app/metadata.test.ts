import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-local" }),
}));

import { metadata as rootMetadata, viewport as rootViewport } from "@/app/layout";
import { metadata as dashboardMetadata } from "@/app/dashboard/layout";
import { metadata as transactionsMetadata } from "@/app/transactions/layout";
import { metadata as settingsMetadata } from "@/app/settings/preferences/layout";
import { metadata as loginMetadata } from "@/app/auth/login/page";
import { metadata as signUpMetadata } from "@/app/auth/sign-up/page";
import { metadata as verifyEmailMetadata } from "@/app/verify-email/layout";

describe("Route Metadata Exports", () => {
  it("defines standard metadata properties on the root layout", () => {
    expect(rootMetadata).toBeDefined();
    expect(rootMetadata.title).toBeDefined();
    expect(rootMetadata.description).toBeDefined();
    expect(rootMetadata.openGraph).toBeDefined();
    expect(rootMetadata.twitter).toBeDefined();
  });

  it("exports a dedicated viewport object on the root layout", () => {
    expect(rootViewport).toBeDefined();
    expect(rootViewport.themeColor).toBeDefined();
    expect(rootViewport.width).toBe("device-width");
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

  it("exports canonical URLs for dashboard, transactions, and settings routes", () => {
    expect(dashboardMetadata.alternates?.canonical).toBe(
      "https://stellopay.com/dashboard"
    );
    expect(transactionsMetadata.alternates?.canonical).toBe(
      "https://stellopay.com/transactions"
    );
    expect(settingsMetadata.alternates?.canonical).toBe(
      "https://stellopay.com/settings/preferences"
    );
  });

  it("exports Open Graph and Twitter metadata variants with dedicated images", () => {
    const routes = [
      { meta: dashboardMetadata, expectedUrl: "https://stellopay.com/dashboard", expectedImage: "/dashboard-preview.jpg" },
      { meta: transactionsMetadata, expectedUrl: "https://stellopay.com/transactions", expectedImage: "/opengraph-image" },
      { meta: settingsMetadata, expectedUrl: "https://stellopay.com/settings/preferences", expectedImage: "/opengraph-image" },
    ];

    routes.forEach(({ meta, expectedUrl, expectedImage }) => {
      expect(meta.openGraph).toBeDefined();
      expect(meta.openGraph?.url).toBe(expectedUrl);
      expect(meta.openGraph?.siteName).toBe("StelloPay");
      expect(meta.openGraph?.images).toBeDefined();

      const ogImages = meta.openGraph?.images as Array<{ url: string | URL; alt?: string }>;
      expect(ogImages.length).toBeGreaterThan(0);
      expect(String(ogImages[0].url)).toBe(expectedImage);

      expect(meta.twitter).toBeDefined();
      expect(meta.twitter?.card).toBe("summary_large_image");
    });
  });

  it("falls back correctly when optional fields are unset on route metadata", () => {
    // Unset fields like siteName or locale on sub-routes safely inherit root metadata defaults at runtime
    expect(dashboardMetadata.publisher).toBeUndefined();
    expect(dashboardMetadata.keywords).toBeUndefined();
    expect(rootMetadata.siteName).toBeUndefined(); // Defined inside rootMetadata.openGraph
  });
});
