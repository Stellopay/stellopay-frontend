/**
 * Structured data for the StelloPay landing page.
 *
 * Uses a @graph to combine three schema.org entities into a single JSON-LD block:
 * - Organization: describes StelloPay as a company
 * - WebSite: describes the StelloPay website and enables sitelinks searchbox
 * - WebApplication: describes the StelloPay payroll/payments software product
 *
 * Validates against Google's Rich Results Test and Schema.org validator.
 *
 * Kept in its own module (zero dependencies) so tests can import it
 * without pulling in the entire landing page component tree.
 */
export const landingStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "StelloPay",
      url: "https://stellopay.com",
      logo: "https://stellopay.com/logo.png",
      description:
        "StelloPay — fast, secure blockchain payroll and payments powered by Stellar.",
      sameAs: [
        "https://twitter.com/stellopay",
        "https://github.com/stellopay",
      ],
    },
    {
      "@type": "WebSite",
      name: "StelloPay",
      url: "https://stellopay.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://stellopay.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": ["WebApplication", "SoftwareApplication"],
      name: "StelloPay",
      url: "https://stellopay.com",
      description:
        "Fast, secure blockchain payroll and payments powered by Stellar. Automate salary payments globally with instant, secure payroll settlement on the Stellar blockchain.",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to get started",
      },
      provider: {
        "@type": "Organization",
        name: "StelloPay",
        url: "https://stellopay.com",
      },
    },
  ],
};
