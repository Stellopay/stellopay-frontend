# Contributing to Stellopay Frontend

First off, thank you for considering contributing to Stellopay! This document outlines our conventions and workflow to make the process as smooth as possible.

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
