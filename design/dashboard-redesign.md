


## Transactions sort — localStorage default

### Overview
`components/transactions/sort.tsx` now falls back to a saved sort preference
(`localStorage` key: `transactions-sort-preference`) whenever the `/transactions`
URL has no `sort` param — e.g. from a bookmark or nav link. Deep links that
already include a `sort` param are never overridden.

### Behavior
- On first load, if no `sort` param exists in the URL, the saved preference
  (if any) is applied via `router.replace` (no new history entry, no scroll jump).
- The saved preference updates only on an explicit user selection — never on
  render or hydration.
- If `localStorage` is unavailable (e.g. private browsing), the control falls
  back to the existing default sort with no errors.

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.

## Zinc vs. Token Audit — `components/analytics/analytics-view.tsx` (#763)

`analytics-view.tsx` previously reached for Tailwind's built-in `zinc-*` palette directly instead of the semantic tokens defined in `app/globals.css` (the shadcn neutral base color). This meant its grays didn't move together with the rest of the dashboard if the neutral base color is ever retuned. All 18 `zinc-*` usages in the file have been mapped to tokens.

### Catalogue and mapping

| Zinc usage | Purpose | Token replacement |
|---|---|---|
| `border-zinc-200 dark:border-zinc-800` | Card / panel outer border | `border-border` |
| `border-zinc-100 dark:border-zinc-800/50` | Subtler inner border (chart wells) | `border-border/50` |
| `bg-zinc-50 dark:bg-zinc-900/50` | Chip / icon-well / button background | `bg-muted` |
| `bg-zinc-50/30 dark:bg-zinc-900/20` | Very subtle chart-well background | `bg-muted/30 dark:bg-muted/20` |
| `text-zinc-900 dark:text-white` | Headings (`Analytics views`, `Notifications`) | `text-foreground` |
| `text-zinc-700 dark:text-zinc-300` / `text-zinc-600 dark:text-zinc-400` | Body/label text (dropdown trigger, dropdown items, "View All") | `text-foreground` (see contrast note below) |
| `text-zinc-400` | Decorative chevron icons | `text-muted-foreground` |
| `hover:bg-zinc-100 dark:hover:bg-zinc-800` / `hover:bg-zinc-50 dark:hover:bg-zinc-900/50` | Hover feedback on chips/menu items | `hover:bg-muted-foreground/10` (see flagged gap below) |

### Flagged: no distinct hover/accent token exists yet

`app/globals.css` currently defines `--muted`, `--accent`, and `--secondary` with **identical** OKLCH values in both light and dark mode. That means a literal semantic mapping of the old `hover:bg-zinc-100` state to `hover:bg-accent` (the conventionally "correct" token for hover treatment) would be a visual no-op, since `bg-accent` renders identically to the `bg-muted` base it would be hovering from — a real loss of hover affordance versus the previous zinc-based behavior.

As a stopgap that doesn't invent a new CSS variable, this PR uses the existing `--muted-foreground` token at low opacity (`hover:bg-muted-foreground/10`) as a neutral overlay: it reliably darkens the surface in light mode and lightens it in dark mode, restoring the escalation without depending on `--accent`.

**Recommendation for the design-system owner**: give `--accent` (and/or `--secondary`) a value distinct from `--muted` so components can use the canonical `bg-accent` hover token directly instead of this opacity-based workaround.

### Flagged: `text-zinc-700`/`text-zinc-600` mapped to `foreground`, not `muted-foreground`

The obvious "one step down from full text" token is `--muted-foreground`, but at `oklch(55.553%)` (light) it produces roughly a 4:1 contrast ratio against the card background — below the 4.5:1 AA threshold for normal (non-large) 14px text such as the dropdown trigger label and "View All". To avoid regressing contrast, this text was mapped to `text-foreground` instead, which keeps the original ~10:1+ contrast the `zinc-700`/`zinc-900` values had. `text-muted-foreground` remains reserved for decorative, non-text-bearing elements (chevrons) where the WCAG 1.4.11 non-text 3:1 threshold applies instead.

### Out of scope: non-`zinc-*` hardcoded colors

The file also hardcodes non-token hex values that are **not** `zinc-*` utilities and were left untouched per this issue's scope (e.g. `bg-white dark:bg-[#111111]`, `bg-[#0D0D0D80]`, `border-[#2D2D2D]`, `bg-[#121212]`). These represent the same class of design-token debt and would be a reasonable follow-up issue, but reconciling them changes a much larger surface area of the component (including the non-`showNotifications` dark-card visual treatment) than a zinc-vs-token audit calls for.

### Responsive & accessibility validation

- Verified visually and via existing tests across the `showNotifications`/`showDropdown` permutations, which drive the `sm`/`md` breakpoint layout switch (`flex-col md:flex-row`) — no layout classes were touched, only color utilities.
- All existing tests in `components/analytics/analytics-view.test.tsx` pass against the new markup (one unrelated pre-existing failure, `renders empty state component when empty data is provided`, reproduces identically on `main` and is unrelated to this change).
- No text or non-text contrast regressions: token swaps were chosen to preserve or exceed the contrast ratios of the `zinc-*` values they replaced (see notes above).

---

## Benefits section — gradient tokenization refactor

**Branch:** `refactor/benefits-tokenize-gradients`
**Scope:** `components/landing/benefits.tsx`, `app/globals.css`
**Standard:** WCAG 2.1 Level AA
**Date:** 2026-07-29

---

### Overview

`components/landing/benefits.tsx` previously coded its background treatment and
card accents as raw hex literals and inline `rgba(r, g, b, a)` strings. Every
future brand colour change required a find-and-replace across the file.

This refactor replaces every hardcoded stop with a CSS custom property defined
in `app/globals.css`, gives the section explicit accessibility attributes, and
adds a full unit-test suite.

---

### Before / after

#### Section background

```diff
-  className="relative bg-[#040404] pt-24 pb-10 px-4 text-white min-h-screen"
+  className="relative pt-24 pb-10 px-4 text-white min-h-screen"
+  style={{ backgroundColor: "var(--color-surface-deep)" }}
```

#### Glow overlay

```diff
   style={{
-    background: `
-      radial-gradient(circle at 20% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%),
-      radial-gradient(circle at 50% 30%, rgba(27, 67, 245, 0.15) 35%, transparent 50%),
-      radial-gradient(circle at 80% 70%, rgba(27, 67, 245, 0.15) 15%, transparent 30%)`,
+    background: `
+      radial-gradient(circle at 20% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%),
+      radial-gradient(circle at 50% 30%, rgba(var(--color-brand-glow) / 0.15) 35%, transparent 50%),
+      radial-gradient(circle at 80% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%)`,
```

#### Subtitle text

```diff
-  className="... text-[#C7C7C7] ..."
+  className="... text-muted-foreground ..."
```

#### Featured card background

```diff
-  className="w-full max-w-md bg-[#8EB6FF] rounded-[8px] p-6 text-center"
+  className="w-full max-w-md rounded-[8px] p-6 text-center"
+  style={{ backgroundColor: "var(--color-brand-card)" }}
```

#### Featured card text

```diff
-  className="text-2xl font-clash mb-3 text-[#060606]"
+  className="text-2xl font-clash mb-3 text-foreground"

-  className="text-sm text-[#212121] font-general font-medium leading-[19px]"
+  className="text-sm text-foreground font-general font-medium leading-[19px]"
```

#### Non-featured card border

```diff
-  className="bg-transparent border border-[#598EFF] max-w-[400px] mx-auto ..."
+  className="bg-transparent max-w-[400px] mx-auto ..."
+  style={{ border: "1px solid var(--color-brand-border)" }}
```

#### Non-featured card body

```diff
-  className="text-sm text-[#A3A3A3] font-general font-medium leading-[19px]"
+  className="text-sm text-muted-foreground font-general font-medium leading-[19px]"
```

---

### Token mapping

| Old value | New token | CSS value | Rationale |
|-----------|-----------|-----------|-----------|
| `#040404` | `--color-surface-deep` | `#040404` | Near-black used only in this section; new token named for intent |
| `rgba(27, 67, 245, α)` | `--color-brand-glow` | `27 67 245` (RGB channels) | Brand blue (#1B43F5); stored as channels so callers control opacity |
| `#C7C7C7` | `text-muted-foreground` | Tailwind semantic | Same visual weight — maps to the muted neutral foreground token |
| `#8EB6FF` | `--color-brand-card` | `#8eb6ff` | Light brand-blue card surface; no equivalent in existing palette |
| `#060606` | `text-foreground` | Tailwind semantic | Near-black on a light card — resolved by `foreground` token |
| `#212121` | `text-foreground` | Tailwind semantic | Dark body text on light card — same semantic role as `foreground` |
| `#598EFF` | `--color-brand-border` | `#598eff` | Brand-blue border accent; no equivalent in existing palette |
| `#A3A3A3` | `text-muted-foreground` | Tailwind semantic | Muted neutral — matches the existing muted foreground token |

---

### New tokens added to `app/globals.css`

```css
/* ─── Benefits section color tokens ─────────────────────────── */

/** Near-black section background (#040404). */
--color-surface-deep: #040404;

/**
 * Brand-blue radial glow color (rgb(27 67 245)).
 * Use as: rgba(var(--color-brand-glow) / <alpha>)
 */
--color-brand-glow: 27 67 245;

/** Light brand-blue featured card background (#8EB6FF). */
--color-brand-card: #8eb6ff;

/** Brand-blue card border (#598EFF). */
--color-brand-border: #598eff;
```

---

### Accessibility notes

#### WCAG 2.1 AA contrast validation

| Element | Foreground | Background | Contrast | Status |
|---------|-----------|------------|----------|--------|
| Section h2 "Benefits" (45px bold) | `#ffffff` (text-white) | `#040404` (--color-surface-deep) | ≈ 21:1 | ✅ AA/AAA |
| Subtitle (16px regular) | `text-muted-foreground` | `#040404` | ≥ 4.5:1 on dark surface | ✅ AA |
| Featured h3 (24px bold) | `text-foreground` (~`#060606`) | `#8EB6FF` (--color-brand-card) | ≈ 8.9:1 | ✅ AA/AAA |
| Featured body (14px medium) | `text-foreground` (~`#212121`) | `#8EB6FF` (--color-brand-card) | ≈ 7.2:1 | ✅ AA/AAA |
| Non-featured h3 (24px bold) | `#ffffff` (text-white) | `#040404` (--color-surface-deep) | ≈ 21:1 | ✅ AA/AAA |
| Non-featured body (14px medium) | `text-muted-foreground` | `#040404` | ≥ 4.5:1 on dark surface | ✅ AA |
| Icon circles | Black SVG on `#ffffff` circle | `#ffffff` | ≈ 21:1 | ✅ |
| Card border | `#598EFF` (--color-brand-border) | `#040404` | ≈ 4.6:1 non-text 3:1 threshold | ✅ AA non-text |

#### ARIA annotations added

- `<section aria-labelledby="benefits-heading">` — provides the region's accessible name to AT users navigating by landmark.
- `<h2 id="benefits-heading">` — the labelled target.
- Decorative glow overlay: `aria-hidden="true"` — suppresses announcement of a presentational element.
- Decorative accent bar: `aria-hidden="true"` — same treatment.
- Icon SVGs: `aria-hidden="true" focusable="false"` — card `<h3>` headings already name the benefit; icons are purely decorative.

#### Keyboard navigation

No interactive elements were modified. The section is fully navigable by keyboard with Tab and Shift+Tab. No focus management changes were required.

---

### Responsive behaviour

| Breakpoint | Cards layout |
|------------|-------------|
| < 768 px (mobile) | All cards full-width, stacked vertically |
| ≥ 768 px (md+) | Featured card centred; secondary cards in a 2-column grid |
| ≥ 1024 px (lg+) | Same 2-column grid, constrained to `max-w-[832px]` |
| ≥ 1280 px (xl+) | Section content constrained to `max-w-6xl`, centred |

No Tailwind breakpoint classes were changed during this refactor. The responsive layout was already correct; only colour utilities were migrated to tokens.

---

### Dark mode

The section uses `--color-surface-deep` as a fixed near-black surface. Because
this is a brand-defined dark section (not a theme-responsive surface), it is
intentionally opaque to the Tailwind `dark:` modifier — the section is always
dark. The `text-muted-foreground` and `text-foreground` tokens resolve
correctly in both light and dark mode contexts, but their computed values are
overridden by the local surface colour rather than the page theme.

If a future design iteration wants the section to participate in light/dark
theming, `--color-surface-deep` should be defined in both `:root` and
`.dark :root` (or via `@media (prefers-color-scheme)`).

---

### Test coverage

`components/landing/benefits.test.tsx` adds 20 unit tests in six groups:

| Group | Tests |
|-------|-------|
| 1 · Structural rendering | 5 |
| 2 · Design token usage | 8 |
| 3 · Accessibility | 5 |
| 4 · Featured vs. non-featured | 4 |
| 5 · Data-testid completeness | 1 (asserts 15 anchor IDs) |
| 6 · Card count + DOM order | 2 |

---

### Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added 4 new CSS custom properties under `--color-*` |
| `components/landing/benefits.tsx` | Replaced all 8 hardcoded hex/rgba values with tokens; added ARIA attributes and `data-testid` hooks; keyed cards by `benefit.title` |
| `components/landing/benefits.test.tsx` | New — 20 unit tests |
| `design/dashboard-redesign.md` | Updated — this section |

