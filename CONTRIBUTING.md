# Contributing to Stellopay Frontend

First off, thank you for considering contributing to Stellopay! This document outlines our conventions and workflow to make the process as smooth as possible.

## Package manager

This repo uses **npm** exclusively. `package-lock.json` is the single source of truth for dependency resolution, and CI installs with `npm ci`.

- Install dependencies: `npm install`
- Reproducible install (CI / clean clone): `npm ci`
- Do not use `yarn` or `pnpm` to install or add dependencies — they generate `yarn.lock` / `pnpm-lock.yaml`, which drift from `package-lock.json` and risk inconsistent dependency versions between contributors and CI.
- A `preinstall` check (`scripts/check-package-manager.js`) fails the install if a `yarn.lock` or `pnpm-lock.yaml` file is present in the repo root. If you see that error, delete the stray lockfile and re-run `npm install`.

If you need to add or update a dependency, run `npm install <package>` (or `npm update`) and commit the resulting changes to `package.json` and `package-lock.json` together.

## Dependency Updates and Triage

We use **Dependabot** to automatically surface stale dependencies and security advisories. The bot is configured to run weekly. Minor and patch updates are grouped to reduce PR noise.

### Security Audit CI Gate

Every push and pull request runs an `npm audit` check in CI. This is a **blocking** step. If the audit surfaces any `high` or `critical` vulnerabilities, the build will fail.

### Triage Workflow for Vulnerabilities

If the CI audit gate fails (or Dependabot opens a security PR):

1. **Review the Advisory:** Check the GitHub security advisory or run `npm audit` locally to understand the impact.
2. **Apply the Fix:** Most vulnerabilities can be fixed by running `npm audit fix`. If that does not work, you may need to manually update the offending transitive dependency (e.g. using `npm overrides` in `package.json` as a last resort) or wait for an upstream patch.
3. **Commit the Lockfile:** Always commit the updated `package-lock.json` as the single source of truth. Ensure no structural drift occurs.
4. **Exceptions/Overrides:** If a `high` vulnerability is proven false positive or unactionable, use standard `overrides` or document the response securely in the PR. Avoid bypassing the CI gate unless absolutely critical for operational continuity.

## Development

```bash
npm install
npm run dev        # start the dev server
npm run lint        # ESLint
npm run type-check  # tsc --noEmit
npm run test        # Vitest unit tests with coverage
npm run test:e2e    # Playwright e2e tests (Chromium only)
npm run test:a11y   # axe-core accessibility gate (all browsers)
npm run build       # production build
```

Run lint, type-check, and tests locally before opening a PR.

## Cookie Consent Banner

The cookie-consent banner is rendered by `components/common/footer.tsx` and appears as a fixed bottom bar when no consent preference is stored in `localStorage`.

### Behaviour

- **No stored consent**: The banner is visible on every page.
- **Accept**: Stores `"accepted"` under `stellopay.cookie-consent` in `localStorage` and hides the banner. The choice persists across reloads.
- **Reject**: Stores `"rejected"` under the same key and hides the banner. The choice persists across reloads.
- **Dismiss (close button)**: Hides the banner without writing a consent value. The banner reappears on the next page load because no preference was recorded.
- **Fresh browser context**: When no value is stored, the banner is shown again.

### Persistence

The banner uses `safeStorage` (`@/utils/safeStorage`) for all `localStorage` reads and writes, so it is SSR-safe and handles storage-unavailable environments gracefully.

### Adding a11y coverage

The cookie-consent banner is included in the axe-core accessibility gate via `tests/cookie-consent.spec.ts`. If a new route renders the banner, ensure it is also added to `tests/a11y.spec.ts`.

All primary routes must pass an axe-core scan before merging. The gate is enforced by `tests/a11y.spec.ts` and runs in CI under the `a11y-gate` job on every pull request and push to `main`.

### What fails CI

Any **serious** or **critical** axe-core violation that is not explicitly triaged in the `KNOWN_EXCEPTIONS` list inside `tests/a11y.spec.ts` will cause the `a11y-gate` job to fail. Minor and moderate violations are logged as warnings but do not block the build.

### Routes covered

| Route                   | Viewports tested                                           |
| ----------------------- | ---------------------------------------------------------- |
| `/`                     | Desktop, Mobile (390 × 844), Dark colour scheme            |
| `/help/support`         | Desktop, Mobile (390 × 844), Dark colour scheme            |
| `/settings/preferences` | Desktop (all tabs), Mobile (390 × 844), Dark colour scheme |

### Running the gate locally

```bash
# Requires browsers installed: npx playwright install chromium firefox webkit
npm run test:a11y
```

### Adding a temporary exception

If a violation cannot be fixed immediately, add an entry to `KNOWN_EXCEPTIONS` in `tests/a11y.spec.ts`:

```ts
const KNOWN_EXCEPTIONS: TriagedViolation[] = [
  {
    id: "color-contrast",
    reason: "Hero gradient pending design token update — #123",
  },
];
```

Every exception **must** include a reason and a tracking-issue link. Remove the entry once the underlying issue is resolved. The allowlist is intentionally small — it is not a mechanism for silencing the gate wholesale.

## Design System

The application's visual language is built on a set of CSS custom properties defined in [`app/globals.css`](app/globals.css) and exposed as Tailwind utility classes via the `@theme inline` block. Every colour, border-radius, and typography token resolves to either a light or dark value automatically when the `.dark` class is applied to the root element.

### Token reference

**[`design/design-token-mapping.md`](design/design-token-mapping.md)** is the single source of truth for:

- Every CSS custom property (`--background`, `--primary`, `--destructive`, `--chart-1`, etc.) and its generated Tailwind class (`bg-background`, `bg-primary`, `text-destructive`, `bg-chart-1`, …)
- Light **and** dark mode resolved values (oklch / hex) for each token
- One-line usage guidance per token
- Composition examples (buttons, cards, inputs, error text)
- Anti-patterns — common raw-hex usages and their token replacements
- Instructions for adding a new token

Consult this document before reaching for a raw hex value or a plain Tailwind palette step (e.g. `text-gray-500`). If the right token does not exist, add it to `app/globals.css` and document it in `design/design-token-mapping.md` in the same PR.

### Dark mode

Dark mode is controlled by the `useTheme` hook in `context/theme-context.tsx` and the `.dark` class on `<html>`. Use the `dark:` Tailwind modifier only when a component needs to override a token beyond what the CSS variable already provides; most dark-mode changes are handled automatically by the token.

### Adding icons

Use `lucide-react` exclusively. See [Iconography](#iconography) in the README for details.

## Project Structure (App Router)

We exclusively use the **Next.js App Router** (no `pages/` directory). Here is our core structure:

- `app/`: All routes, layouts, and page components. Do not create a `pages/` directory.
- `components/`: Reusable UI components (buttons, inputs, cards, etc.).
- `hooks/`: Custom React hooks.
- `lib/`: Business logic, third-party service clients, and data access.
- `utils/`: Small utility functions and helpers.
- `types/`: TypeScript definitions and interfaces.
- `messages/`: Centralized i18n JSON copy dictionary (`en.json`) and TypeScript helper module (`index.ts`).

## Internationalization (i18n) Copy Extraction

To prepare for `next-intl` localization, avoid hardcoding inline English string literals directly inside JSX components.

1. **Extract strings to `messages/en.json`**: Store copy structured by domain/component key (e.g. `dashboard.quickActions`, `footer`).
2. **Reference from `messages`**: Import `messages` from `@/messages` and reference string fields.
3. **Leave a `next-intl` marker**: Place a comment above component imports:
   ```tsx
   import { messages } from "@/messages";

   // TODO: Replace direct import of messages with next-intl useTranslations() hook once i18n is enabled.
   ```

## Settings Search Feature

The settings preferences page includes a cross-tab search feature that allows users to quickly find controls across all four settings sections (Account, Notifications, Security, Wallets).

### How to add a new searchable control

When adding a new control to any settings section:

1. **Update `SEARCHABLE_CONTROLS`** in `components/settings-search.tsx`:
   ```tsx
   {
     label: "Your control name",
     section: "account", // or "notifications", "security", "wallets"
     keywords: ["keyword1", "keyword2", "synonym"],
   }
   ```

2. **Keywords should include**:
   - The primary control name (e.g., "password")
   - Related synonyms (e.g., "security", "authentication")
   - The section name (e.g., "account")
   - Any category words (e.g., "danger" for destructive actions)

3. **Security note**: Only include non-sensitive labels and keywords. Never add email addresses, wallet keys, or PII to the search index.

### Search behavior

- **Query matching**: Searches are case-insensitive substring matches against both label and keywords
- **Relevance ranking**: Results are ranked by match type (exact > starts-with > contains)
- **Keyboard navigation**: Users can navigate results with arrow keys (↑/↓) and select with Enter
- **Tab switching**: Selecting a result automatically switches to the appropriate tab
- **Keyboard accessible**: Fully operable without a mouse (Tab, Enter, Escape, Arrow keys)

### Testing the search feature

Run Playwright e2e tests to verify search functionality:

```bash
npm run test:e2e -- tests/settings-search.spec.ts
```

Key test scenarios covered:
- Cross-tab navigation and tab switching
- Keyboard navigation (arrow keys, Enter, Escape)
- Search ranking by relevance
- No-results state
- Accessibility (keyboard-only operation, screen reader support)
- Responsive behavior across breakpoints (mobile, tablet, desktop)
- Dark mode rendering


## Shared Components — Transactions

### `DateRangeChip`

`components/transactions/date-range-chip.tsx` is the single date-picker trigger
chip used throughout the Transactions feature. It renders a button that shows
either a formatted date (`dd-MM-yyyy`) or a placeholder, and opens a Calendar
popover on activation.

**Use this component** whenever you need a single-date picker in the
Transactions feature area. Do **not** write an inline `<Popover>` + `<Button>` +
`<Calendar>` combination — keep the chip consistent and accessible.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `date` | `Date \| undefined` | ✓ | Selected date, or `undefined` for no selection |
| `onDateChange` | `(date: Date \| undefined) => void` | ✓ | Called when the user picks a date |
| `placeholder` | `string` | | Button label when no date is selected. Defaults to `"Pick a date"` |
| `aria-label` | `string` | | Accessible name for the trigger button. Falls back to `placeholder` |
| `disabledDate` | `(date: Date) => boolean` | | Predicate to disable specific calendar days |
| `open` | `boolean` | | Controlled popover open state. Pair with `onOpenChange` |
| `onOpenChange` | `(open: boolean) => void` | | Called when the popover open state should change |

#### Controlled vs. uncontrolled

The component supports **both** patterns:

```tsx
// ── Uncontrolled (Popover manages its own open state) ──────────────────
// Used by components/transactions/date.tsx
<DateRangeChip
  date={selectedDate}
  onDateChange={setSelectedDate}
  placeholder="Pick a date"
/>

// ── Controlled (parent manages open state and closes on selection) ─────
// Used by components/transactions/transactions-header.tsx
const [open, setOpen] = useState(false);

<DateRangeChip
  date={fromDate}
  onDateChange={(date) => { if (date) { onFromDateChange(date); setOpen(false); } }}
  placeholder="From"
  aria-label="Filter from date"
  open={open}
  onOpenChange={setOpen}
  disabledDate={(d) => toDate ? d > toDate : false}
/>
```

#### Accessibility (WCAG 2.1 AA)

- The trigger button carries an explicit `aria-label` (from the prop, or
  derived from `placeholder`). Screen readers announce the purpose of the
  picker without relying on the visual icon.
- The `<CalendarIcon>` is `aria-hidden="true"` — it is purely decorative.
- The trigger inherits the project-wide `focus-visible` ring (3 px via
  `focus-visible:ring-[3px]`), satisfying the 3∶1 non-text contrast requirement
  for focus indicators.
- Keyboard navigation inside the calendar grid is handled by the underlying
  Radix + react-day-picker primitives (Arrow keys, Page Up/Down, Home/End,
  Enter/Space to select).
- The `to` separator in the date range (`aria-hidden="true"`) is hidden from
  the accessibility tree so it is not announced twice.

#### Sizing and overflow

The button uses a fixed `w-[140px]`, which:

- accommodates the widest possible `formatDateForDisplay` output (`dd-MM-yyyy`
  = 10 characters) plus the calendar icon and padding, and
- prevents the overflow regression caused by the former `w-[2000px]` typo that
  was present in `transactions-header.tsx`.

Long placeholder strings and formatted dates are truncated with CSS
(`truncate` / `overflow-hidden`) and never break the layout.

#### Responsive behaviour

The chip width (`140px`) is intentionally fixed across all breakpoints because
date strings have a predictable maximum length. The parent layout adjusts
(e.g. `flex-col` on mobile → `flex-row lg:flex-row` in the header) while the
chip itself stays the same size.

#### Tests

Unit tests live in `components/transactions/date-range-chip.test.tsx` and
cover:

- Rendering — placeholder and formatted-date display
- Accessibility — `aria-label`, `aria-hidden` icon
- Controlled open state — `open` prop reflected on the popover root
- `onDateChange` callback — called with the selected `Date`
- `disabledDate` predicate — passed through to the Calendar stub
- Edge cases — `undefined` date, long strings, re-renders, prop changes
- Integration patterns — controlled (TransactionsHeader) and uncontrolled
  (Date component) usage

Run them with:

```bash
npm run test -- date-range-chip
```

## Transaction Filter Predicates (`transactions-config.ts`)

`components/transactions/transactions-config.ts` is the single source of truth
for the Transactions feature's filter/sort/pagination defaults **and** the
individual filter predicate builders. It is consumed by
`hooks/useTransactions.ts` (via `lib/api/transactions.ts` →
`utils/transactionUtils.ts › filterTransactions`).

### Why centralized predicates?

Previously, the logic that combines multiple simultaneous filters
(date range AND status AND amount) lived only inside
`utils/transactionUtils.ts › filterTransactions` as a sequence of
`.filter()` calls. That logic had **no direct unit test** — only indirect
coverage through component tests — so regressions in the AND composition
could ship unnoticed.

The refactor extracts each filter rule into a standalone, pure predicate
builder:

| Builder | Matches | Inactive behavior |
|---------|---------|-------------------|
| `createSearchQueryPredicate(query)` | type, txId, address, token, status (case-insensitive) | empty → pass-all |
| `createSelectedFilterPredicate(filter)` | exact `type` (case-sensitive) | `DEFAULT_SELECTED_FILTER` → pass-all |
| `createFilterQueryPredicate(query)` | type, status, address (trimmed, case-insensitive) | empty/whitespace → pass-all |
| `createDateRangePredicate(from, to)` | inclusive date range | invalid dates → exclude all |
| `createMinAmountPredicate(min)` | `abs(amount) >= min` | `undefined` → pass-all |
| `createMaxAmountPredicate(max)` | `abs(amount) <= max` | `undefined` → pass-all |
| `createCounterpartyPredicate(c)` | address substring (trimmed, case-insensitive) | empty/whitespace → pass-all |

`applyTransactionFilters(transactions, options)` composes every active
predicate with **AND semantics**: a transaction is included only when it
satisfies **all** active predicates. The date-range predicate is applied only
when **both** `fromDate` and `toDate` are provided, so other predicates can be
tested in isolation without a date constraint.

### Adding a new filter

1. **Add a `createXxxPredicate` builder** in `transactions-config.ts` that
   returns a pure `(transaction) => boolean`. Handle the inactive case
   (empty/undefined) by returning a pass-all predicate.
2. **Add the option** to `TransactionFilterOptions` and compose the new
   predicate inside `applyTransactionFilters`.
3. **Delegate** from `filterTransactions` (positional adapter) if the new
   filter should flow through the existing API layer.
4. **Add unit tests** in `transactions-config.test.ts` covering:
   - The predicate in isolation (match, no-match, inactive pass-all, boundary).
   - Combined AND behavior with at least one other predicate.
   - A zero-results edge case for the new filter.

### Testing the predicates

```bash
npm run test -- transactions-config
```

The suite covers:

- **Individual predicates in isolation** — each builder's match/no-match,
  case sensitivity, trimming, inactive pass-all, and boundary conditions.
- **Combined-filter AND semantics** — overlapping and non-overlapping result
  sets across two, three, and four simultaneous filters.
- **Zero-results edge case** — filter combinations that match no transaction
  return `[]`, including an empty input array.
- **Immutability** — the input array is never mutated.
- **Defaults** — `applyTransactionFilters()` with no options returns all
  transactions; `getDefaultDateRange()` returns a 30-day window ending today.

### Accessibility & responsive notes

The predicates are pure data functions with no rendered UI, so there is no
direct WCAG/contrast/keyboard surface. The filter UI components that consume
them (`filter.tsx`, `advanced-filter-panel.tsx`, `date-range-chip.tsx`) carry
their own axe-core and keyboard tests. The status color palette in
`transactionUtils.ts` uses AA-compliant contrast ratios (documented inline in
`STATUS_COLOR_PALETTE`). Responsive behavior is validated at the component
level across `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 breakpoints.

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

## Icon Library Policy

To keep the bundle small and the visual language consistent, all UI icons must
come from **`lucide-react`**. This is the single source of truth, enforced both
by the ESLint `no-restricted-imports` rule above and by the import-guard test
in `utils/import-guard.test.ts`.

### Decision tree

```
Need an icon?
│
├─ Is it available in lucide-react?
│   └─ YES → import { IconName } from "lucide-react"   ✅
│
├─ Is it a brand logo or a unique custom shape not expressible
│  as a stroke icon (e.g. the filled bell notification badge)?
│   └─ YES → write a minimal inline SVG component under
│             components/icons/ and document the exception
│             in design/icons.md                        ✅ (see below)
│
└─ Otherwise → do NOT reach for react-icons or @hugeicons  ❌
```

### When to write a custom SVG component

A custom SVG under `components/icons/` is justified **only** when:

1. The icon is not available in lucide-react at all, **and**
2. The required shape is filled / brand-specific and cannot be reasonably
   approximated by a lucide stroke icon.

When you add one, follow these rules:

- Place it in `components/icons/<name>-icon.tsx`.
- Accept `IconProps` from `@/types/icons` (which extends
  `React.SVGProps<SVGSVGElement>`) so callers can pass `className`,
  `aria-label`, etc.
- **Do not hard-code colours.** Use `currentColor` (inherits from CSS) or
  accept a `fill`/`stroke` prop so the icon respects the design token system
  and dark-mode.
- Add `aria-hidden="true"` by default and rely on a wrapping element or an
  explicit `aria-label` prop for accessible names — never describe the raw
  shape in the label.
- Document the exception in `design/icons.md` with a short rationale.
- Write a `components/icons/<name>-icon.test.tsx` that verifies the SVG
  structure, any forwarded props, and accessibility attributes.

### Existing exception — `components/icons/bell-fill-icon.tsx`

`lucide-react`'s `Bell` icon is a stroke outline. The notification badge in
the dashboard requires a **filled** bell shape that is not available as a
lucide variant. `IconBell` is the approved custom component for this use case.

> ⚠ The current implementation hard-codes `fill="#333333"`. This is a known
> limitation — tracked for migration to `currentColor` so the icon responds to
> dark-mode and design tokens. Until then, do not copy this pattern for new
> icons.

### Size and stroke conventions

See [`design/icons.md`](design/icons.md) for the full sizing system
(16 / 20 / 24 px), default stroke width (2), and import tree-shaking rules.

## Testing Expectations

We expect all new utility functions and business logic to have **minimum 95% test coverage**.

### Runtime Guard Coverage

Runtime type guards that validate external payloads must have focused unit tests
near the type they protect. Cover valid payloads, invalid payloads, and at least
one representative TypeScript narrowing path. When a broader component or
context suite also needs the same payload shape, put reusable samples in a
shared fixture module instead of duplicating them across test files.

Guard-only changes have no visual UI state to screenshot, but the PR should
say so explicitly. If the guarded payload drives rendered UI, include notes for
WCAG 2.1 AA contrast, keyboard navigation, ARIA semantics, dark mode, RTL,
long text, and responsive checks at `sm` 640px, `md` 768px, `lg` 1024px, and
`xl` 1280px.

### API Testing Coverage

All files within `lib/api/` (such as `auth.ts`) must maintain a minimum 95% unit test coverage.
Ensure that:
- You mock `fetch` to cover successful (200) paths, server errors (4xx/5xx), and network rejection scenarios.
- The functions throw or return the exact documented error shapes.
- The unit tests verify edge cases for any API utility functions.

When testing API utilities that map to UI elements, annotate accessibility requirements (WCAG 2.1 AA contrast, keyboard navigation, ARIA) and validate responsive behavior across breakpoints (sm 640, md 768, lg 1024, xl 1280) in the connected component test, as well as cover edge states like empty/error/loading, long text, RTL, and dark mode.

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

- **Keyboard-Only E2E Tests (Playwright):**

  ```bash
  npm run test:e2e -- tests/auth-signup-keyboard.spec.ts
  ```

  Runs end-to-end keyboard-navigation tests for the sign-up form using only
  Tab, Shift+Tab, Enter, and Space — no mouse interactions.

- **Type Checking:**
  ```bash
  npm run type-check
  ```
  Runs TypeScript compiler (`tsc --noEmit`) to verify types without building.

## Visual Regression Baselines

The dashboard (and any other route covered by `toHaveScreenshot()`) has pixel-accurate baseline images committed to `__snapshots__/` (repo root). Playwright compares every screenshot assertion against these files in CI and fails if the pixel diff exceeds the configured tolerance.

### Tolerance settings (playwright.config.ts)

| Setting              | Value | Meaning |
| -------------------- | ----- | ------- |
| `maxDiffPixelRatio`  | 0.01  | At most 1 % of total pixels may differ before a test fails. Absorbs sub-pixel antialiasing variation across machines. |
| `threshold`          | 0.15  | Per-pixel colour distance tolerance on a 0–1 scale. Forgives minor gamma / rendering differences between OS versions. |

### Breakpoints covered

| Name | Viewport width | Height |
| ---- | -------------- | ------ |
| sm   | 640 px         | 900 px |
| md   | 768 px         | 900 px |
| lg   | 1024 px        | 900 px |
| xl   | 1280 px        | 900 px |

Both light and dark modes are captured at each breakpoint, plus a third "skeleton / loading" snapshot that verifies the UI during the 1 500 ms simulated loading delay.

### How to update baselines after an approved design change

When a deliberate UI change causes screenshot assertions to fail, follow this workflow:

1. **Get design sign-off first.** Baseline updates are permanent history — do not regenerate them to silence a failing test before the change is approved.

2. **Run the update command** against the Chromium project only (the project used in CI):

   ```bash
   npx playwright test tests/dashboard.spec.ts --update-snapshots --project=chromium
   ```

   To update all snapshots across every browser project at once:

   ```bash
   npx playwright test --update-snapshots
   ```

3. **Review the diff before committing.** Playwright writes the new PNG files to `__snapshots__/`. Open the files side-by-side (or use `git diff --stat`) to confirm only the intended pixels changed.

4. **Commit the updated baselines with the design change** in the same PR, not as a separate "fix screenshots" commit. Keeping the visual change and its baseline together makes git blame useful.

   ```bash
   git add tests/__snapshots__/
   git commit -m "test: update dashboard visual baselines for <design-change>"
   ```

5. **Reference the design ticket** in the PR description so reviewers know the baseline change was expected.

### Running visual regression tests locally

```bash
# Run only the visual regression suite (Chromium, fast):
npx playwright test tests/dashboard.spec.ts --project=chromium

# Run with the browser visible to inspect rendering:
npx playwright test tests/dashboard.spec.ts --project=chromium --headed

# Open the last HTML report (includes annotated diffs):
npx playwright show-report
```

### Interpreting a CI failure

When the `playwright` CI job fails because of a visual diff:

1. Open the **`playwright-report`** artefact from the failed run (retained 7 days). The HTML report shows a three-panel diff: expected / actual / diff overlay.
2. Download **`visual-regression-diffs`** for the raw `*-actual.png` and `*-diff.png` files if you need to inspect them locally.
3. Download **`visual-regression-baselines`** for the committed `*-expected.png` files to compare side-by-side.
4. If the diff is an unintended regression, revert the offending style change and re-push. If it is an intentional design change, follow the "How to update baselines" workflow above.

### Adding visual regression to a new route

1. Import and call `toHaveScreenshot()` in your spec file, following the pattern in `tests/dashboard.spec.ts`.
2. Generate the initial baselines locally:

   ```bash
   npx playwright test tests/<your-spec>.spec.ts --update-snapshots --project=chromium
   ```

3. Commit the generated PNG files under `__snapshots__/`.
4. Open a PR — CI will compare future runs against the committed baselines automatically.

---

## Keyboard Navigation & Accessibility Expectations

Every interactive element must be fully operable using only the keyboard
(Tab, Shift+Tab, Enter, Space) and expose correct ARIA attributes so
assistive technologies can interpret its state and purpose.

### Keyboard Navigation Guidance

- **Tab order** must follow the visual reading order — top-to-bottom,
  left-to-right in LTR locales. Use the browser's natural DOM order;
  avoid positive `tabIndex` values.
- **No focus traps**: focus must never become stuck on a single element.
  The user must always be able to Tab forward, Shift+Tab backward, or
  dismiss (Escape) any overlay.
- **Visible focus indicators**: every focusable element must show a
  visible focus ring via `focus-visible:ring-*` (minimum 3∶1 contrast
  ratio per WCAG 2.1 SC 2.4.7). Never use `outline: none` without
  providing a replacement `:focus-visible` style.
- **Aria states**: toggle buttons must use `aria-pressed`; expandable
  regions must use `aria-expanded`; active nav links must use
  `aria-current="page"`.

### Keyboard-Only E2E Test Requirements

New form components and interactive flows must include keyboard-only
Playwright tests that:

- Use only Tab / Shift+Tab for navigation and Enter / Space for activation.
- Verify every interactive element receives focus in the correct order.
- Confirm that focus never becomes trapped.
- Verify that required fields are reachable.
- Validate that toggles and controls update their ARIA states correctly
  (e.g., `aria-pressed`, `aria-expanded`).
- Cover the full form-completion flow from fill to submit using the
  keyboard exclusively.
- Check success and error states are reachable via keyboard focus.
- Cover edge cases: empty submission, validation errors, long input values.
- Test across breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Include dark-mode coverage when applicable.

### Running Keyboard Tests

```bash
# Sign-up form keyboard-only tests
npm run test:e2e -- tests/auth-signup-keyboard.spec.ts
```

## Dark-Mode Screenshot Audit

`tests/dark-mode-screenshots.spec.ts` walks every top-level route in dark mode
and captures a full-page screenshot artefact for manual diffing. It also runs
an axe-core accessibility scan in the dark-mode render so contrast regressions
specific to dark tokens surface here rather than relying on a separate
light-mode pass.

### How dark mode is forced

The spec uses the same injection mechanism proven in `tests/theme.spec.ts`:

```ts
// Registers an init script that runs before any page scripts.
await page.emulateMedia({ colorScheme: "dark" });
await page.addInitScript(() => {
  window.localStorage.setItem("theme", "dark");
});
await page.goto(route);
```

`emulateMedia` makes the pre-hydration inline script in `app/layout.tsx` apply
the `dark` class to `<html>` before React hydrates. `addInitScript` ensures
`ThemeProvider`'s `useEffect` reads `"dark"` from `getStoredTheme()` on mount
and does not override the class. No changes to `context/theme-context.tsx` are
needed — the existing `localStorage` contract is the stable injection point.

### Routes covered

| Route                   | Label                 |
| ----------------------- | --------------------- |
| `/`                     | `landing`             |
| `/dashboard`            | `dashboard`           |
| `/transactions`         | `transactions`        |
| `/settings/preferences` | `settings-preferences`|
| `/help/support`         | `help-support`        |
| `/account-summary`      | `account-summary`     |
| `/analytics-view`       | `analytics-view`      |
| `/auth/login`           | `auth-login`          |
| `/auth/sign-up`         | `auth-sign-up`        |

### Test suites

| Suite | Tests |
|---|---|
| **Desktop (1280 × 800)** | 9 routes × 1 viewport. Each test asserts the `dark` class, runs an axe-core WCAG 2.1 AA scan, and captures `dark-<label>-desktop.png`. |
| **Responsive breakpoints** | 9 routes × 4 viewports (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px). Captures `dark-<label>-<breakpoint>.png`. |
| **Dark / light parity** | Landing and dashboard. Asserts that `body` `background-color` differs between dark and light renders, which proves the theme class was actually applied. |

### Screenshot artefacts

Screenshots are written to Playwright's default `test-results/` directory and
named `dark-<label>-<viewport>.png`. The first run writes baseline images.
Subsequent runs diff against them and fail if the diff exceeds
`maxDiffPixelRatio: 0.02` (2%).

To adopt new baselines after an intentional visual change, run:

```bash
npx playwright test tests/dark-mode-screenshots.spec.ts --update-snapshots
```

To inspect the PNG artefacts interactively after a run:

```bash
npx playwright show-report
```

### Running the audit

```bash
# Chromium only (matches npm run test:e2e)
npm run test:e2e -- tests/dark-mode-screenshots.spec.ts

# All three browsers (chromium, firefox, webkit)
npx playwright test tests/dark-mode-screenshots.spec.ts

# Single browser
npx playwright test tests/dark-mode-screenshots.spec.ts --project=firefox

# Headed mode for visual debugging
npx playwright test tests/dark-mode-screenshots.spec.ts --headed --project=chromium
```

### Accessibility in dark mode

Each desktop route test calls `expectNoSeriousA11yViolations(page)` from
`tests/axe-helper.ts` immediately after dark mode is confirmed. This catches:

- **Color contrast** failures in dark-mode token pairs.
- **ARIA** regressions introduced by conditional dark-mode markup.
- **Role / label** issues that only appear when certain components render
  differently under the `dark` class.

Use the standard `allowlist` option for known issues that cannot be fixed
immediately:

```ts
await expectNoSeriousA11yViolations(page, {
  allowlist: [
    { id: "color-contrast", reason: "Dark gradient badge — tracked in #999" },
  ],
});
```

### Responsive coverage

The responsive suite validates at the four Tailwind breakpoints used across the
codebase:

| Breakpoint | Width | Height |
|---|---|---|
| `sm` | 640 px | 900 px |
| `md` | 768 px | 1 024 px |
| `lg` | 1 024 px | 768 px |
| `xl` | 1 280 px | 800 px |

### CI integration

The spec lives in `tests/dark-mode-screenshots.spec.ts` and is automatically
picked up by `playwright.config.ts`'s `testMatch: ["tests/**/*.spec.ts", ...]`
glob. It runs as part of:

- `npm run test:e2e` (chromium only, local default)
- The full Playwright matrix in the `playwright` CI job
  (`npx playwright test` — all browsers)

On failure the `playwright` CI job uploads the HTML report as the
`playwright-report` artefact (retained 7 days) so screenshot diffs and axe
violation details can be inspected without re-running locally.

## Branching, Commits, and PRs

1. **Branch Naming**: Use descriptive branch names like `feat/feature-name`, `fix/bug-name`, or `docs/doc-update`.
2. **Commit Style**: Use Conventional Commits (e.g., `feat: add new button`, `fix: correct typo in hero`).
3. **Pull Requests**: Please use the standard PR template (`#55`). Ensure that all tests pass (`npm run test && npm run test:e2e`) and that no secrets or real PII are included in your examples.

### Security Notes

Examples must not include real secrets, tokens, or addresses. Always use placeholder domains (e.g., `example.com`) and redacted addresses in your tests and mockups.

## Navbar Active Route Management (#785)

The application navbar (`components/common/navbar.tsx`) derives active route styling from `usePathname()` via `next/navigation`.

### Standards & Guidelines
- **Single Source of Truth**: Never persist active route state in local component state (`useState`).
- **In-Page Nav Sync**: Dynamic URL updates from inline links automatically re-render active navbar indicators.
- **Accessibility (WCAG 2.1 AA)**:
  - Active navigation links receive `aria-current="page"`.
  - Color contrast (`bg-primary/10 text-primary`) meets minimum requirements across light/dark modes.
  - Mobile dropdown drawer includes complete `aria-expanded` and `aria-controls` bindings.


## Notification Timestamps (#1096)

The notification panel (`components/common/notification-panel.tsx`) renders each
item's `timestamp` as **relative time** rather than a raw or absolute value, so a
list of notifications stays scannable at a glance.

Formatting is owned by `utils/date-utils.ts` — never format a notification date
inline in a component.

### Helpers

| Helper | Purpose |
| --- | --- |
| `formatRelativeTime(dateLike, { now?, thresholdDays? })` | Short relative label (`"just now"`, `"5m ago"`, `"2h ago"`, `"yesterday"`, `"3d ago"`) |
| `formatAbsoluteDateTime(dateLike)` | Precise `"Jul 29, 2026, 3:00 PM"` string for tooltips |
| `toIsoDateTime(dateLike)` | ISO 8601 value for a `<time dateTime>` attribute, or `undefined` |

### Standards & Guidelines

- **Threshold**: past `RELATIVE_TIME_THRESHOLD_DAYS` (7), relative time gives way
  to an absolute `MMM dd, yyyy` date — "47d ago" is noise, not information.
- **Precision is never lost**: every relative label is rendered inside a `<time>`
  element carrying the exact instant in both `title` (pointer tooltip) and
  `dateTime` (machine-readable ISO).
- **Deterministic tests**: pass the `now` prop (or the `now` option) instead of
  relying on the system clock. Do not use `formatRelativeTime` without it in a
  test that asserts on exact output.
- **Clock skew**: future timestamps render as `"in 5m"` / `"tomorrow"`, never as
  a negative age.
- **Invalid input**: `null`, `undefined`, `""` and unparsable strings return `""`
  and the `<time>` element is omitted entirely rather than rendered empty.

### Accessibility (WCAG 2.1 AA)

### Standards & Guidelines
- **Single Source of Truth**: Never persist active route state in local component state (`useState`).
- **In-Page Nav Sync**: Dynamic URL updates from inline links automatically re-render active navbar indicators.
- **Accessibility (WCAG 2.1 AA)**:
  - Active navigation links receive `aria-current="page"`.
  - Color contrast (`bg-primary/10 text-primary`) meets minimum requirements across light/dark modes.
  - Mobile dropdown drawer includes complete `aria-expanded` and `aria-controls` bindings.

## Memoizing Row-Level Components (#1099)

`components/transactions/token-icon.tsx` renders once per transaction row. Any
re-render of `transactions-table.tsx` for an unrelated reason — a sort-icon
hover, a density change, a tag popover opening — used to re-render every icon
on screen. With dozens of rows that churn is measurable.

`TokenIcon` is now wrapped in `React.memo`.

### When to reach for `React.memo`

Apply it to a component that meets all three conditions:

1. It renders many times on one screen (once per row, per cell, per chip).
2. Its props are stable for the lifetime of that row.
3. Its parent re-renders for reasons unrelated to those props.

Do not memoize a component that renders once per page, or one whose props
change on nearly every parent render. `React.memo` is not free — it adds a
props comparison on every render — and applied indiscriminately it costs more
than it saves.

### Keep props shallow-comparable

`React.memo`'s default comparison is shallow. `TokenIcon` takes only
primitives (`token: string`, `src?: string`, `size?: number`), so the default
is the correct equality check and no custom comparator is needed.

Prefer restructuring props over writing a comparator. If you find yourself
passing an object or an inline arrow, the memo will break silently because a
fresh reference fails shallow equality on every render:

```tsx
// Breaks memoization — new object and new function every parent render
<TokenIcon meta={{ token: t.token }} onClick={() => select(t.id)} />

// Memoizes correctly — primitives only
<TokenIcon token={t.token} src={t.tokenIcon} size={20} />
```

If a callback is genuinely required, hoist it with `useCallback` in the parent
so its identity is stable.

### Guard it with a render count, not a snapshot

A memo regression is invisible to normal assertions: the component still
renders the right output, just too often. Tests must count renders.

The pattern in `token-icon.test.tsx` wraps the component in a counting shim,
keyed by token so one row re-rendering cannot hide behind another:

```tsx
const CountingTokenIcon = React.memo(function CountingTokenIcon(props) {
  renderCounts[props.token] = (renderCounts[props.token] ?? 0) + 1;
  return <TokenIcon {...props} />;
});
```

Then drive an unrelated state change in a parent harness and assert the counts
did not move:

```tsx
render(<TableHarness tokens={["USDC", "XLM", "ETH"]} />);
expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });

fireEvent.click(screen.getByRole("button", { name: /toggle sort hover/i }));

expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });
```

Always pair this with the inverse case — that the component *does* re-render
when its own props genuinely change. A component that never re-renders is a
bug, not a win, and a test suite that only checks the "stays flat" direction
would pass for a component that is broken.

### Accessibility (WCAG 2.1 AA)

Memoization must not change what assistive tech sees.

- `TokenIcon`'s `alt` is the token symbol plus "token icon", so the symbol is
  never conveyed by the image alone (SC 1.1.1). Each row also renders the
  symbol as adjacent text, so it survives images being disabled.
- Unrecognised symbols render a generic coin rather than nothing, so a row
  never collapses to a gap and column alignment holds (SC 1.3.2). The previous
  implementation returned `undefined` for anything other than USDC or XLM.
- The icon is presentational and not focusable, so it stays out of the tab
  order and does not interrupt table keyboard navigation (SC 2.1.1).

### Responsive

`TokenIcon` takes an explicit `size` (16px in the mobile card view, 20px in the
desktop table) and carries `shrink-0`, so it holds its dimensions in a flex row
and adjacent text truncates instead of squashing the icon. Verified at sm 640,
md 768, lg 1024 and xl 1280.

### Testing

```bash
npx vitest run components/transactions/token-icon.test.tsx
```
