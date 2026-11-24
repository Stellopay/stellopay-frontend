import { describe, expect, it } from "vitest";
import robots, { DISALLOWED_PATHS } from "@/app/robots";
import sitemap, { BASE_URL, PUBLIC_ROUTES } from "@/app/sitemap";

describe("sitemap route", () => {
  it("returns public routes with absolute unique URLs and valid lastModified values", () => {
    const routes = sitemap();
    const urls = routes.map(({ url }) => url);

    expect(routes.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
    for (const route of routes) {
      expect(route.url).toMatch(/^https?:\/\//);
      expect(new URL(route.url).origin).toBe(BASE_URL);
      expect(route.lastModified).toBeInstanceOf(Date);
      expect(Number.isNaN(route.lastModified.getTime())).toBe(false);
    }
  });

  it("does not include private paths disallowed by robots", () => {
    const sitemapPaths = sitemap().map(({ url }) => new URL(url).pathname);
    const robotsRules = robots().rules;
    const disallowed = new Set([
      ...DISALLOWED_PATHS,
      ...robotsRules.flatMap((rule) => rule.disallow ?? []),
    ]);

    for (const route of PUBLIC_ROUTES) {
      expect(disallowed.has(new URL(route.url).pathname)).toBe(false);
    }
    for (const privatePath of ["/dashboard", "/transactions", "/settings", "/account-summary"]) {
      expect(sitemapPaths).not.toContain(privatePath);
    }
  });
});
