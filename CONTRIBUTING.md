# Contributing to Stellopay Frontend

First off, thank you for considering contributing to Stellopay! This document outlines our conventions and workflow to make the process as smooth as possible.

## Package manager

This repo uses **npm** exclusively. `package-lock.json` is the single source of truth for dependency resolution, and CI installs with `npm ci`.

- Install dependencies: `npm install`
- Reproducible install (CI / clean clone): `npm ci`
- Do not use `yarn` or `pnpm` to install or add dependencies — they generate `yarn.lock` / `pnpm-lock.yaml`, which drift from `package-lock.json` and risk inconsistent dependency versions between contributors and CI.
- A `preinstall` check (`scripts/check-package-manager.js`) fails the install if a `yarn.lock` or `pnpm-lock.yaml` file is present in the repo root. If you see that error, delete the stray lockfile and re-run `npm install`.

If you need to add or update a dependency, run `npm install <package>` (or `npm update`) and commit the resulting changes to `package.json` and `package-lock.json` together.

## Project Structure (App Router)

We exclusively use the **Next.js App Router** (no `pages/` directory). Here is our core structure:

- `app/`: All routes, layouts, and page components. Do not create a `pages/` directory.
- `components/`: Reusable UI components (buttons, inputs, cards, etc.).
- `hooks/`: Custom React hooks.
- `lib/`: Business logic, third-party service clients, and data access.
- `utils/`: Small utility functions and helpers.
- `types/`: TypeScript definitions and interfaces.

## Data-Layer Rules

We enforce a strict separation of concerns for data access.

- **Always** import data functions from `lib/api`.
- **Never** import mock data directly (e.g., `public/data/mock-data.ts`).
- **Never** import internal transaction utilities directly (e.g., `lib/transactions`).

All data access must be routed through the established `lib/api` layer to ensure consistency and future-proof our backend integrations.

## Linting Rules

We treat lint as the cheapest quality gate, so a few rules are enforced beyond
the Next.js defaults (`next/core-web-vitals` + `next/typescript`). Run them with:

```bash
npm run lint
```

### `no-console`

`console.log`, `console.info`, `console.debug`, etc. are **errors**. Only
`console.warn` and `console.error` are allowed, and only for genuine,
user-impacting diagnostics.

> **Why:** stray logging can leak sensitive data — emails, verification codes,
> or wallet addresses — into the browser console. Removing it keeps that data
> out of client logs. Use a real handler (or a `// TODO` marker) instead of a
> placeholder `console.log`.

### Explicit return types on module boundaries

`@typescript-eslint/explicit-module-boundary-types` is enabled for non-component
TypeScript modules (`**/*.ts` — e.g. `lib/`, `utils/`, `hooks/`). Exported
functions must declare an explicit return type:

```ts
// ❌ ambiguous public signature
export function getTransactions(params) { ... }

// ✅ explicit, self-documenting
export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<PaginatedTransactions> { ... }
```

> **Why:** explicit return types document the public contract of our data and
> utility layers and catch accidental type widening before it ships.

**Scope:** React components (`.tsx`) are intentionally exempt — their return
type (JSX) is self-evident. Test files (`*.test.*`, `*.spec.*`, `e2e/`,
`tests/`) are also exempt from `no-console` and the return-type rule so mocks
and debugging stay frictionless.

### Icon imports

`react-icons` and `@hugeicons/*` are restricted — always import icons from
`lucide-react`.

## Testing Expectations

We expect all new utility functions and business logic to have **minimum 95% test coverage**.

### Test Commands

- **Unit Tests (Vitest):**

  ```bash
  npm run test
  ```

  Runs the Vitest unit suite (including coverage checks).

- **E2E Tests (Playwright):**

  ```bash
  npm run test:e2e
  ```

  Runs local end-to-end tests.

- **Type Checking:**
  ```bash
  npm run type-check
  ```
  Runs TypeScript compiler (`tsc --noEmit`) to verify types without building.

## Branching, Commits, and PRs

1. **Branch Naming**: Use descriptive branch names like `feat/feature-name`, `fix/bug-name`, or `docs/doc-update`.
2. **Commit Style**: Use Conventional Commits (e.g., `feat: add new button`, `fix: correct typo in hero`).
3. **Pull Requests**: Please use the standard PR template (`#55`). Ensure that all tests pass (`npm run test && npm run test:e2e`) and that no secrets or real PII are included in your examples.

### Security Notes

Examples must not include real secrets, tokens, or addresses. Always use placeholder domains (e.g., `example.com`) and redacted addresses in your tests and mockups.
