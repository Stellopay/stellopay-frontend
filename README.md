# StelloPay Frontend

StelloPay is a payroll and crypto payments platform built on the Stellar blockchain. This repository contains the web frontend: the marketing/landing site, authentication flows, and an authenticated dashboard for managing transactions, account summaries, and settings.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Turbopack dev server)
- **UI**: [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) with [Radix UI](https://www.radix-ui.com) primitives and `shadcn`-style components
- **Forms & validation**: [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **Date handling**: [date-fns](https://date-fns.org) (see [`utils/date-utils.ts`](utils/date-utils.ts))
- **Unit testing**: [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- **E2E testing**: [Playwright](https://playwright.dev)

## Getting Started

### Prerequisites

- Node.js 20 LTS
- npm — this is the only supported package manager for this repo. `package-lock.json` is the single source of truth for dependency versions; do not generate or commit a `yarn.lock` or `pnpm-lock.yaml` (see [CONTRIBUTING.md](CONTRIBUTING.md)).

### Setup

```bash
git clone <repository-url>
cd stellopay-frontend
npm install
```

No environment variables are required to run the app locally — the dashboard is currently backed by mock data in [`public/data/mock-data.ts`](public/data/mock-data.ts) and [`lib/demo-data.ts`](lib/demo-data.ts).

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app. The page auto-updates as you edit files under `app/`.

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev server | `npm run dev` | Starts Next.js with Turbopack |
| Build | `npm run build` | Production build |
| Start | `npm run start` | Serves the production build |
| Lint | `npm run lint` | ESLint via `next lint` |
| Type-check | `npm run type-check` | `tsc --noEmit` |
| Unit tests | `npm run test` | Vitest with coverage |
| Unit tests (watch) | `npm run test:watch` | Vitest in watch mode |
| E2E tests | `npm run test:e2e` | Playwright (`npx playwright test`) |
| Format | `npm run prettier` | Prettier write |

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

## Testing

- `npm run test` runs the Vitest unit suite with coverage for utils (auth, transactions, pagination, dates), auth schemas, and select components. Coverage thresholds are enforced at 95% (lines/branches/functions/statements) for the files listed in `vitest.config.ts`.
- `npm run test:watch` runs Vitest in watch mode while developing unit tests.
- `npm run test:e2e` runs the Playwright suite under `tests/**/*.spec.ts` and `e2e/**/*.spec.ts` against a local dev server.
- Unit tests for `utils/*.ts` are colocated as `utils/<name>.test.ts` (e.g. [`utils/date-utils.test.ts`](utils/date-utils.test.ts)); Playwright specs live under `tests/*.spec.ts`.

### Date utilities

All date parsing, formatting, and range-checking lives in a single module, [`utils/date-utils.ts`](utils/date-utils.ts), built on `date-fns` for deterministic, locale-independent output. Invalid input fails safely: `parseTransactionDate` returns `null` and `formatDate` returns `""` rather than throwing.

### Accessibility testing

Automated accessibility scanning runs as part of the Playwright suite using [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright), so a11y regressions (missing labels, low-contrast text, incorrect roles) fail CI the same way a broken assertion would — not just at design-review time.

- **Shared helper**: [`tests/axe-helper.ts`](tests/axe-helper.ts) exports `expectNoSeriousA11yViolations(page, options?)`, which scans the current page against WCAG 2.x A/AA + best-practice rules and fails the test if any **serious** or **critical** violation is found.
- **Where it runs**: [`tests/auth-forms.spec.ts`](tests/auth-forms.spec.ts) (`/auth/login`, `/auth/sign-up`), [`tests/dashboard.spec.ts`](tests/dashboard.spec.ts) (`/dashboard`), and [`tests/pagination.spec.ts`](tests/pagination.spec.ts) (`/transactions`).
- **Severity thresholds**: `minor`/`moderate` violations are logged via `console.warn` (visible in the Playwright report) but do not fail the build — they're worth fixing but shouldn't block shipping. `serious`/`critical` violations fail the test.
- **Triaged allowlist**: a known issue that can't be fixed immediately should be allowlisted explicitly, not silenced wholesale — pass it via the `allowlist` option with a `reason` (ideally linking a tracking issue):

  ```ts
  await expectNoSeriousA11yViolations(page, {
    allowlist: [
      { id: "color-contrast", reason: "Tracked in #999 — pending design token update" },
    ],
  });
  ```

  Allowlisted violations still print to the console on every run so they stay visible instead of disappearing.

**Running scans locally:**

```bash
npx playwright test                                # full suite, includes a11y scans
npx playwright test tests/dashboard.spec.ts         # a single spec
npx playwright show-report                          # inspect the last HTML report
```

**Interpreting a failure**: the test output includes the axe rule id, impact level, the number of affected DOM nodes (with selectors), and a `helpUrl` linking to the deque rule documentation explaining the fix. Reproduce locally with `npx playwright test --headed <file>` to inspect the flagged elements in the browser.

## Iconography

To keep the application's bundle light and ensure visual consistency, the project consolidates all UI icons onto **Lucide React** (`lucide-react`) as the single primary icon set.

### Guidelines
- **Primary Set**: Use `lucide-react` for all UI icons.
- **Custom / Brand Icons**: For brand logos or unique custom shapes (e.g., `StellOpayLogo`, `StellarIcon`), use raw SVG components located in [`public/svg/svg.tsx`](public/svg/svg.tsx) or local custom components.
- **Restricted Libraries**: Do NOT import from `react-icons`, `@hugeicons/react`, or `@hugeicons/core-free-icons`.

### Guardrails
- **ESLint Rule**: The `no-restricted-imports` rule in [`.eslintrc.json`](.eslintrc.json) blocks imports from restricted packages.
- **CI Guard Test**: [`utils/import-guard.test.ts`](utils/import-guard.test.ts) scans all source files in `app/` and `components/` to verify no prohibited icon libraries are referenced.

## Networks

[`components/common/network-switcher.tsx`](components/common/network-switcher.tsx) lets the user pick which Stellar network the app is operating against. The default `Network[]` is Stellar's public networks — Mainnet (`public`), Testnet, and Futurenet — each carrying its public network passphrase so callers can resolve the matching Horizon/RPC endpoint:

| id | name | passphrase |
| --- | --- | --- |
| `public` | Mainnet | `Public Global Stellar Network ; September 2015` |
| `testnet` | Testnet | `Test SDF Network ; September 2015` |
| `futurenet` | Futurenet | `Test SDF Future Network ; October 2022` |

These passphrases are public Stellar protocol constants, not secrets — no private keys or seeds are stored or rendered by this component. Switching networks only updates which balances/operations are displayed; it never moves funds.

## CI Pipeline

Every pull request and push to `main` runs two jobs via `.github/workflows/ci.yml`:

| Job | Step | Command | Purpose |
|-----|------|---------|---------|
| `lint-typecheck-build` | Install dependencies | `npm ci` | Reproducible install from lockfile |
| | Unit Tests | `npm run test` | Vitest utility/schema tests for auth, transaction, pagination, and date utils, plus auth schemas |
| | Lint | `npm run lint` | ESLint via `next lint` |
| | Type-check | `npm run type-check` | `tsc --noEmit` — catches type errors |
| | Build | `npm run build` | Full Next.js production build |
| `playwright` | Install Playwright browsers | `npx playwright install --with-deps chromium` | Provision the Chromium runtime used by the suite |
| | E2E + accessibility | `npx playwright test` | Full Playwright suite, including the axe-core a11y scans described in [Accessibility testing](#accessibility-testing) — a serious/critical violation fails this job |

On failure, the `playwright` job uploads the HTML report as a build artifact (`playwright-report`, retained 7 days) so violations and traces can be inspected without re-running locally.

**Node version:** 20 LTS (matches `@types/node ^20`).

**Security:** workflow permissions are `contents: read`; actions are pinned to major version tags; `pull_request` trigger is used (not `pull_request_target`) so fork PRs cannot access repository secrets.

## Performance Optimization & Code-Splitting

Target performance optimizations were applied across the landing page and dashboard to improve First Paint, LCP (Largest Contentful Paint), and TBT (Total Blocking Time).

### Key Changes
1. **Below-the-Fold Dynamic Imports**: Code-split `HowItWorks`, `EnterpriseSolutionSection`, and `FAQSection` on the landing page ([`pages/landing/index.tsx`](pages/landing/index.tsx)) using `next/dynamic` to keep the initial HTML payload lightweight.
2. **Chart & Insights Code-Splitting**: Dynamically loaded the recharts-heavy component ([`AnalyticsViews`](components/analytics/client-analytics-view.tsx)) and KPI metrics ([`AnalyticsInsights`](components/dashboard/dashboard-page.tsx)) with structural skeleton fallbacks equipped with accessibility attributes (`aria-busy="true"` and `aria-live="polite"`).
3. **Optimized Layout Animations**: Replaced `framer-motion` JS-driven layout width transitions on the sidebar container ([`components/common/side-bar.tsx`](components/common/side-bar.tsx)) with pure CSS grid animations to prevent layout thrashing and lower Total Blocking Time (TBT).
4. **Hero Image Optimization**: Upgraded native `img` tags for the network logo assets inside the above-the-fold Hero component ([`components/landing/hero.tsx`](components/landing/hero.tsx)) to Next.js `Image` components with explicit dimensions.

### Bundle Size Impact (`next build` Route JS)

| Route | Metric | Before | After | Change |
|-------|--------|--------|-------|--------|
| `/landing` (Pages Router) | Route Size | 64.1 kB | 26.1 kB | **-38.0 kB (-59.3%)** |
| `/landing` (Pages Router) | First Load JS | 165 kB | 127 kB | **-38.0 kB (-23.0%)** |

## Centralized Demo Data & Illustrative Stats

To prevent hardcoded realistic PII (Personal Identifiable Information) and fabricated marketing trust metrics from being shipped inline in production components, this project uses a centralized demo-data configuration located at `lib/demo-data.ts`.

- **Security Compliance**: All mockup emails, phone numbers, and wallet addresses are set to standard, obvious placeholder domains/values (e.g. `example.com`, `+1 555 0100`, and redacted addresses like `GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX`). This reduces compliance exposure and prevents test/seed data from being mistaken for active production credentials.
- **Illustrative Marketing Stats**: Landing page statistics are managed via the same config file and clearly decorated with visual badges indicating they are illustrative placeholders.
- **Backend Integration**: These structures are designed to be easily replaced by backend API hooks once user authentication, profile retrieval, and wallet connectivity endpoints are finalized.
