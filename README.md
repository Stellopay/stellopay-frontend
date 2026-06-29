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

Please see our [Contributing Guide](CONTRIBUTING.md) for details on project structure, the data-layer pattern, testing, and conventions.

## Routing

This project is **App-Router-only**. All routes, layouts, and pages live under `app/`; the legacy `pages/` directory was removed (#290). Do not add a `pages/` directory.

## Getting Started

### Prerequisites

- Node.js 20 LTS
- npm — this is the only supported package manager for this repo. `package-lock.json` is the single source of truth for dependency versions; do not generate or commit a `yarn.lock` or `pnpm-lock.yaml` (see [CONTRIBUTING.md](CONTRIBUTING.md)). A `preinstall` check (`scripts/check-package-manager.js`) fails the install if one is present.

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

## Wallet and network state

The connected wallet and the active network live in a single React context, `WalletProvider`, declared in `context/wallet-context.tsx`. The provider is wrapped around the entire app in the App Router (`app/layout.tsx`), so every surface that needs to know which account or network is active reads from the same source of truth.

Read the context with the `useWallet` hook. Calling it outside of a `WalletProvider` throws an explicit error, which makes provider wiring issues fail loudly during development instead of silently rendering placeholder data.

```tsx
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
```

The context exposes:

- `address` — the public Stellar G-address of the connected wallet, or `null` when disconnected. Only public material is ever stored or logged. The provider refuses any value that looks like a Stellar secret key (`S` followed by 55 base32 characters).
- `isConnected` — derived from `address !== null`. Use this for branching rather than null-checking the address yourself.
- `network` — a `{ id, name }` pair from `SUPPORTED_NETWORKS`. Defaults to Stellar.
- `connect(address?)` — populates the address. Without an argument it uses a synthetic Stellar-style address for the demo flow. A real wallet integration replaces the body of this function without changing the public surface.
- `disconnect()` — clears the address. The network selection survives a disconnect.
- `setNetwork(network)` — switches the active network and persists the id in `localStorage` under `stellopay.wallet.network`. Hydration on the client follows the same SSR-safe pattern as `ThemeProvider` and `SidebarProvider`, so the server render and the first client render agree and React does not flag a hydration mismatch. The address itself is never persisted, so a page reload always returns to a disconnected state.

### Surfaces that read the context

- `components/common/network-switcher.tsx` reads the active network and the supported network list from the context. It keeps the existing confirmation dialog, and the `selectedNetwork` and `onNetworkChange` props still work for callers that want to treat the switcher as a controlled component.
- `components/dashboard/account-overview.tsx` shows a `Connect Wallet` CTA when disconnected and the truncated context address when connected.
- `components/dashboard/dashboard-navbar.tsx` mirrors the address pill and the network badge from the same context, so the navbar and the dashboard body never disagree.

### Tests

- `context/wallet-context.test.tsx` — Vitest unit coverage for the reducer surface, the localStorage hydration, the secret-key guard, and the `useWallet` outside-provider error.
- `tests/wallet.spec.ts` — Playwright end-to-end coverage for the connect, disconnect, switch network, cancel switch, and reload-persistence flows on `/dashboard`.

Run the unit suite with `npm test` and the end-to-end suite with `npx playwright test tests/wallet.spec.ts`.

## Error handling

The App Router uses two cooperating client boundaries.

`app/error.tsx` is the route-segment boundary. Any uncaught render or runtime error inside a route segment is caught here. It renders inside the root layout, so it has access to theme tokens and shared UI: a generic "Something went wrong" surface built from `bg-background`, `text-foreground`, and `text-destructive`, plus a "Try again" action wired to the `reset()` callback Next.js passes in, and a "Go to dashboard" escape hatch. The surface uses `role="alert"` and `aria-live="assertive"` so assistive tech announces it. In production, the raw `error.message` and `error.stack` are never rendered; the underlying message is only revealed when `process.env.NODE_ENV !== "production"` to keep debugging cheap locally. The `error.digest` Next.js attaches in production is logged through `console.error` so it can be correlated with server logs, but it is intentionally not surfaced in the UI.

`app/global-error.tsx` is the wider safety net for when the root layout itself or one of its providers throws. It ships its own `<html>/<body>` shell with inline styles because the layout that loads `globals.css` is exactly what failed.

Coverage for `app/error.tsx` is gated by the same 95% thresholds as the rest of the suite via `vitest.config.ts`. See `app/error.test.tsx` for the unit coverage.

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
The context provider is configured in `context/theme-context.tsx` and wraps the root layout in `app/layout.tsx`.

You can access and toggle the theme programmatically in components using the custom hook:

```tsx
import { useTheme } from "@/context/theme-context";

export default function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  // Access current theme ("light" or "dark")
  console.log(theme);
  
  // Toggle between light and dark themes
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

- **Theme Toggle UI**: Located in the top-right corner within `components/landing/navbar.tsx`.
- **System Preference**: Falls back to the system's preferred color scheme if no preference is stored in `localStorage`.
- **Tailwind Integration**: Utilizes Tailwind's native `dark:` modifier (e.g. `bg-white dark:bg-zinc-900`) for styling.

## Testing

- `npm run test` runs the Vitest unit suite with coverage for utils (auth, transactions, pagination, dates), auth schemas, and select components. Coverage thresholds are enforced at 95% (lines/branches/functions/statements) for the files listed in `vitest.config.ts`.
- `npm run test:watch` runs Vitest in watch mode while developing unit tests.
- `npm run test:e2e` runs the full Playwright suite under `tests/**/*.spec.ts` and `e2e/**/*.spec.ts` across **chromium**, **firefox**, and **webkit** against a local dev server.
- Unit tests for `utils/*.ts` are colocated as `utils/<name>.test.ts` (e.g. [`utils/date-utils.test.ts`](utils/date-utils.test.ts)); Playwright specs live under `tests/*.spec.ts`.

### Covered Flows

- **Authentication**: Validation rules (email format, strong passwords matching), form state, and UI feedback for Login (`tests/auth-login.spec.ts`), Sign-up (`tests/auth-signup.spec.ts`), and Email Verification (`tests/verify-email.spec.ts`).
- **Wallet**: Connect, disconnect, and network switching (`tests/wallet.spec.ts`).
- **Dashboard**: Account overview, settings, and paginated transactions (`tests/dashboard.spec.ts`, `tests/settings.spec.ts`, `tests/pagination.spec.ts`).

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

### Running a single browser locally

Pass `--project=<name>` to target one browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

You can also scope to a single spec file at the same time:

```bash
npx playwright test tests/wallet.spec.ts --project=firefox
```

### Retries

Tests run with **0 retries** locally. In CI (`CI=true`) each test is retried up to **2 times** to absorb transient flakes.

## Performance Optimization & Code-Splitting

Target performance optimizations were applied across the landing page and dashboard to improve First Paint, LCP (Largest Contentful Paint), and TBT (Total Blocking Time).

### Key Changes
1. **Below-the-Fold Dynamic Imports**: Code-split `HowItWorks`, `EnterpriseSolutionSection`, and `FAQSection` on the landing page ([`components/landing/landing-page.tsx`](components/landing/landing-page.tsx)) using `next/dynamic` to keep the initial HTML payload lightweight.
2. **Chart & Insights Code-Splitting**: Dynamically loaded the recharts-heavy component ([`AnalyticsViews`](components/analytics/client-analytics-view.tsx)) and KPI metrics ([`AnalyticsInsights`](components/dashboard/dashboard-page.tsx)) with structural skeleton fallbacks equipped with accessibility attributes (`aria-busy="true"` and `aria-live="polite"`).
3. **Optimized Layout Animations**: Replaced `framer-motion` JS-driven layout width transitions on the sidebar container ([`components/common/side-bar.tsx`](components/common/side-bar.tsx)) with pure CSS grid animations to prevent layout thrashing and lower Total Blocking Time (TBT).
4. **Hero Image Optimization**: Upgraded native `img` tags for the network logo assets inside the above-the-fold Hero component ([`components/landing/hero.tsx`](components/landing/hero.tsx)) to Next.js `Image` components with explicit dimensions.

### Bundle Size Impact (`next build` Route JS)

| Route | Metric | Before | After | Change |
|-------|--------|--------|-------|--------|
| `/landing` (Pages Router) | Route Size | 64.1 kB | 26.1 kB | **-38.0 kB (-59.3%)** |
| `/landing` (Pages Router) | First Load JS | 165 kB | 127 kB | **-38.0 kB (-23.0%)** |

### Bundle Budget

We maintain a CI-enforced bundle budget for key routes to ensure fast first-load performance.

| Route | Budget | Current First Load JS |
|-------|--------|-----------------------|
| `/` (Landing) | 225 kB | 213 kB |
| `/dashboard` | 180 kB | 165 kB |

To run the bundle analyzer locally:
```bash
npm run analyze
```

#### Candidate Wins for Optimization
- **Icon deduplication**: We currently have multiple icon libraries (`lucide-react`, `hugeicons`, `react-icons`). Consolidating all icons to `lucide-react` will significantly reduce the shared bundle size.
- **Dynamic imports for Recharts**: Use `next/dynamic` for chart components in `AnalyticsViews` and `AnalyticsInsights` to move heavy visualization logic out of the critical path.

## Centralized Demo Data & Illustrative Stats

To prevent hardcoded realistic PII (Personal Identifiable Information) and fabricated marketing trust metrics from being shipped inline in production components, this project uses a centralized demo-data configuration located at `lib/demo-data.ts`.

- **Security Compliance**: All mockup emails, phone numbers, and wallet addresses are set to standard, obvious placeholder domains/values (e.g. `example.com`, `+1 555 0100`, and redacted addresses like `GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX`). This reduces compliance exposure and prevents test/seed data from being mistaken for active production credentials.
- **Illustrative Marketing Stats**: Landing page statistics are managed via the same config file and clearly decorated with visual badges indicating they are illustrative placeholders.
- **Backend Integration**: These structures are designed to be easily replaced by backend API hooks once user authentication, profile retrieval, and wallet connectivity endpoints are finalized.
