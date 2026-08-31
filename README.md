StelloPay Frontend
StelloPay is a payroll and crypto payments platform built on the Stellar blockchain. This repository contains the web frontend: the marketing/landing site, authentication flows, and an authenticated dashboard for managing transactions, account summaries, and settings.

Tech Stack
Framework: Next.js 15 (App Router, Turbopack dev server)
UI: React 19
Language: TypeScript
Styling: Tailwind CSS 4 with Radix UI primitives and shadcn-style components
Forms & validation: react-hook-form + Zod
Date handling: date-fns (see utils/date-utils.ts)
Unit testing: Vitest + Testing Library
E2E testing: Playwright
Please see our Contributing Guide for details on project structure, the data-layer pattern, testing, and conventions.

Routing
This project is App-Router-only. All routes, layouts, and pages live under app/; the legacy pages/ directory was removed (#290). Do not add a pages/ directory.

Transactions URL state
components/transactions/transactions-content.tsx mirrors the visible transactions list state into the URL query string via next/navigation, so a refreshed, bookmarked, or shared /transactions link reproduces the same slice of data.

Query key State Example
q Search text ?q=USDC
filter Transaction type (sent, received; default all is omitted) ?filter=sent
from / to Inclusive ISO date range (YYYY-MM-DD) ?from=2024-02-01&to=2024-02-29
sort Primary and optional secondary sort as field.direction ?sort=amount.asc,date.desc
page 1-based page number; page 1 is omitted ?page=3
The component reads those parameters once on first load, validates untrusted values, and falls back to the default 30-day range, All Transactions, date.desc, and page 1 when a shared URL is malformed. User-driven updates call router.replace(..., { scroll: false }), not push, so debounced search typing and pagination do not create a new browser-history entry per keystroke or click.

Accessibility and responsive notes:

The search input exposes the explicit accessible name Search transactions and stays keyboard operable, including the clear-search button.
Pagination keeps its keyboard handling and aria-current="page" semantics while the URL updates.
The existing dark theme tokens and responsive breakpoints remain unchanged (sm 640, md 768, lg 1024, xl 1280); URL synchronization is state-only and does not add breakpoint-specific markup.
Unrelated query parameters are preserved so future tabs/deep-link context can coexist with transactions filters.
Focused regression coverage lives in components/transactions/transactions-content.test.tsx and can be run with:

Bash

npx vitest run components/transactions/transactions-content.test.tsx --coverage.enabled=false

Collapsed sidebar navigation labels

components/common/nav-link.tsx uses the in-repo Radix-based components/ui/popover.tsx primitive for labels in the collapsed desktop sidebar. The legacy external Tooltip package was the only consumer of that package and has been removed.

Accessibility notes:

Each collapsed icon-only link keeps its native anchor semantics, has an explicit aria-label, and exposes aria-current="page" for the active route.
The label opens on keyboard focus as well as pointer hover. The tooltip content is associated with the focused link through aria-describedby, does not steal focus, and closes on blur or Escape.
focus-visible:ring-ring and focus-visible:ring-offset-background use the existing design tokens. The popover uses bg-popover, text-popover-foreground, and border-border in both light and dark themes.
The notification dot is decorative (aria-hidden="true"); the link's accessible name remains the navigation label.
Responsive hand-off:

Breakpoint	Sidebar behavior	Tooltip behavior
<640px and sm (640px)	Mobile sidebar uses the expanded, labeled navigation	No tooltip is required; labels remain visible
md (768px)	Collapsed desktop rail may be 6rem wide	Labels open to the right and Radix collision handling keeps them in the viewport
lg (1024px)	Same collapsed/expanded desktop states	The max-w constraint prevents long labels from overflowing
xl (1280px)	Same desktop behavior	Label spacing and token-based surface styling remain unchanged
Regression coverage for this migration lives in components/common/nav-link.test.tsx and covers active-route semantics, reduced motion, keyboard focus, pointer hover, Escape dismissal, accessible names, token classes, and navigation URLs. Validate it with npx vitest run components/common/nav-link.test.tsx --coverage.enabled=false.

Getting Started
Prerequisites
Node.js 20 LTS
npm — this is the only supported package manager for this repo. package-lock.json is the single source of truth for dependency versions; do not generate or commit a yarn.lock or pnpm-lock.yaml (see CONTRIBUTING.md). A preinstall check (scripts/check-package-manager.js) fails the install if one is present.
Setup
Bash

git clone <repository-url>
cd stellopay-frontend
npm install
No environment variables are required to run the app locally — the dashboard is currently backed by mock data in public/data/mock-data.ts and lib/demo-data.ts.

Run the dev server
Bash

npm run dev
Open http://localhost:3000 to see the app. The page auto-updates as you edit files under app/.

Available Scripts
Script Command Purpose
Dev server npm run dev Starts Next.js with Turbopack
Build npm run build Production build
Start npm run start Serves the production build
Lint npm run lint ESLint via next lint
Type-check npm run type-check tsc --noEmit
Unit tests npm run test Vitest with coverage
Unit tests (watch) npm run test:watch Vitest in watch mode
E2E tests npm run test:e2e Playwright (npx playwright test)
Format npm run prettier Prettier write
Wallet and network state
The connected wallet and the active network live in a single React context, WalletProvider, declared in context/wallet-context.tsx. The provider is wrapped around the entire app in the App Router (app/layout.tsx), so every surface that needs to know which account or network is active reads from the same source of truth.

Read the context with the useWallet hook. Calling it outside of a WalletProvider throws an explicit error, which makes provider wiring issues fail loudly during development instead of silently rendering placeholder data.

React

import { useWallet, formatAddress } from "@/context/wallet-context";

export function AccountBadge() {
const { address, isConnected, connect, disconnect, network } = useWallet();
if (!isConnected) {
return <button onClick={() => connect()}>Connect Wallet</button>;
}
return (
<span>
{formatAddress(address)} on {network.name}
</span>
);
}
The context exposes:

address — the public Stellar G-address of the connected wallet, or null when disconnected. Only public material is ever stored or logged. The provider refuses any value that looks like a Stellar secret key (S followed by 55 base32 characters).
isConnected — derived from address !== null. Use this for branching rather than null-checking the address yourself.
network — a { id, name } pair from SUPPORTED_NETWORKS. Defaults to Stellar.
connect(address?) — populates the address. Without an argument it uses a synthetic Stellar-style address for the demo flow. A real wallet integration replaces the body of this function without changing the public surface.
disconnect() — clears the address. The network selection survives a disconnect.
setNetwork(network) — switches the active network and persists the id in localStorage under stellopay.wallet.network. Hydration on the client follows the same SSR-safe pattern as ThemeProvider and SidebarProvider, so the server render and the first client render agree and React does not flag a hydration mismatch. The address itself is never persisted, so a page reload always returns to a disconnected state.
Surfaces that read the context
components/common/network-switcher.tsx reads the active network and the supported network list from the context. It keeps the existing confirmation dialog, and the selectedNetwork and onNetworkChange props still work for callers that want to treat the switcher as a controlled component.
components/dashboard/account-overview.tsx shows a Connect Wallet CTA when disconnected and the truncated context address when connected.
components/dashboard/dashboard-navbar.tsx mirrors the address pill and the network badge from the same context, so the navbar and the dashboard body never disagree.
Tests
context/wallet-context.test.tsx — Vitest unit coverage for the reducer surface, the localStorage hydration, the secret-key guard, and the useWallet outside-provider error.
tests/wallet.spec.ts — Playwright end-to-end coverage for the connect, disconnect, switch network, cancel switch, and reload-persistence flows on /dashboard.
Run the unit suite with npm test and the end-to-end suite with npx playwright test tests/wallet.spec.ts.

Error handling
The App Router uses two cooperating client boundaries.

app/error.tsx is the route-segment boundary. Any uncaught render or runtime error inside a route segment is caught here. It renders inside the root layout, so it has access to theme tokens and shared UI: a generic "Something went wrong" surface built from bg-background, text-foreground, and text-destructive, plus a "Try again" action wired to the reset() callback Next.js passes in, and a "Go to dashboard" escape hatch. The surface uses role="alert" and aria-live="assertive" so assistive tech announces it. In production, the raw error.message and error.stack are never rendered; the underlying message is only revealed when process.env.NODE_ENV !== "production" to keep debugging cheap locally. The error.digest Next.js attaches in production is logged through console.error so it can be correlated with server logs, but it is intentionally not surfaced in the UI.

app/global-error.tsx is the wider safety net for when the root layout itself or one of its providers throws. It ships its own <html>/<body> shell with inline styles because the layout that loads globals.css is exactly what failed.

Coverage for app/error.tsx is gated by the same 95% thresholds as the rest of the suite via vitest.config.ts. See app/error.test.tsx for the unit coverage.

Offline Banner
The app surfaces network-connectivity changes through a persistent banner rendered inside the root layout (app/layout.tsx). The component lives at components/common/offline-banner.tsx.

Behaviour
Initial detection: Reads navigator.onLine on mount.
Live updates: Subscribes to online / offline window events and updates the UI immediately.
Offline banner: When the browser goes offline, a fixed warning banner with a dismiss button appears at the top of the viewport. The dismiss button hides the banner, but it reappears on the next offline event.
Reconnection: When connectivity is restored, the banner transitions to a brief success state ("Your internet connection was restored") that auto-dismisses after 3 seconds. The reconnected banner is only shown after a genuine offline → online transition — not on the initial page load.
Accessibility
role="alert" and aria-live="assertive" ensure screen readers announce every connectivity change.
The dismiss button carries a descriptive aria-label.
Decorative icons are marked aria-hidden="true".
Colour contrast meets WCAG 2.1 AA in both light and dark themes.
Tests
components/common/offline-banner.test.tsx — Vitest unit suite covering online/offline transitions, dismiss behaviour, reconnection state, auto-dismiss timeout, event-listener cleanup, and the negative case where an online event fires on an already-online browser.
app/layout.test.tsx — Integration test verifying the banner is rendered inside the root layout shell.
Sitemap & Robots
The App Router generates both files automatically using the Next.js file-convention handlers:

File Served at Purpose
app/sitemap.ts /sitemap.xml Enumerates public marketing and help routes for crawler discovery
app/robots.ts /robots.txt Disallows authenticated app routes from being indexed
Public routes (sitemap)
URL changeFrequency priority
https://stellopay.com weekly 1.0
https://stellopay.com/help/support monthly 0.8
https://stellopay.com/help/support/accountManagement monthly 0.6
Auth flows (/auth/login, /auth/sign-up, /verify-email) are excluded from the sitemap. They already carry robots: { index: false } in their route metadata and have no organic search value.

Disallowed routes (robots.txt)
The following path prefixes are disallowed for all crawlers (*) and Googlebot:

text

/dashboard
/transactions
/account-summary
/analytics-view
/settings
/auth
/verify-email
These rules are a belt-and-suspenders defence: the routes also set robots: { index: false, follow: false } in their Next.js metadata, so search engines receive two independent signals not to index them.

Exported constants
Both files export named constants so tests can assert canonical values without duplicating strings:

TypeScript

Service Worker & Offline Support
A minimal PWA service worker caches the app shell so navigation degrades gracefully when the device loses connectivity, instead of surfacing the browser's default "No internet" error page.

File locations
text

public/
├─ sw.js              # Service worker — fetch strategies and cache management
app/
└─ offline/
   └─ page.tsx        # Branded offline fallback page (pre-cached by the SW)
Fetch strategies
Request type	Strategy	Rationale
/_next/static/**	Cache-first	Filenames are content-hashed by Next.js — safe to cache indefinitely
Navigation (mode: "navigate")	Network-first → offline fallback	Always tries the network; if offline, serves the cached page or /offline
Everything else (images, API)	Stale-while-revalidate	Instant response from cache; revalidation happens in the background
Cross-origin requests and non-GET methods pass through unmodified.

Cache invalidation strategy
The service worker uses a versioned cache name — stellopay-shell-v1 — to control stale content after a deploy.

How invalidation works:

The CACHE_VERSION constant in public/sw.js is bumped on each deploy (e.g. "v1" → "v2").
On activate, the service worker deletes every cache whose name does not match the current CACHE_NAME. This purges all previous shell caches from the user's browser.
Because sw.js is served with Cache-Control: no-cache (configure this in your hosting layer — see below), browsers always fetch a fresh copy of the worker on each page load.
Next.js content-hashes all /_next/static/** filenames, so a new build produces new URLs; old cached entries become unreachable and are cleaned up by the activate sweep.
Recommended CI/CD integration:

Inject the build ID into CACHE_VERSION during your pipeline so the cache is automatically busted on every deploy without a manual bump:

JavaScript

// public/sw.js — replace the static string with your CI build identifier
const CACHE_VERSION = process.env.BUILD_ID ?? "v1";
Or, for a simpler approach using a deploy timestamp in next.config.ts:

TypeScript

// next.config.ts
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/sw.js",
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    },
  ],
};
With a no-cache header on sw.js, the browser re-fetches the script on every page load. The browser's byte-diff check means only a changed CACHE_VERSION string actually triggers a new install-and-activate cycle — there's no unnecessary churn.

Offline fallback page (/offline)
app/offline/page.tsx is pre-cached in SHELL_ASSETS during the service worker install step. It matches the visual language of the branded 404 page (app/not-found.tsx) — same design tokens (bg-background, text-foreground, text-muted-foreground), same Button+Link CTA pattern, responsive layout, and WCAG 2.1 AA accessible.

Accessibility notes:

Single <h1> — screen readers announce "You're offline" as the page title.
<main id="main-content"> matches the skip-link target in the root layout.
WifiOff icon is decorative (aria-hidden="true").
CTA buttons are keyboard-focusable <a> elements via Button asChild.
Colour contrast meets WCAG 2.1 AA for text on bg-background in both light and dark themes.
Registration
The service worker is registered from an inline <script> tag in app/layout.tsx (rendered server-side as static HTML). The registration is deliberately deferred behind the window load event so it never competes with first-paint resources:

HTML

<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(function (err) {
          console.warn('[SW] Registration failed:', err);
        });
    });
  }
</script>
Registration failure is non-fatal — a .catch() handler logs a warning and the app continues to function normally without the service worker.

Registration failure is non-fatal — a `.catch()` handler logs a warning and the app continues to function normally without the service worker.

### Tests

- [`app/layout.test.tsx`](app/layout.test.tsx) — Vitest unit suite (within the existing layout test file) verifying: script tag presence, correct path and scope, load-event deferral pattern, `serviceWorker` API guard, and graceful `.catch()` error handling.

## Metadata & Viewport

Following Next.js 15 conventions, global metadata (titles, descriptions, OpenGraph) and viewport configurations are exported as separate objects in `app/layout.tsx`.

- **`metadata`**: Contains SEO tags, OpenGraph data, and Twitter cards.
- **`viewport`**: Contains responsive design parameters (e.g., `width`, `initialScale`) and theme colors for dark/light modes.

## Structured Data (JSON-LD)

The landing page (`app/page.tsx`) includes a JSON-LD `@graph` block that describes three schema.org entities, improving how StelloPay surfaces in search results:

| Entity         | @type                                       | Purpose                                                |
| -------------- | ------------------------------------------- | ------------------------------------------------------ |
| Organization   | `Organization`                              | Describes StelloPay as a company / provider            |
| WebSite        | `WebSite`                                   | Enables sitelinks searchbox and website identification |
| WebApplication | `WebApplication`, `SoftwareApplication`     | Describes the StelloPay payroll/payments software product |

### Why `WebApplication`?

StelloPay is a **web-based software product** delivered as a SaaS — not a physical financial institution. `WebApplication` (a subtype of `SoftwareApplication`) is the most accurate schema.org type for describing a browser-based payroll and payments platform. It captures the application category (`FinanceApplication`), operating system requirements (`Web`), and pricing model — all signals that search engines use to understand software products.

### Validation

- The structured data validates against [Google's Rich Results Test](https://search.google.com/test/rich-results) and the [Schema.org Validator](https://validator.schema.org/).
- All URLs use HTTPS.
- No personally identifiable information (PII) or Stellar secret keys are included.
- The `@graph` pattern keeps all three entities in a single `<script>` tag, minimizing HTML payload size.

### Testing

Structured data is tested in `app/metadata.test.ts`. The tests verify:

- The `@graph` shape and entity count
- Required properties for each `@type` (`name`, `url`, `applicationCategory`, etc.)
- The `Offer` freemium pricing model
- No sensitive data leaks (secret keys, template interpolation)
- All URLs use HTTPS

```bash
npm test -- app/metadata.test.ts
```

### Updating

When the product description, pricing model, or feature list changes, update the `landingStructuredData` object in `app/page.tsx` and adjust the corresponding tests.

## Landing Page Code Splitting

`components/landing/landing-page.tsx` eagerly imports only what is above the
fold. Everything below it is deferred with `next/dynamic`.

### What is eager, and why

| Section | Loading | Reason |
| --- | --- | --- |
| `Navbar` | eager | Immediately visible; needed for first interaction |
| `Hero` | eager | Above the fold and the LCP element |
| everything else | `next/dynamic` | Below the fold on first paint |

Deferred sections: `stats-cards`, `features-intro`, `how-it-works`,
`testimonials-section`, `value-propositions`, `enterprise-section`, `benefits`,
`faq-section`, `get-started-cta`, `footer`.

This matters most for the framer-motion sections. `hero`, `how-it-works` and
`faq-section` are the only landing modules importing `framer-motion`; two of
those three are now deferred, so the animation runtime is no longer on the
critical path to hero interactivity.

### `ssr: true` is deliberate

Every deferred section sets `ssr: true`. The server still renders their markup
into the initial HTML — only the client JS is split out. This keeps SEO
crawlability and no-JS rendering intact, and makes the skeleton fallbacks a
hydration-time state rather than a blank first paint.

Do not switch these to `ssr: false` to chase a smaller bundle. It would remove
the sections from the server-rendered HTML entirely.

### Adding a new landing section

1. Decide whether it is above the fold. If yes, import it normally.
2. If not, wrap it in `dynamic(() => import(...), { loading, ssr: true })`.
3. Build the fallback with the exported `SectionFallback` helper so the busy
   state stays consistent:

```tsx
const NewSection = dynamic(() => import("@/components/landing/new-section"), {
  loading: () => (
    <SectionFallback
      label="Loading new section..."
      className="w-full py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0D0D0D]"
    >
      <Skeleton className="h-64 rounded-3xl" shade="dark" />
    </SectionFallback>
  ),
  ssr: true,
});
```

4. Add the module path to `DEFERRED_SECTIONS` in
   `components/landing/landing-page.test.tsx`.

For a named export, resolve it in the importer:
`dynamic(() => import("...").then((m) => m.NamedExport), { ... })`.

### Accessibility (WCAG 2.1 AA)

`SectionFallback` renders every skeleton with:

- `role="status"` and `aria-live="polite"` — the pending state is announced
  without interrupting a screen reader mid-sentence (SC 4.1.3). Deliberately
  polite, not assertive; a routine section load is not an alert.
- `aria-busy="true"` — assistive tech can tell the region is incomplete.
- an `sr-only` label naming the specific section ("Loading testimonials...")
  rather than a generic "Loading", so the announcement is meaningful out of
  context (SC 2.4.6).
- the section's own vertical rhythm classes on the fallback wrapper, so
  swapping the skeleton for real content does not shift layout (SC 2.2.2).

Deferring does not change heading order. `landing-page.test.tsx` asserts the
full H1 → H2 → H3 outline with no skipped levels once all sections resolve
(SC 1.3.1).

Keyboard navigation is unaffected: `ssr: true` means deferred sections exist in
the DOM in source order, so tab order matches visual order.

### Responsive

Fallbacks reuse the same `py-16 sm:py-20 lg:py-24` rhythm and the same grid
breakpoints as the sections they stand in for, so the skeleton occupies
comparable space at sm 640, md 768, lg 1024 and xl 1280.

### Testing

```bash
npx vitest run components/landing/landing-page.test.tsx
```

`next/dynamic` is mocked to resolve the real module asynchronously, so tests
exercise the actual deferred path and assert against real components rather
than stand-ins. The mock records each importer's source text, which is how the
suite verifies a section is deferred and that Hero and Navbar are not.

## Project Structure

```
stellopay-frontend
├─ app/                  # Next.js App Router routes, layouts, and segment metadata
│  ├─ account-summary/
│  ├─ analytics-view/
│  ├─ auth/              # login, sign-up
│  ├─ dashboard/
│  ├─ help/support/
│  ├─ settings/          # preferences, profile
│  ├─ transactions/
│  ├─ layout.tsx
│  └─ page.tsx           # landing page
├─ components/           # Reusable UI, grouped by feature
│  ├─ analytics/
│  ├─ auth/
│  ├─ common/            # navbar, sidebar, shared inputs
│  ├─ dashboard/
│  ├─ landing/
│  ├─ transactions/
│  └─ ui/                # shadcn/Radix-based primitives (button, dialog, table, ...)
├─ context/              # React context providers (sidebar, theme)
├─ hooks/                # Custom hooks (e.g. useTransactions, usePaymentHistory)
├─ lib/                  # API client, demo data, shared non-UI logic
│  └─ api/
├─ public/               # Static assets
│  └─ data/              # Mock data used by the UI in the absence of a real backend
├─ types/                # Shared TypeScript types
├─ utils/                # Pure utility functions (formatting, pagination, auth, dates, ...)
├─ tests/                # Playwright E2E specs
├─ e2e/                  # Additional Playwright specs
└─ pages/                # Legacy Pages Router landing page assets
```

## Design Resources

- **Main Figma Design Workspace**: See [design/figma-design.txt](design/figma-design.txt) for all page-specific layouts (Dashboard, Settings, Help/Support, etc.)
- **Landing Page Redesign Figma Link**: [Figma Link](https://www.figma.com/design/J4X2XvMo8knspQEEQbHoDN/Stellopay-Landing-page?node-id=0-1&t=edynl8rBO0dXUrXp-1)

## Theme System & Dark Mode

The application uses a context-based theme system with Tailwind CSS and local storage persistence.

### Architecture & Usage

Bash

Sitemap
curl http://localhost:3000/sitemap.xml

Robots
curl http://localhost:3000/robots.txt
Tests
Sitemap and robots behaviour is covered in app/metadata.test.ts:

Bash

npm test app/metadata.test.ts
The suite asserts:

BASE_URL matches the canonical domain
Every sitemap entry URL is absolute and starts with BASE_URL
Every entry has a valid lastModified date, changeFrequency, and priority
Authenticated and auth-flow routes are absent from the sitemap
Every disallowed path is present in the robots rules for both * and Googlebot
The sitemap pointer in robots.txt is https://stellopay.com/sitemap.xml
Metadata & Viewport
Following Next.js 15 conventions, global metadata (titles, descriptions, OpenGraph) and viewport configurations are exported as separate objects in app/layout.tsx.

Following Next.js 15 conventions, global metadata (titles, descriptions, OpenGraph) and viewport configurations are exported as separate objects in app/layout.tsx.

metadata: Contains SEO tags, OpenGraph data, and Twitter cards.
viewport: Contains responsive design parameters (e.g., width, initialScale) and theme colors for dark/light modes.
JSON-LD Structured Data
app/page.tsx renders a <script type="application/ld+json"> tag containing an Organization and WebSite schema that lets search engines build a knowledge-panel entry and a Sitelinks Search Box for StelloPay.

Schema types
Type	Purpose
Organization	Brand identity, logo URL, and sameAs social-profile links for knowledge panels
WebSite	Enables the Sitelinks Search Box in Google via potentialAction: SearchAction
Shared constants module
All SEO-critical values live in a single file — lib/seo-constants.ts — so a domain change or brand rename is a one-file edit:

TypeScript

import {
  SITE_URL,         // "https://stellopay.com"
  SITE_NAME,        // "StelloPay"
  SITE_LOGO_URL,    // "https://stellopay.com/logo.png"
  SITE_DESCRIPTION, // one-sentence elevator pitch
  SITE_SAME_AS,     // social / authoritative profile URLs
  JSONLD_PAYLOAD,   // fully typed Organization + WebSite @graph object
} from "@/lib/seo-constants";
JSONLD_PAYLOAD is also re-exported from app/page.tsx as jsonLdPayload so tests can assert the exact payload without parsing the rendered DOM:

TypeScript

import { jsonLdPayload } from "@/app/page";
Validating the structured data
After deploying, check the output with:

Google Rich Results Test: https://search.google.com/test/rich-results
Schema.org validator: https://validator.schema.org/
To inspect the raw script tag locally:

Bash

npm run dev
# View source at http://localhost:3000 and search for application/ld+json
Tests
JSON-LD coverage lives in app/metadata.test.ts alongside the existing sitemap and robots suites:

Bash

npm test app/metadata.test.ts
The suite asserts:

All SITE_* constants match canonical values (URL, name, logo, description, sameAs)
JSONLD_PAYLOAD contains both Organization and WebSite nodes with correct @type, @id, name, url, logo, description, sameAs, publisher, and potentialAction fields
The SearchAction urlTemplate is rooted at SITE_URL and contains the {search_term_string} placeholder
The payload serialises to valid JSON and round-trips without data loss
jsonLdPayload (re-export from app/page.tsx) is the same reference as JSONLD_PAYLOAD
Accessibility
The <script> element is an inert metadata node — it has no visual rendering and is not exposed to the accessibility tree. No ARIA attributes are required.

Dynamic Open Graph Image
app/opengraph-image.tsx implements the Next.js file-convention OG image route. It is served automatically at /opengraph-image and generates a 1200 × 630 px PNG at request time using next/og (ImageResponse / Satori).

What's rendered
Element Detail
Background White (#FFFFFF) — matches the light-mode hero surface
Badge Dark pill with the StelloPay brand name and "Blockchain Payroll" label
Headline Three-line hero h1 — "The Future of / Payroll on / Blockchain"
Gradient "Payroll on" uses the brand gradient: #2563EB → #7C3AED → #059669
Tagline Hero paragraph copy — "Built for modern businesses…"
Font Clash Display Variable loaded from public/font/clash-display-variable.ttf
Decorative blobs Three radial-gradient orbs mirroring the hero decorative orbs
Accent bar Bottom-right brand gradient stripe
Accessibility
What's rendered
Element Detail
Background White (#FFFFFF) — matches the light-mode hero surface
Badge Dark pill with the StelloPay brand name and "Blockchain Payroll" label
Headline Three-line hero h1 — "The Future of / Payroll on / Blockchain"
Gradient "Payroll on" uses the brand gradient: #2563EB → #7C3AED → #059669
Tagline Hero paragraph copy — "Built for modern businesses…"
Font Clash Display Variable loaded from public/font/clash-display-variable.ttf
Decorative blobs Three radial-gradient orbs mirroring the hero decorative orbs
Accent bar Bottom-right brand gradient stripe
Accessibility
The OG image is a static bitmap consumed by crawlers and social previews. WCAG 2.1 AA contrast requirements are met for all rendered text:

Text element Foreground Background Contrast ratio
Headline (dark) #09090B #FFFFFF ≈ 20.7 : 1 ✓
Tagline (muted) #52525B #FFFFFF ≈ 7.0 : 1 ✓
Badge label #FFFFFF #09090B ≈ 20.7 : 1 ✓
The gradient headline ("Payroll on") is decorative text whose semantic equivalent is conveyed by the alt attribute set in openGraph.images[].alt inside app/layout.tsx:

"StelloPay — The Future of Payroll on Blockchain. Brand gradient headline on white background."

File locations
text

app/
├─ opengraph-image.tsx # Route handler — generates the PNG
└─ opengraph-image.test.ts # Vitest unit tests
Exported constants
The module exports several constants so tests and other files can reference canonical values without duplicating strings:

TypeScript

import OGImage, { size, contentType, BRAND_GRADIENT, COLORS, COPY } from "@/app/opengraph-image";

size // { width: 1200, height: 630 }
contentType // "image/png"
BRAND_GRADIENT // { from: "#2563EB", via: "#7C3AED", to: "#059669" }
COLORS // { background, foreground, muted, accent }
COPY // { headlinePrefix, headlineGradient, headlineSuffix, tagline, brand, badgeSub }
Font loading
The handler reads public/font/clash-display-variable.ttf at request time and passes the ArrayBuffer to ImageResponse via the fonts option. If the file cannot be read (e.g., in a stripped production image), the handler falls back gracefully to the default sans-serif typeface — the image is still generated without throwing.

Validating the live image
After deploying, inspect the OG image with:

Facebook debugger: https://developers.facebook.com/tools/debug/
Twitter Card validator: https://cards-dev.twitter.com/validator
OG preview: https://www.opengraph.xyz/
To inspect the raw PNG locally with a running dev server:

Bash

npm run dev

open http://localhost:3000/opengraph-image
Keeping copy in sync
The headline and tagline in app/opengraph-image.tsx are defined in the COPY constant and should be kept in sync with components/landing/hero.tsx. The unit tests assert the exact strings so a mismatch will fail CI.

Project Structure
text

stellopay-frontend
├─ app/ # Next.js App Router routes, layouts, and segment metadata
│ ├─ account-summary/
│ ├─ analytics-view/
│ ├─ auth/ # login, sign-up
│ ├─ dashboard/
│ ├─ help/support/
│ ├─ settings/ # preferences (tabbed shell — see design/settings-ia.md)
│ ├─ transactions/
│ ├─ layout.tsx
│ └─ page.tsx # landing page
├─ components/ # Reusable UI, grouped by feature
│ ├─ analytics/
│ ├─ auth/
│ ├─ common/ # navbar, sidebar, shared inputs
│ ├─ dashboard/
│ ├─ landing/
│ ├─ transactions/
│ └─ ui/ # shadcn/Radix-based primitives (button, dialog, table, ...)
├─ context/ # React context providers (sidebar, theme)
├─ hooks/ # Custom hooks (e.g. useTransactions, usePaymentHistory)
├─ lib/ # API client, demo data, shared non-UI logic
│ └─ api/
├─ public/ # Static assets
│ └─ data/ # Mock data used by the UI in the absence of a real backend
├─ types/ # Shared TypeScript types
├─ utils/ # Pure utility functions (formatting, pagination, auth, dates, ...)
├─ tests/ # Playwright E2E specs
├─ e2e/ # Additional Playwright specs
└─ pages/ # Legacy Pages Router landing page assets
Settings section structure
app/settings/preferences is a tabbed shell with five sections — Account
(profile, identity, and locale defaults), Notifications (transaction alerts
and delivery-channel toggles), Security (password, 2-FA, and session
management), Wallets (connected Stellar wallets and transfer safeguards),
and Statements (downloadable tax summaries and periodic statements) — each
driven by a ?section=<value> deep-link parameter.

See design/settings-ia.md for the full information
architecture: per-tab breakdown, routing behaviour, unsaved-changes guard,
accessibility requirements, and step-by-step instructions for adding a new
settings section.

Adding a new settings section? Follow the checklist in
design/settings-ia.md → Adding a new settings section, then update the
tab table at the top of that file and add a corresponding subsection. Keep
the spec, the code (buildSections() in settings-page-shell.tsx), and the
tests in sync — the spec is the single source of truth for the settings IA.

Design Resources
Main Figma Design Workspace: See design/figma-design.txt for all page-specific layouts (Dashboard, Settings, Help/Support, etc.)
Landing Page Redesign Figma Link: Figma Link
Theme System & Dark Mode
The application uses a context-based theme system with Tailwind CSS and local storage persistence.

Architecture & Usage
The context provider is configured in context/theme-context.tsx and wraps the root layout in app/layout.tsx.

You can access and toggle the theme programmatically in components using the custom hook:

React

import { useTheme } from "@/context/theme-context";

export default function MyComponent() {
const { theme, toggleTheme, setTheme } = useTheme();

// Access current theme ("light" or "dark")
console.log(theme);

// Toggle between light and dark themes
return <button onClick={toggleTheme}>Toggle Theme</button>;
}
Theme Toggle UI: Located in the top-right corner within components/landing/navbar.tsx.
System Preference: Falls back to the system's preferred color scheme if no preference is stored in localStorage.
Tailwind Integration: Utilizes Tailwind's native dark: modifier (e.g. bg-white dark:bg-zinc-900) for styling.
Testing
npm run test runs the Vitest unit suite with coverage for utils (auth, transactions, pagination, dates), auth schemas, and select components. Coverage thresholds are enforced at 95% (lines/branches/functions/statements) for the files listed in vitest.config.ts.
npm run test:watch runs Vitest in watch mode while developing unit tests.
npm run test:e2e runs the full Playwright suite under tests//*.spec.ts and e2e//.spec.ts across chromium, firefox, and webkit against a local dev server.
Unit tests for utils/.ts are colocated as utils/<name>.test.ts (e.g. utils/date-utils.test.ts); Playwright specs live under tests/*.spec.ts.
Covered Flows
Authentication: Validation rules (email format, strong passwords matching), form state, and UI feedback for Login (tests/auth-login.spec.ts), Sign-up (tests/auth-signup.spec.ts), and Email Verification (tests/verify-email.spec.ts).
Wallet: Connect, disconnect, and network switching (tests/wallet.spec.ts).
Dashboard: Account overview, settings, and paginated transactions (tests/dashboard.spec.ts, tests/settings.spec.ts, tests/pagination.spec.ts).
Date utilities
All date parsing, formatting, and range-checking lives in a single module, utils/date-utils.ts, built on date-fns for deterministic, locale-independent output. Invalid input fails safely: parseTransactionDate returns null and formatDate returns "" rather than throwing.

Accessibility testing
Automated accessibility scanning runs as part of the Playwright suite using @axe-core/playwright, so a11y regressions (missing labels, low-contrast text, incorrect roles) fail CI the same way a broken assertion would — not just at design-review time.

Shared helper: tests/axe-helper.ts exports expectNoSeriousA11yViolations(page, options?), which scans the current page against WCAG 2.x A/AA + best-practice rules and fails the test if any serious or critical violation is found.

Where it runs: tests/auth-forms.spec.ts (/auth/login, /auth/sign-up), tests/dashboard.spec.ts (/dashboard), and tests/pagination.spec.ts (/transactions).

Severity thresholds: minor/moderate violations are logged via console.warn (visible in the Playwright report) but do not fail the build — they're worth fixing but shouldn't block shipping. serious/critical violations fail the test.

Triaged allowlist: a known issue that can't be fixed immediately should be allowlisted explicitly, not silenced wholesale — pass it via the allowlist option with a reason (ideally linking a tracking issue):

TypeScript

await expectNoSeriousA11yViolations(page, {
allowlist: [
{
id: "color-contrast",
reason: "Tracked in #999 — pending design token update",
},
],
});
Allowlisted violations still print to the console on every run so they stay visible instead of disappearing.

Running scans locally:

Bash

npx playwright test # full suite, includes a11y scans
npx playwright test tests/dashboard.spec.ts # a single spec
npx playwright show-report # inspect the last HTML report
Interpreting a failure: the test output includes the axe rule id, impact level, the number of affected DOM nodes (with selectors), and a helpUrl linking to the deque rule documentation explaining the fix. Reproduce locally with npx playwright test --headed <file> to inspect the flagged elements in the browser.

Iconography
To keep the application's bundle light and ensure visual consistency, the project consolidates all UI icons onto Lucide React (lucide-react) as the single primary icon set.

Guidelines
Primary Set: Use lucide-react for all UI icons.
Custom / Brand Icons: For brand logos or unique custom shapes (e.g., StellOpayLogo, StellarIcon), use raw SVG components located in public/svg/svg.tsx or local custom components.
Restricted Libraries: Do NOT import from react-icons, @hugeicons/react, or @hugeicons/core-free-icons.
Guardrails
ESLint Rule: The no-restricted-imports rule in .eslintrc.json blocks imports from restricted packages.
CI Guard Test: utils/import-guard.test.ts scans all source files in app/ and components/ to verify no prohibited icon libraries are referenced.
CI Pipeline
Every pull request and push to main runs two jobs via .github/workflows/ci.yml:

Job Step Command Purpose
lint-typecheck-build Install dependencies npm ci Reproducible install from lockfile
Unit Tests npm run test Vitest utility/schema tests for auth, transaction, pagination, and date utils, plus auth schemas
Lint npm run lint ESLint via next lint
Type-check npm run type-check tsc --noEmit — catches type errors
Build npm run build Full Next.js production build
playwright Install Playwright browsers npx playwright install --with-deps chromium Provision the Chromium runtime used by the suite
E2E + accessibility npx playwright test Full Playwright suite, including the axe-core a11y scans described in Accessibility testing — a serious/critical violation fails this job
On failure, the playwright job uploads the HTML report as a build artifact (playwright-report, retained 7 days) so violations and traces can be inspected without re-running locally.

Security headers
The repo ships a strict security policy (CSP, X-Frame-Options, HSTS, Referrer-Policy, X-Content-Type-Options) defined once in `lib/security-headers.ts` and applied to every route via `next.config.ts`. The same module drives two regression checks:

- `lib/security-headers.test.ts` — Vitest unit coverage asserting the policy rejects unsafe inline scripts and cross-origin framing.
- `tests/security-headers.spec.ts` — a Playwright preview check that asserts the headers on representative routes and a hashed static asset. Point it at a deployed preview with `BASE_URL=https://<preview> npx playwright test tests/security-headers.spec.ts --project=chromium`, or run it locally against the prod build with `npm run test:security-headers`. See `design/security-headers-check.md`.

Running a single browser locally
Pass --project=<name> to target one browser:

Bash

npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
You can also scope to a single spec file at the same time:

Bash

npx playwright test tests/wallet.spec.ts --project=firefox
Retries
Tests run with 0 retries locally. In CI (CI=true) each test is retried up to 2 times to absorb transient flakes.

Performance Optimization & Code-Splitting
Target performance optimizations were applied across the landing page and dashboard to improve First Paint, LCP (Largest Contentful Paint), and TBT (Total Blocking Time).

Key Changes
Below-the-Fold Dynamic Imports: Code-split HowItWorks, EnterpriseSolutionSection, and FAQSection on the landing page (components/landing/landing-page.tsx) using next/dynamic to keep the initial HTML payload lightweight.
Chart & Insights Code-Splitting: Dynamically loaded the recharts-heavy component (AnalyticsViews) and KPI metrics (AnalyticsInsights) with structural skeleton fallbacks equipped with accessibility attributes (aria-busy="true" and aria-live="polite").
Optimized Layout Animations: Replaced framer-motion JS-driven layout width transitions on the sidebar container (components/common/side-bar.tsx) with pure CSS grid animations to prevent layout thrashing and lower Total Blocking Time (TBT).
Hero Image Optimization: Upgraded native img tags for the network logo assets inside the above-the-fold Hero component (components/landing/hero.tsx) to Next.js Image components with explicit dimensions.
Bundle Size Impact (next build Route JS)
Route Metric Before After Change
/landing (Pages Router) Route Size 64.1 kB 26.1 kB -38.0 kB (-59.3%)
/landing (Pages Router) First Load JS 165 kB 127 kB -38.0 kB (-23.0%)
Bundle Budget
We maintain a CI-enforced bundle budget for key routes to ensure fast first-load performance.

Route Budget Current First Load JS
/ (Landing) 225 kB 213 kB
/dashboard 180 kB 165 kB
/auth/login 200 kB TBD
/auth/sign-up 200 kB TBD
These budgets are enforced in CI by `scripts/check-bundle-size.js`. The auth routes are intentionally kept at or below 200 kB first-load JS because they are conversion-critical pages that must load quickly for users arriving from marketing campaigns.

To run the bundle analyzer locally:

Bash

npm run analyze
Candidate Wins for Optimization
Icon deduplication: We currently have multiple icon libraries (lucide-react, hugeicons, react-icons). Consolidating all icons to lucide-react will significantly reduce the shared bundle size.
Dynamic imports for Recharts: Use next/dynamic for chart components in AnalyticsViews and AnalyticsInsights to move heavy visualization logic out of the critical path.
Centralized Demo Data & Illustrative Stats
To prevent hardcoded realistic PII (Personal Identifiable Information) and fabricated marketing trust metrics from being shipped inline in production components, this project uses a centralized demo-data configuration located at lib/demo-data.ts.

Security Compliance: All mockup emails, phone numbers, and wallet addresses are set to standard, obvious placeholder domains/values (e.g. example.com, +1 555 0100, and redacted addresses like GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX). This reduces compliance exposure and prevents test/seed data from being mistaken for active production credentials.
Illustrative Marketing Stats: Landing page statistics are managed via the same config file and clearly decorated with visual badges indicating they are illustrative placeholders.
Backend Integration: These structures are designed to be easily replaced by backend API hooks once user authentication, profile retrieval, and wallet connectivity endpoints are finalized.
Metadata and Open Graph Architecture
Route-level metadata is defined across application routes in the Next.js App Router to ensure optimal SEO, canonical URLs, and distinct social preview cards (Open Graph / Twitter).

Metadata Configurations
Root Layout (app/layout.tsx): Defines root default title templates, fallback description, global site name, and default dynamic /opengraph-image preview card.
Dashboard (app/dashboard/layout.tsx): Configures route title, description, canonical URL (https://stellopay.com/dashboard), custom Open Graph image (/dashboard-preview.jpg), and private route robots: { index: false, follow: false } directives.
Transactions (app/transactions/layout.tsx): Configures route title, description, canonical URL (https://stellopay.com/transactions), Open Graph image (/opengraph-image), and robots: { index: false, follow: false } directives.
Settings & Preferences (app/settings/preferences/layout.tsx): Configures route title, description, canonical URL (https://stellopay.com/settings/preferences), Open Graph image (/opengraph-image), and robots: { index: false, follow: false } directives.
Testing and Validation
All metadata exports are covered by unit tests in app/metadata.test.ts to verify uniqueness of titles/descriptions, correct canonical URLs, Open Graph parameters, and fallback logic.

Font loading and first paint
The landing-page hero uses local Clash Display and General Sans variable
fonts. Their loading configuration is defined in app/layout.tsx:

preload: true asks next/font/local to emit a <link rel="preload" as="font"> for each above-the-fold font. Next.js supplies the emitted,
fingerprinted URL and the correct type/crossorigin attributes, avoiding
stale or duplicate hand-written links.
Both local font faces set display: "swap". Text therefore remains visible
in its system-font fallback while a slow font download completes; this avoids
FOIT. The General Sans CSS variable is --font-general-sans, matching the
existing typography tokens in app/globals.css.
This change alters font delivery only: it does not add focusable UI or modify
colours, ARIA semantics, responsive breakpoints (sm, md, lg, xl), or
dark-mode tokens. The existing skip link, keyboard navigation, and WCAG 2.1 AA
contrast remain intact.

Verification
Run the focused contract test and production build:

Bash

npx vitest run app/metadata.test.ts --coverage.enabled=false
npm run type-check
npm run build
For a deployment-specific LCP comparison, use a fresh Chrome profile and the
same landing-page URL for both revisions. In DevTools Performance, select a
mobile device, disable cache, set Slow 4G with 4× CPU slowdown, record a
reload, and note the LCP marker. Repeat at least three times per revision and
compare the medians. The preload requests should begin in the document head
before hero text is discovered; exact LCP values depend on the host, cache, and
network, so they should be captured in CI or the target deployment rather than
claimed from a local build.
