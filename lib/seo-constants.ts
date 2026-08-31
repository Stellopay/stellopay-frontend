/**
 * @file lib/seo-constants.ts
 *
 * Single source of truth for SEO-critical brand metadata shared across:
 *  - app/layout.tsx  (Open Graph / Twitter card metadata)
 *  - app/page.tsx    (JSON-LD structured data script tag)
 *  - app/sitemap.ts  (canonical base URL)
 *
 * Keeping these values here means a domain change or brand rename is a
 * one-file edit rather than a grep-and-replace across multiple modules.
 *
 * All exported values are typed as `const` assertions so TypeScript infers
 * the narrowest possible literal types, letting downstream consumers benefit
 * from exhaustive checks without having to re-cast.
 */

/** Canonical production origin — no trailing slash. */
export const SITE_URL = "https://stellopay.com" as const;

/** Human-readable brand name used in titles, OG tags, and schema labels. */
export const SITE_NAME = "StelloPay" as const;

/**
 * Absolute URL of the primary logo asset.
 *
 * Used by the Organization schema `logo` property.
 * The file must be served at this path; update here if the asset moves.
 */
export const SITE_LOGO_URL = `${SITE_URL}/logo.png` as const;

/**
 * One-sentence elevator pitch.
 *
 * Used as the `description` field in both the root layout metadata and the
 * Organization schema `description` property.
 */
export const SITE_DESCRIPTION =
  "StelloPay — fast, secure blockchain payroll and payments powered by Stellar." as const;

/**
 * Social / authoritative profiles for the Organization schema `sameAs` array.
 *
 * List every profile that unambiguously identifies StelloPay so that search
 * engines can reconcile the entity across the web.
 */
export const SITE_SAME_AS = [
  "https://twitter.com/stellopay",
  "https://www.linkedin.com/company/stellopay",
  "https://github.com/Stellopay",
] as const;

/**
 * JSON-LD payload for the landing page.
 *
 * Combines two schema.org types in a single `@graph` array:
 *
 *  1. **Organization** — tells search engines who runs the site, provides a
 *     logo for knowledge panels, and links to official social profiles via
 *     `sameAs`.
 *
 *  2. **WebSite** — enables the Sitelinks Search Box in Google by declaring
 *     the `potentialAction` search target.  Also carries the canonical `url`
 *     and `name` so Google can anchor the entity to the domain.
 *
 * Usage:
 * ```tsx
 * import { JSONLD_PAYLOAD } from "@/lib/seo-constants";
 *
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_PAYLOAD) }}
 * />
 * ```
 *
 * Validation:
 *   https://search.google.com/test/rich-results
 *   https://validator.schema.org/
 */
export const JSONLD_PAYLOAD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
        width: 512,
        height: 512,
      },
      description: SITE_DESCRIPTION,
      sameAs: [...SITE_SAME_AS],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?s={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
} as const;
