import type { MetadataRoute } from "next";

/**
 * Canonical base URL for all sitemap entries.
 * Exported as a constant so tests can import it without duplicating the string.
 */
export const BASE_URL = "https://stellopay.com";

/**
 * Public routes eligible for indexing.
 *
 * Only routes that are:
 *  - accessible without authentication
 *  - intended to rank in search results
 *
 * are listed here.  Authenticated app routes (/dashboard, /transactions, etc.)
 * are intentionally excluded — they are also disallowed in robots.ts so crawlers
 * never attempt to index them.
 *
 * Auth flows (/auth/login, /auth/sign-up, /verify-email) are excluded because
 * they carry `robots: { index: false }` in their route metadata and are not
 * useful as landing pages for organic search traffic.
 *
 * changeFrequency and priority follow the Sitemaps protocol recommendations:
 *   https://www.sitemaps.org/protocol.html
 */
export const PUBLIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/help/support`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/help/support/accountManagement`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

/**
 * Next.js 15 App Router sitemap file-convention handler.
 *
 * Served automatically at /sitemap.xml.
 * Next.js serialises the returned array to a valid Sitemaps XML document.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES;
}
