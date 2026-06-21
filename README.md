# Stellopay Frontend

Stellopay is a Next.js App Router frontend for blockchain payroll, wallet-aware account workflows, transaction review, analytics, and settings management. The project is currently demo-data driven, with API adapter seams in `lib/` and `hooks/` so backend integration can replace mock data without reshaping the UI.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Vitest and Testing Library for unit/component tests
- Playwright for end-to-end flows
- Lucide React as the primary UI icon set

## Getting Started

Install dependencies from the npm lockfile:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev              # Start Next.js locally
npm run build            # Production build
npm run type-check       # TypeScript no-emit check
npm run lint             # Next lint command
npm run test             # Vitest unit suite with coverage
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright suite
npm run test:e2e:settings
```

## Project Layout

```text
app/                 App Router routes and route-level UI
components/          Shared UI, landing, dashboard, analytics, transactions
context/             React providers such as wallet and theme state
hooks/               Data-loading and feature hooks
lib/                 Demo data, API adapters, and app-level data helpers
public/              Static image and SVG assets
tests/               Playwright end-to-end specs
types/               Shared TypeScript interfaces
utils/               Pure utility modules and unit tests
```

## Data And Utilities

Demo records live in `lib/demo-data.ts`. They use placeholder domains, redacted wallet addresses, and illustrative metrics so production-looking PII is not embedded in component code.

Date helpers are centralized in `utils/dateUtils.ts`:

- `formatDate`
- `formatDateForInput`
- `formatDateForDisplay`
- `parseTransactionDate`
- `isDateInRange`
- `getCurrentDate`

Keep new date parsing and formatting behavior in this module and cover it in `utils/dateUtils.test.ts`.

## Wallet And Network State

The connected wallet and active network live in `WalletProvider`, declared in `context/wallet-context.tsx`. The provider is wired through the App Router layout so dashboard, network switcher, and account surfaces share one source of truth.

Use the `useWallet` hook to read:

- `address`
- `isConnected`
- `network`
- `connect(address?)`
- `disconnect()`
- `setNetwork(network)`

Only public wallet addresses are represented. The provider rejects Stellar secret-key shaped values and does not persist private material.

## Testing

Run focused tests while developing:

```bash
node node_modules/vitest/vitest.mjs run utils/dateUtils.test.ts
node node_modules/vitest/vitest.mjs run components/analytics/analytics-view.test.tsx
node node_modules/@playwright/test/cli.js test tests/settings.spec.ts
```

Use `npm run test` before larger PRs when coverage output is needed, and `npm run test:e2e` for browser workflows.

## Accessibility And UI Conventions

- Use shared UI primitives from `components/ui/` where available.
- Use `role="status"` with polite live regions for empty/loading async states.
- Use `role="alert"` for user-visible failures.
- Keep icons from `lucide-react` unless a brand asset or local custom SVG is required.
- Do not render raw exception messages, stack traces, private keys, seed phrases, or wallet secrets.

## CI

Pull requests are expected to run:

| Step | Command |
| --- | --- |
| Install | `npm ci` |
| Unit tests | `npm run test` |
| Lint | `npm run lint` |
| Type-check | `npm run type-check` |
| Build | `npm run build` |

Node 20 LTS is the target runtime, matching `@types/node`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions, data-layer patterns, branch guidance, and PR expectations.
