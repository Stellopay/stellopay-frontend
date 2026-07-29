# Landing Section Spacing Rhythm

**Branch:** `ui/landing-section-spacing-rhythm`  
**Ticket context:** Uneven vertical scroll rhythm on the marketing page, especially
visible at tablet widths (768 px), caused by ad-hoc `py-*` values spread across
individual section files.

---

## Problem

Every top-level landing section was setting its own vertical padding with no
shared reference point:

| Section | File | Before |
|---|---|---|
| Hero | `hero.tsx` | `min-h-screen` + `my-30` on inner div — no section-level `py-*` |
| Benefits | `benefits.tsx` | `pt-24 pb-10` — asymmetric, no responsive variants |
| How It Works | `how-it-works.tsx` | `py-20` — flat, no responsive variants |
| Stats Cards | `landing-page.tsx` wrapper | `py-12 md:py-16` — different breakpoint prefix (`md` vs `sm`/`lg`) |
| Enterprise Solution | `enterprise-section.tsx` | No section-level padding — relied on `m-4` margin + card `p-10 lg:p-[65px]` |
| Dynamic skeletons | `landing-page.tsx` | `py-20` flat — mismatched with the real sections they substitute |

Result: at 768 px the sections had 48 px / 96 px / 80 px / 65 px top padding in
sequence — a 2× range that broke the intended scroll rhythm.

---

## Solution

### Unified three-step responsive scale

```
py-16 sm:py-20 lg:py-24
```

| Breakpoint | Raw value | Pixels |
|---|---|---|
| Default (mobile ≤ 639 px) | `py-16` | 64 px top + 64 px bottom |
| sm (≥ 640 px — tablet) | `sm:py-20` | 80 px top + 80 px bottom |
| lg (≥ 1024 px — desktop) | `lg:py-24` | 96 px top + 96 px bottom |

The scale was chosen to:
- Be visually generous enough on mobile to clearly separate content blocks.
- Step up proportionally at tablet and desktop without feeling excessive.
- Align to the existing Tailwind v4 default spacing scale (no new tokens
  required on the Tailwind side).

### Design tokens added

Three CSS custom properties were added to `app/globals.css` under `:root` to
document the canonical values and make a future global reskin a one-line change:

```css
--section-py-sm: 4rem;   /* 64 px  — mobile  (≤ 639 px)  */
--section-py-md: 5rem;   /* 80 px  — tablet  (≥ 640 px)  */
--section-py-lg: 6rem;   /* 96 px  — desktop (≥ 1024 px) */
```

A companion `section-spacing` CSS utility was also added so that any section
can opt in with a single class if preferred over explicit responsive variants:

```css
@utility section-spacing {
  padding-top: var(--section-py-sm);
  padding-bottom: var(--section-py-sm);

  @media (width >= 640px) {
    padding-top: var(--section-py-md);
    padding-bottom: var(--section-py-md);
  }

  @media (width >= 1024px) {
    padding-top: var(--section-py-lg);
    padding-bottom: var(--section-py-lg);
  }
}
```

---

## Changes per file

### `app/globals.css`
- Added `--section-py-sm/md/lg` tokens under `:root`.
- Added `@utility section-spacing` responsive utility.

### `components/landing/hero.tsx`
- Applied `text-display-2xl` token to `<h1>` (fixes pre-existing failing
  test in `hero.test.tsx`).
- Applied `text-body-lg` token and `data-testid="hero-subtext"` to the
  subtitle `<p>` (fixes pre-existing failing test).
- Hero vertical rhythm continues to rely on `min-h-screen` + flex centering
  because the hero is intentionally full-viewport; no section-level `py-*` is
  needed or added.

### `components/landing/benefits.tsx`
- `pt-24 pb-10` → `py-16 sm:py-20 lg:py-24`.

### `components/landing/how-it-works.tsx`
- `py-20` → `py-16 sm:py-20 lg:py-24`.

### `components/landing/enterprise-section.tsx`
- Added an outer `<section className="py-16 sm:py-20 lg:py-24 px-4 ...">` wrapper.
- Moved `aria-labelledby` to the new outer `<section>`.
- Inner card `div` retains `p-10 lg:p-[65px]` for its own visual treatment.
- Removed `m-4` margin (spacing is now handled by section padding).

### `components/landing/landing-page.tsx`
- Stats section wrapper: `py-12 md:py-16` → `py-16 sm:py-20 lg:py-24`.
- `HowItWorks` skeleton fallback: `py-20` → `py-16 sm:py-20 lg:py-24`.
- `EnterpriseSolutionSection` skeleton fallback: `py-20` → `py-16 sm:py-20 lg:py-24`.
- `FAQSection` skeleton fallback: `py-20` → `py-16 sm:py-20 lg:py-24`.

### `components/landing/landing-page.test.tsx` (new)
- Tests for `BenefitsSection`, `HowItWorks`, `EnterpriseSolutionSection`,
  `Hero`, and the `StatsCards` section wrapper.
- Each test asserts the three rhythm classes are present together and that
  the old ad-hoc values are absent.
- Accessibility smoke-checks for landmark roles and ARIA attributes.

---

## Before / After summary

| Section | Before (tablet 768 px) | After (tablet 768 px) |
|---|---|---|
| Hero | full-viewport flex — unchanged | full-viewport flex — unchanged |
| Stats | 48 px top / 64 px bottom (`py-12 md:py-16`) | **80 px** top + bottom |
| Key Features | component-defined | component-defined (not in scope) |
| How It Works | 80 px top + bottom (`py-20`) | **80 px** top + bottom ✓ |
| Value Propositions | component-defined | component-defined (not in scope) |
| Enterprise Solution | ~4 px top margin only | **80 px** top + bottom |
| Benefits | 96 px top / 40 px bottom (`pt-24 pb-10`) | **80 px** top + bottom |
| FAQ | 80 px top + bottom (`py-20`) | **80 px** top + bottom ✓ |
| GetStartedCTA | component-defined | component-defined (not in scope) |

---

## Responsive behaviour across breakpoints

| Breakpoint | Width | All in-scope sections |
|---|---|---|
| Mobile | 375 px | 64 px (`py-16`) |
| Tablet sm | 640 px | 80 px (`sm:py-20`) |
| Tablet md | 768 px | 80 px (`sm:py-20`) |
| Desktop lg | 1024 px | 96 px (`lg:py-24`) |
| Desktop xl | 1280 px | 96 px (`lg:py-24`) |
| Wide 2xl | 1536 px | 96 px (`lg:py-24`) |

---

## Accessibility notes (WCAG 2.1 AA)

1. **Landmark roles** — every modified section remains a `<section>` element
   (implicit ARIA `region` role when an accessible name is present, generic
   sectioning element otherwise). No landmark roles were removed.

2. **Colour contrast** — spacing changes only affect layout metrics; no
   foreground or background colours were altered. Existing contrast ratios
   are preserved.

3. **Focus order** — padding changes do not affect the DOM order, so keyboard
   tab sequence is unchanged.

4. **Reduced motion** — `useReducedMotion` is already respected in `hero.tsx`
   (decorative orbs and rotated cards hidden). Spacing changes have no motion
   component.

5. **Screen reader experience** — additional `aria-labelledby` placement on
   the new `enterprise-section.tsx` outer `<section>` ensures the region is
   correctly announced.

6. **Print styles** — `enterprise-section.tsx` inner card retains
   `print:bg-white print:shadow-none print:border-gray-300` unchanged.

---

## How to verify manually

```bash
# Start dev server
npm run dev

# Open Chrome DevTools → responsive mode:
#   375 px  — confirm all sections show 64 px top/bottom gap
#   640 px  — confirm all sections show 80 px top/bottom gap
#   768 px  — confirm all sections show 80 px top/bottom gap
#   1024 px — confirm all sections show 96 px top/bottom gap
#   1440 px — confirm all sections show 96 px top/bottom gap
```

To measure precisely: open DevTools → Elements, select a `<section>` →
Box Model in Computed styles shows padding-top / padding-bottom.

---

## Running tests

```bash
npm run test -- --reporter=verbose components/landing/landing-page.test.tsx
```

Full suite (no regressions):

```bash
npm run test
npm run type-check
npm run build
```
