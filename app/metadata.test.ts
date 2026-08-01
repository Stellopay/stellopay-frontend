import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-local" }),
}));

import {
  metadata as rootMetadata,
  viewport as rootViewport,
} from "@/app/layout";
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

  // ── Design Token Migration Matrix ────────────────────────────────────────────

  it("design-token migration matrix document exists and is non-empty", () => {
    const matrixPath = resolve(
      __dirname,
      "../design/token-migration-matrix.md",
    );
    const content = readFileSync(matrixPath, "utf-8");
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain("# Design Token Migration Matrix");
    expect(content).toContain("Migration Status Overview");
  });

  it("design-token migration matrix covers all major component categories", () => {
    const matrixPath = resolve(
      __dirname,
      "../design/token-migration-matrix.md",
    );
    const content = readFileSync(matrixPath, "utf-8");

    // Verify each priority tier is represented
    expect(content).toContain("High");
    expect(content).toContain("Medium");
    expect(content).toContain("Low");

    // Verify status indicators are present
    expect(content).toContain("Done");
    expect(content).toContain("In Progress");
    expect(content).toContain("Not Started");
  });

  it("design-token migration matrix prioritizes landing and dashboard surfaces", () => {
    const matrixPath = resolve(
      __dirname,
      "../design/token-migration-matrix.md",
    );
    const content = readFileSync(matrixPath, "utf-8");

    expect(content).toContain("Landing Hero");
    expect(content).toContain("Dashboard Account Summary");
    expect(content).toContain("Settings Preferences");
    expect(content).toContain("https://github.com/stellopay/frontend/issues/");
  });

  it("design-token migration matrix inventories representative app and component surfaces", () => {
    const matrixPath = resolve(
      __dirname,
      "../design/token-migration-matrix.md",
    );
    const content = readFileSync(matrixPath, "utf-8");

    expect(content).toContain("app/account-summary/page.tsx");
    expect(content).toContain("components/common/footer.tsx");
    expect(content).toContain("components/common/navbar.tsx");
  });

  it("globals.css contains design token documentation comment", () => {
    const cssPath = resolve(__dirname, "globals.css");
    const content = readFileSync(cssPath, "utf-8");
    expect(content).toContain("Design Token Migration Reference");
    expect(content).toContain("token-migration-matrix.md");
  });
});
