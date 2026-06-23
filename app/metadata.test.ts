import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-local" }),
}));

import { metadata as rootMetadata } from "@/app/layout";
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

  it("each route exports unique page titles and descriptions", () => {
    const titles = [
      typeof rootMetadata.title === "object" && rootMetadata.title !== null && "default" in rootMetadata.title
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
      const titleStr = typeof meta.title === "string" ? meta.title : JSON.stringify(meta.title);
      const descStr = meta.description || "";

      // Ensure no dynamically interpolated session/user tags exist in static metadata text
      expect(titleStr).not.toContain("${");
      expect(descStr).not.toContain("${");
    });
  });
});
