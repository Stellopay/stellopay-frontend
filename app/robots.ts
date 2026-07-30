import type { MetadataRoute } from "next";
import { BASE_URL } from "./sitemap";

/**
 * Routes that must never be indexed by search engines.
 *
 * Includes:
 *  - Authenticated app routes: pages that require a logged-in session and
 *    contain personal account data (dashboard, transactions, account summary,
 *    analytics, settings).
 *  - Auth flows: login, sign-up, and email verification are transactional
 *    pages with no organic search value; they are noindex in their own route
 *    metadata but also disallowed here as a belt-and-suspenders defence.
 *
 * Exported for use in tests and documentation.
 */
export const DISALLOWED_PATHS: string[] = [
  "/dashboard",
  "/transactions",
  "/account-summary",
  "/analytics-view",
  "/settings",
  "/auth",
  "/verify-email",
];

/**
 * Next.js 15 App Router robots file-convention handler.
 *
 * Served automatically at /robots.txt.
 * Next.js serialises the returned object to a valid Robots Exclusion Protocol
 * document.
 *
 * Rules applied:
 *  - All crawlers ("*"): allow everything, then disallow the authenticated
 *    and auth-flow routes listed in DISALLOWED_PATHS.
 *  - Googlebot: same rules; specified explicitly so Google Search Console can
 *    validate the directive directly against the named agent.
 *  - sitemap: points to the canonical sitemap URL so crawlers can discover it
 *    even without parsing the HTML <link rel="sitemap"> tag.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Default: all crawlers
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        // Explicit Googlebot rule for Search Console validation
        userAgent: "Googlebot",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
