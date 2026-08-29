# Playwright E2E & Accessibility — Inventory & Gating Policy

Companion to [Stellopay/stellopay-frontend#1161](https://github.com/Stellopay/stellopay-frontend/issues/1161).
This document classifies all 24 Playwright specs and records the gating/flake
decisions for the `e2e-a11y.yml` workflow.

## Local-run caveat (read first)

A true local pass/fail inventory could **not** be produced in this environment
because the application does not currently compile:

- `npm ci` fails — `package-lock.json` is out of sync with `package.json`
  (pre-existing; tracked by the separate unit-pipeline issue). `npm install`
  regenerates it but that is intentionally out of scope here.
- Even after install, `next dev` crashes on `app/globals.css:90` —
  `CssSyntaxError: Unknown word --chart-1`. This is one of the "seven files
  that currently fail to parse" called out as out of scope in #1161, so it is
  **not** fixed here. Because the dev server never comes up, no Playwright
  suite can execute against it locally.

The classification below is therefore a **static analysis** of each spec
(imports, routes visited, backend/seed usage). It is the recommended starting
point; once the parse-fix and lockfile issues land, the `e2e-a11y.yml` workflow
becomes the live source of truth for the pass/fail inventory.

## Per-spec classification

Legend: **GATE (PR)** = fast/deterministic, gated on every PR via the a11y
job. **NIGHTLY** = run by the full nightly matrix (needs a backend/seeded data
or is visual-regression sensitive). **OBSOLETE** = candidate for removal (none
found).

| # | Spec | Class | Rationale |
| --- | --- | --- | --- |
| 1 | `tests/a11y.spec.ts` | **GATE (PR)** | Dedicated accessibility suite; fast, deterministic, no backend. |
| 2 | `e2e/tabs-a11y.spec.ts` | **GATE (PR)** | Tab/role a11y semantics; deterministic. |
| 3 | `tests/theme.spec.ts` | GATE (PR) | Pure UI theme toggle; no backend. |
| 4 | `tests/landing.spec.ts` | GATE (PR) | Static landing UI; no backend. |
| 5 | `tests/landing-mobile-menu-persistence.spec.ts` | GATE (PR) | UI persistence; no backend. |
| 6 | `tests/sidebar-persistence.spec.ts` | GATE (PR) | UI persistence; no backend. |
| 7 | `tests/cookie-consent.spec.ts` | GATE (PR) | UI consent banner; no backend. |
| 8 | `tests/pagination.spec.ts` | GATE (PR) | UI list pagination; no backend. |
| 9 | `tests/dashboard.spec.ts` | GATE (PR) | Dashboard UI; reads from app API routes, no external backend. |
| 10 | `tests/account-summary.spec.ts` equivalent | GATE (PR) | Account summary UI; no external backend. |
| 11 | `tests/analytics-view.spec.ts` | GATE (PR) | Analytics UI; no external backend. |
| 12 | `tests/network-switcher.spec.ts` | GATE (PR) | Network switcher UI (Radix dialogs); no external backend. |
| 13 | `tests/settings.spec.ts` | GATE (PR) | Settings UI incl. client-side secret-seed rejection; no external backend. |
| 14 | `tests/settings-search.spec.ts` | GATE (PR) | Settings search UI; no backend. |
| 15 | `tests/settings-notifications.spec.ts` | GATE (PR) | Notification/2FA toggles UI; no backend. |
| 16 | `tests/settings-wallets.spec.ts` | GATE (PR) | Wallet management UI; client-side validation. |
| 17 | `tests/wallet.spec.ts` | GATE (PR) | Wallet UI; no external backend. |
| 18 | `tests/auth-forms.spec.ts` | GATE (PR) | Login/signup *form* behavior (password toggle, validation) — exercises UI only. |
| 19 | `tests/auth-signup-keyboard.spec.ts` | GATE (PR) | Keyboard navigation of the signup form; UX only. |
| 20 | `tests/auth-login.spec.ts` | **NIGHTLY** | Submits a real login — depends on the auth backend/API; flaky without a seeded identity provider in CI. |
| 21 | `tests/auth-signup.spec.ts` | **NIGHTLY** | Submits a real signup — depends on the auth backend/API. |
| 22 | `tests/verify-email.spec.ts` | **NIGHTLY** | Email-verification flow — depends on the auth backend/email infra. |
| 23 | `e2e/demo-data.spec.ts` | **NIGHTLY** | Relies on seeded demo data; needs a seeded backend in CI. |
| 24 | `tests/dark-mode-screenshots.spec.ts` | **NIGHTLY** | Visual-regression (pixel diff) — sensitive to environment rendering; better watched than gating. |

No spec was found to be obsolete; none are deleted or weakened.

## Blocking vs scheduled

- **PR gate:** the two accessibility suites (`a11y.spec.ts`, `tabs-a11y.spec.ts`)
  plus the self-contained UI specs above. These are fast, deterministic, and do
  not require an external backend, so a red run is almost always a real
  regression — safe to block merges on.
- **Nightly:** the auth flows, demo-data, and visual-regression specs. They need
  a running/seeded backend (not yet present in CI) or are pixel-sensitive, so
  blocking every PR on them would cause avoidable friction. They are watched
  nightly so regressions are still caught within 24h. Once backend/seed infra
  exists in CI, the auth/demo specs can be promoted to the PR gate.

## Flake policy

- `playwright.config.ts` already sets `retries: 2` in CI — transient failures
  are retried before a job is marked red. This is the implemented flake
  absorption.
- **No auto-disable.** A spec that fails consistently is triaged (filed as an
  issue / quarantined), never silently removed, and never quietly excluded to
  force green. The nightly job failing is the intended signal, not a defect to
  hide.
- The workflow uploads `playwright-report/` on failure for triage.

## CI cost

- A11y PR job (chromium only, 2 suites): typically 1–3 min once the dev server
  is up (Chromium download + `next dev` cold compile dominate; tests themselves
  are seconds). `npx playwright install --with-deps chromium` adds the browser
  + system libraries (~1–2 min on a fresh runner).
- Nightly full matrix (all projects + auth/demo): materially longer; hence
  scheduled, not per-PR.

## Proof the gate fails on regression

Playwright exits non-zero on any failed assertion, and the workflow step has no
`continue-on-error`, so a deliberate a11y regression turns the PR job red and
blocks merge. (A live red-run link is not included because the app currently
fails to compile in this environment — see the caveat above — but the failure
semantics are standard and will engage once the parse-fix lands.)
