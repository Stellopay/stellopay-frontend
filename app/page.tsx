import LandingPage from "@/components/landing/landing-page";
import { JSONLD_PAYLOAD } from "@/lib/seo-constants";

/**
 * Landing page — app/page.tsx
 *
 * Renders the public marketing page and injects a JSON-LD structured-data
 * script so search engines can build a knowledge-panel entry and a Sitelinks
 * Search Box for StelloPay.
 *
 * ## JSON-LD payload
 *
 * The `<script type="application/ld+json">` tag is placed inside `<main>` so
 * it is co-located with the page content it describes.  Next.js streams the
 * script as part of the initial HTML payload — no additional round-trips.
 *
 * The payload is defined in `lib/seo-constants.ts` and re-exported from this
 * file as `jsonLdPayload` so tests can import it without having to parse the
 * rendered DOM.
 *
 * ### Schema types emitted
 *
 * | Type         | Purpose                                                     |
 * |--------------|-------------------------------------------------------------|
 * | Organization | Brand identity, logo, and `sameAs` social-profile links     |
 * | WebSite      | Sitelinks Search Box via `potentialAction: SearchAction`    |
 *
 * ### Validation
 * After deploying, validate with:
 *   - https://search.google.com/test/rich-results
 *   - https://validator.schema.org/
 *
 * ## Accessibility
 *
 * The `<script>` tag is an inert metadata node — it has no visual rendering
 * and is not exposed to the accessibility tree.  No ARIA attributes are
 * needed.  The surrounding `<main id="main-content">` already carries the
 * primary landmark role and is the skip-link target declared in
 * `app/layout.tsx`.
 */

/** Re-exported so tests can assert the exact payload without DOM parsing. */
export { JSONLD_PAYLOAD as jsonLdPayload } from "@/lib/seo-constants";

export default function Home() {
  return (
    // id="main-content" is the skip-link target declared in the root layout.
    <main id="main-content">
      {/*
       * JSON-LD structured data — Organization + WebSite schema.
       *
       * dangerouslySetInnerHTML is the standard Next.js / React pattern for
       * injecting pre-serialised JSON-LD.  The payload is a static constant
       * (no user input) so there is no XSS risk.
       *
       * aria-hidden is not needed — <script> elements are already excluded
       * from the accessibility tree by the browser.
       */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_PAYLOAD) }}
        data-testid="jsonld-structured-data"
      />
      <LandingPage />
    </main>
  );
}
