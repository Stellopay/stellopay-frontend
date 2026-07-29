import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-local" }),
}));

import { metadata as rootMetadata, viewport as rootViewport } from "@/app/layout";
import sitemap, { BASE_URL, PUBLIC_ROUTES } from "@/app/sitemap";
import robots, { DISALLOWED_PATHS } from "@/app/robots";
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
    expect(rootMetadata.manifest).toBe("/manifest.json");
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

// ── Sitemap (app/sitemap.ts) ──────────────────────────────────────────────────

describe("Sitemap — app/sitemap.ts", () => {
  it("exports BASE_URL pointing to the canonical production domain", () => {
    expect(BASE_URL).toBe("https://stellopay.com");
    expect(BASE_URL).toMatch(/^https:\/\//);
    expect(BASE_URL).not.toMatch(/\/$/); // no trailing slash
  });

  it("default export (sitemap()) returns the PUBLIC_ROUTES array", () => {
    const result = sitemap();
    expect(result).toEqual(PUBLIC_ROUTES);
  });

  it("sitemap includes the landing-page root entry", () => {
    const result = sitemap();
    const root = result.find((entry) => entry.url === BASE_URL);
    expect(root).toBeDefined();
  });

  it("sitemap includes the /help/support entry", () => {
    const result = sitemap();
    const helpSupport = result.find(
      (entry) => entry.url === `${BASE_URL}/help/support`,
    );
    expect(helpSupport).toBeDefined();
  });

  it("sitemap includes the /help/support/accountManagement entry", () => {
    const result = sitemap();
    const acctMgmt = result.find(
      (entry) => entry.url === `${BASE_URL}/help/support/accountManagement`,
    );
    expect(acctMgmt).toBeDefined();
  });

  it("every sitemap entry URL starts with BASE_URL", () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.url).toMatch(new RegExp(`^${BASE_URL}`));
    });
  });

  it("every sitemap entry has a lastModified date", () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.lastModified).toBeDefined();
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  it("every sitemap entry has a valid changeFrequency", () => {
    const valid = [
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ];
    const result = sitemap();
    result.forEach((entry) => {
      if (entry.changeFrequency !== undefined) {
        expect(valid).toContain(entry.changeFrequency);
      }
    });
  });

  it("every sitemap entry has a priority between 0.0 and 1.0", () => {
    const result = sitemap();
    result.forEach((entry) => {
      if (entry.priority !== undefined) {
        expect(entry.priority).toBeGreaterThanOrEqual(0.0);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
      }
    });
  });

  it("root entry has the highest priority (1.0)", () => {
    const result = sitemap();
    const root = result.find((entry) => entry.url === BASE_URL);
    expect(root?.priority).toBe(1.0);
  });

  it("sitemap does NOT include any authenticated app routes", () => {
    const result = sitemap();
    const authenticatedPrefixes = [
      "/dashboard",
      "/transactions",
      "/account-summary",
      "/analytics-view",
      "/settings",
    ];
    result.forEach((entry) => {
      authenticatedPrefixes.forEach((prefix) => {
        expect(entry.url).not.toContain(prefix);
      });
    });
  });

  it("sitemap does NOT include auth flow routes", () => {
    const result = sitemap();
    const authPrefixes = ["/auth", "/verify-email"];
    result.forEach((entry) => {
      authPrefixes.forEach((prefix) => {
        expect(entry.url).not.toContain(prefix);
      });
    });
  });

  it("sitemap returns at least one entry (non-empty)", () => {
    const result = sitemap();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── Robots (app/robots.ts) ────────────────────────────────────────────────────

describe("Robots — app/robots.ts", () => {
  it("default export (robots()) returns an object", () => {
    const result = robots();
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("result contains a rules array with at least one rule", () => {
    const result = robots();
    expect(Array.isArray(result.rules)).toBe(true);
    expect((result.rules as unknown[]).length).toBeGreaterThan(0);
  });

  it("includes a rule for all crawlers ('*')", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    expect(wildcard).toBeDefined();
  });

  it("includes an explicit rule for Googlebot", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const googlebot = rules.find((r) => r.userAgent === "Googlebot");
    expect(googlebot).toBeDefined();
  });

  it("wildcard rule allows '/'", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    expect(wildcard?.allow).toBe("/");
  });

  it("wildcard rule disallows /dashboard", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/dashboard");
  });

  it("wildcard rule disallows /transactions", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/transactions");
  });

  it("wildcard rule disallows /account-summary", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/account-summary");
  });

  it("wildcard rule disallows /analytics-view", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/analytics-view");
  });

  it("wildcard rule disallows /settings", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/settings");
  });

  it("wildcard rule disallows /auth", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/auth");
  });

  it("wildcard rule disallows /verify-email", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const disallowed = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    expect(disallowed).toContain("/verify-email");
  });

  it("Googlebot rule mirrors the wildcard disallow list", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === "*");
    const googlebot = rules.find((r) => r.userAgent === "Googlebot");

    const wildcardDisallow = Array.isArray(wildcard?.disallow)
      ? wildcard!.disallow
      : [wildcard?.disallow];
    const googlebotDisallow = Array.isArray(googlebot?.disallow)
      ? googlebot!.disallow
      : [googlebot?.disallow];

    expect(googlebotDisallow).toEqual(wildcardDisallow);
  });

  it("result includes a sitemap URL", () => {
    const result = robots();
    expect(result.sitemap).toBeDefined();
    expect(typeof result.sitemap === "string" || Array.isArray(result.sitemap)).toBe(true);
  });

  it("sitemap URL points to /sitemap.xml on the canonical domain", () => {
    const result = robots();
    const sitemapUrl =
      typeof result.sitemap === "string" ? result.sitemap : result.sitemap?.[0];
    expect(sitemapUrl).toBe("https://stellopay.com/sitemap.xml");
  });

  it("DISALLOWED_PATHS constant lists all expected private routes", () => {
    expect(DISALLOWED_PATHS).toContain("/dashboard");
    expect(DISALLOWED_PATHS).toContain("/transactions");
    expect(DISALLOWED_PATHS).toContain("/account-summary");
    expect(DISALLOWED_PATHS).toContain("/analytics-view");
    expect(DISALLOWED_PATHS).toContain("/settings");
    expect(DISALLOWED_PATHS).toContain("/auth");
    expect(DISALLOWED_PATHS).toContain("/verify-email");
  });

  it("every DISALLOWED_PATH starts with '/'", () => {
    DISALLOWED_PATHS.forEach((path) => {
      expect(path).toMatch(/^\//);
    });
  });

  it("DISALLOWED_PATHS does not contain public marketing routes", () => {
    const publicRoutes = ["/", "/help/support", "/help/support/accountManagement"];
    publicRoutes.forEach((route) => {
      expect(DISALLOWED_PATHS).not.toContain(route);
    });
  });
});
