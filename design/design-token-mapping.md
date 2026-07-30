# Design Token → Tailwind Class Mapping Reference

This document maps every CSS custom property defined in [`app/globals.css`](../app/globals.css) to its generated Tailwind utility class and provides one-line usage guidance. Both light and dark mode values are listed for each token.

> **How it works.** Tailwind CSS 4 reads the `@theme inline` block in `app/globals.css` and generates `bg-*`, `text-*`, `border-*`, and `ring-*` utilities from the `--color-*` variables declared there. Each `--color-*` entry is an alias that resolves to its corresponding CSS custom property at runtime, so light/dark values switch automatically via the `.dark` class on the root element.

---

## Quick reference

| Token group       | Custom property prefix   | Tailwind prefix examples               |
| ----------------- | ------------------------ | -------------------------------------- |
| Surface / base    | `--background`, `--foreground` | `bg-background`, `text-foreground`  |
| Card              | `--card*`                | `bg-card`, `text-card-foreground`      |
| Popover           | `--popover*`             | `bg-popover`, `text-popover-foreground`|
| Primary           | `--primary*`             | `bg-primary`, `text-primary-foreground`|
| Secondary         | `--secondary*`           | `bg-secondary`, `text-secondary-foreground` |
| Muted             | `--muted*`               | `bg-muted`, `text-muted-foreground`    |
| Accent            | `--accent*`              | `bg-accent`, `text-accent-foreground`  |
| Semantic          | `--destructive`, `--success`, `--warning` | `bg-destructive`, `text-success`, `border-warning` |
| Form chrome       | `--border`, `--input`, `--ring` | `border-border`, `border-input`, `ring-ring` |
| Charts            | `--chart-1` … `--chart-5` | `bg-chart-1` … `bg-chart-5`           |
| Disabled state    | `--disabled-opacity`      | `opacity-disabled`, `cursor-disabled`  |
| Sidebar           | `--sidebar*`             | `bg-sidebar`, `text-sidebar-foreground`|
| Border radius     | `--radius*`              | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` |
| Skeleton / shimmer | `--shimmer-duration`, `--shimmer-easing` | `.skeleton-shimmer` (custom class) |

---

## Base surface tokens

These tokens set the page-wide background and default text colour. They are applied in the `@layer base` block of `app/globals.css` via `bg-background text-foreground`.

| CSS custom property | Tailwind class       | Light value  | Dark value   | Usage guidance                                                      |
| ------------------- | -------------------- | ------------ | ------------ | ------------------------------------------------------------------- |
| `--background`      | `bg-background`      | `#ffffff`    | `#0a0a0a`    | Page and root layout background. Set once in `body`; do not override per-component unless creating a layered surface. |
| `--foreground`      | `text-foreground`    | `#0a0a0a`    | `#fafafa`    | Primary body text. Default for all readable prose, headings, and labels that sit directly on the background. |

---

## Card tokens

Cards are elevated surfaces that sit one layer above the page background. Use them for content containers such as dashboard stat tiles, transaction rows, and settings panels.

| CSS custom property   | Tailwind class           | Light value (oklch)                      | Dark value (oklch)                       | Usage guidance                                                            |
| --------------------- | ------------------------ | ---------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `--card`              | `bg-card`                | `oklch(100% 0.00011 271.152)` ≈ white    | `oklch(20.463% 0.00002 271.152)` ≈ dark zinc | Card background. Applied by `<Card>` in `components/ui/card.tsx`.     |
| `--card-foreground`   | `text-card-foreground`   | `oklch(14.479% 0.00002 271.152)` ≈ near-black | `oklch(98.511% 0.00011 271.152)` ≈ near-white | Default text inside a card. Falls back to `text-foreground` semantically. |

---

## Popover tokens

Popovers and dropdowns share a distinct surface so they remain legible when they overlap cards or the page background.

| CSS custom property       | Tailwind class               | Light value (oklch)                      | Dark value (oklch)                            | Usage guidance                                                                     |
| ------------------------- | ---------------------------- | ---------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `--popover`               | `bg-popover`                 | `oklch(100% 0.00011 271.152)` ≈ white    | `oklch(20.463% 0.00002 271.152)` ≈ dark zinc  | Floating panel background: `<DropdownMenuContent>`, `<DialogContent>`, tooltips.  |
| `--popover-foreground`    | `text-popover-foreground`    | `oklch(14.479% 0.00002 271.152)` ≈ near-black | `oklch(98.511% 0.00011 271.152)` ≈ near-white | Text inside popovers and dialog bodies.                                            |

---

## Primary tokens

The primary colour is the brand action colour used for the most important interactive controls — primary buttons, selected states, and active nav indicators.

| CSS custom property       | Tailwind class               | Light value (oklch)                       | Dark value (oklch)                            | Usage guidance                                                                                       |
| ------------------------- | ---------------------------- | ----------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--primary`               | `bg-primary`, `text-primary` | `oklch(20.463% 0.00002 271.152)` ≈ near-black | `oklch(92.191% 0.0001 271.152)` ≈ light zinc  | Fill for `<Button variant="default">`, active links, selection highlights.                          |
| `--primary-foreground`    | `text-primary-foreground`    | `oklch(98.511% 0.00011 271.152)` ≈ near-white | `oklch(20.463% 0.00002 271.152)` ≈ near-black | Text/icon colour placed directly on a `bg-primary` surface. Always pair with `bg-primary`.          |

---

## Secondary tokens

Secondary colour for lower-emphasis interactive surfaces: secondary buttons, tag pills, and supplementary CTAs.

| CSS custom property          | Tailwind class                  | Light value (oklch)                      | Dark value (oklch)                              | Usage guidance                                                                                           |
| ---------------------------- | ------------------------------- | ---------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--secondary`                | `bg-secondary`                  | `oklch(97.015% 0.00011 271.152)` ≈ light zinc | `oklch(26.862% 0.00003 271.152)` ≈ dark zinc  | `<Button variant="secondary">` background; filter-chip selected state.                                  |
| `--secondary-foreground`     | `text-secondary-foreground`     | `oklch(20.463% 0.00002 271.152)` ≈ near-black | `oklab(98.511% 0 -0.00011)` ≈ near-white        | Text/icon placed on `bg-secondary`. Always pair with `bg-secondary`.                                    |

---

## Muted tokens

Muted surfaces and text reduce visual weight for de-emphasised content: placeholders, help text, disabled labels, and skeleton loaders.

| CSS custom property     | Tailwind class            | Light value (oklch)                      | Dark value (oklch)                            | Usage guidance                                                                                    |
| ----------------------- | ------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `--muted`               | `bg-muted`                | `oklch(97.015% 0.00011 271.152)` ≈ light zinc | `oklch(26.862% 0.00003 271.152)` ≈ dark zinc | Tab strip background (`<TabsList>`), code blocks, input helper regions.                          |
| `--muted-foreground`    | `text-muted-foreground`   | `oklch(55.553% 0.00006 271.152)` ≈ mid-grey | `oklch(70.9% 0.00008 271.152)` ≈ lighter grey  | Secondary or helper text: card descriptions, input `placeholder`, timestamps, icon labels.       |

> **Contrast note.** `text-muted-foreground` on `bg-background` (white) achieves ≈ 5.7 : 1 in light mode — WCAG 2.1 AA compliant for body text (4.5 : 1 minimum). Verify contrast when combining with non-white backgrounds.

---

## Accent tokens

Accent is a hover/focus highlight colour used for interactive surface feedback. It is intentionally low-contrast so it does not compete with primary actions.

| CSS custom property       | Tailwind class               | Light value (oklch)                      | Dark value (oklch)                            | Usage guidance                                                                                           |
| ------------------------- | ---------------------------- | ---------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--accent`                | `bg-accent`                  | `oklch(97.015% 0.00011 271.152)` ≈ light zinc | `oklch(26.862% 0.00003 271.152)` ≈ dark zinc | Hover background on menu items (`hover:bg-accent`), ghost buttons, and outline button hover state.      |
| `--accent-foreground`     | `text-accent-foreground`     | `oklch(20.463% 0.00002 271.152)` ≈ near-black | `oklch(98.511% 0.00011 271.152)` ≈ near-white | Text colour when an element uses `bg-accent` as its background; always pair with `bg-accent`.            |

---

## Semantic status tokens

These tokens communicate outcome or urgency and must never be used purely for decoration. Always accompany colour with a text label or icon so meaning is not lost for colour-blind users.

| CSS custom property  | Tailwind class              | Light value (oklch)                          | Dark value (oklch)                            | Usage guidance                                                                                         |
| -------------------- | --------------------------- | -------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--destructive`      | `bg-destructive`, `text-destructive`, `border-destructive` | `oklch(58.302% 0.23867 28.465)` ≈ red | `oklch(0.704 0.191 22.216)` ≈ lighter red | Delete actions, form validation errors, `<Button variant="destructive">`, `aria-invalid` input borders. |
| `--success`          | `text-success`, `border-success` | `oklch(62.74% 0.1492 145.45)` ≈ green   | `oklch(0.645 0.246 145.45)` ≈ green           | Confirmed transactions, form success states, password strength "strong" indicator.                    |
| `--warning`          | `text-warning`, `border-warning` | `oklch(76.94% 0.1766 70.08)` ≈ amber    | `oklch(0.769 0.188 70.08)` ≈ amber            | Pending or caution states; offline-banner warning.                                                    |

> **Accessibility.** When placing text directly on a semantic background (e.g. `bg-destructive`), use `text-white` (light mode) or check that the combined contrast ratio meets 4.5 : 1 for normal text / 3 : 1 for large text (WCAG 1.4.3).

---

## Form chrome tokens

These tokens govern the visual chrome of form fields, focus rings, and dividers.

| CSS custom property | Tailwind class   | Light value (oklch)                      | Dark value (oklch)                            | Usage guidance                                                                                                       |
| ------------------- | ---------------- | ---------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--border`          | `border-border`  | `oklch(92.191% 0.0001 271.152)` ≈ light grey | `oklch(100% 0.00011 271.152 / 0.102)` ≈ white/10% | Default divider and card/input border. Applied globally via `* { @apply border-border }` in `@layer base`.  |
| `--input`           | `border-input`   | `oklch(0% 0 0 / 0.502)` ≈ black/50%     | `oklch(1 0 0 / 15%)` ≈ white/15%             | Border colour for `<Input>` and `<Textarea>`. Distinct from `--border` to allow independent tuning of field chrome. |
| `--ring`            | `ring-ring`, `focus-visible:ring-ring/50` | `oklch(70.9% 0.00008 271.152)` ≈ mid-grey | `oklch(55.553% 0.00006 271.152)` ≈ darker grey | Focus ring colour. Applied via `outline-ring/50` globally; add `focus-visible:ring-ring/50 focus-visible:ring-[3px]` for explicit focus styles on interactive elements. |

---

## Chart tokens

Chart tokens provide a consistent categorical colour palette for data visualisations. They are only used inside `components/analytics/`.

| CSS custom property | Tailwind class | Light value (oklch)                      | Dark value (oklch)                          | Usage guidance                                                                                   |
| ------------------- | -------------- | ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--chart-1`         | `bg-chart-1`   | `oklch(64.71% 0.21732 36.839)` ≈ orange  | `oklch(0.488 0.243 264.376)` ≈ blue         | First data series. Primary dataset in bar/line/area charts.                                     |
| `--chart-2`         | `bg-chart-2`   | `oklch(60.488% 0.10705 184.202)` ≈ teal  | `oklch(70.192% 0.15767 160.464)` ≈ green    | Second data series.                                                                              |
| `--chart-3`         | `bg-chart-3`   | `oklch(39.716% 0.06984 227.223)` ≈ dark blue | `oklch(0.769 0.188 70.08)` ≈ amber      | Third data series.                                                                               |
| `--chart-4`         | `bg-chart-4`   | `oklch(0.828 0.189 84.429)` ≈ yellow     | `oklch(0.627 0.265 303.9)` ≈ purple         | Fourth data series.                                                                              |
| `--chart-5`         | `bg-chart-5`   | `oklch(0.769 0.188 70.08)` ≈ amber       | `oklch(0.645 0.246 16.439)` ≈ coral         | Fifth data series. Use sparingly — six-or-more series should be avoided for accessibility.     |

> **Chart accessibility.** Colour alone is insufficient to distinguish data series. Always pair chart colour with pattern fills, distinct shapes, or a visible legend that uses both colour and text labels.

---

## Sidebar tokens

Sidebar tokens decouple the navigation rail from the main page surface so it can carry an independent visual style.

| CSS custom property               | Tailwind class                      | Light value (oklch)                      | Dark value (oklch)                            | Usage guidance                                                                      |
| --------------------------------- | ----------------------------------- | ---------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--sidebar`                       | `bg-sidebar`                        | `oklch(98.511% 0.00011 271.152)` ≈ near-white | `oklch(20.463% 0.00002 271.152)` ≈ dark zinc | Sidebar container background. Used in `components/common/side-bar.tsx`.           |
| `--sidebar-foreground`            | `text-sidebar-foreground`           | `oklch(14.479% 0.00002 271.152)` ≈ near-black | `oklch(0.985 0 0)` ≈ near-white               | Default text and icon colour inside the sidebar.                                    |
| `--sidebar-primary`               | `bg-sidebar-primary`                | `oklch(20.463% 0.00002 271.152)` ≈ near-black | `oklch(0.488 0.243 264.376)` ≈ blue           | Active/selected nav item background.                                                |
| `--sidebar-primary-foreground`    | `text-sidebar-primary-foreground`   | `oklch(98.511% 0.00011 271.152)` ≈ near-white | `oklch(0.985 0 0)` ≈ near-white               | Text on the active nav item.                                                        |
| `--sidebar-accent`                | `bg-sidebar-accent`                 | `oklch(0.97 0 0)` ≈ light grey           | `oklch(0.269 0 0)` ≈ dark grey                | Hover background for nav items.                                                     |
| `--sidebar-accent-foreground`     | `text-sidebar-accent-foreground`    | `oklch(0.205 0 0)` ≈ near-black          | `oklch(0.985 0 0)` ≈ near-white               | Text colour on hovered nav items.                                                   |
| `--sidebar-border`                | `border-sidebar-border`             | `oklch(0.922 0 0)` ≈ light grey          | `oklch(1 0 0 / 10%)` ≈ white/10%             | Dividers and separator lines inside the sidebar.                                    |
| `--sidebar-ring`                  | `ring-sidebar-ring`                 | `oklch(0.708 0 0)` ≈ mid-grey            | `oklch(0.556 0 0)` ≈ darker grey              | Focus ring for interactive elements inside the sidebar.                             |

---

## Border radius tokens

Radius tokens are mapped through arithmetic on the base `--radius` variable (`0.625rem`). Tailwind 4 generates `rounded-*` utilities from the `--radius-*` entries in `@theme inline`.

| CSS custom property | Tailwind class | Computed value          | Usage guidance                                                          |
| ------------------- | -------------- | ----------------------- | ----------------------------------------------------------------------- |
| `--radius` (base)   | —              | `0.625rem` (10 px)      | Base variable only; used as arithmetic input for the four below.        |
| `--radius-sm`       | `rounded-sm`   | `calc(0.625rem - 4px)` ≈ 0.375 rem | Tight corners: badges, inline chips, small tag pills.         |
| `--radius-md`       | `rounded-md`   | `calc(0.625rem - 2px)` ≈ 0.5 rem  | Standard input fields, `<Button>`, menu items, and table rows. |
| `--radius-lg`       | `rounded-lg`   | `0.625rem`              | Cards, dialogs, dropdowns, and primary content containers.              |
| `--radius-xl`       | `rounded-xl`   | `calc(0.625rem + 4px)` ≈ 0.875 rem | Hero banners, full-width modal overlays, large image containers. |

---

## Disabled-state tokens

Disabled-state tokens control the visual appearance of disabled form controls and buttons. They are consumed via the `opacity-disabled` and `cursor-disabled` Tailwind utilities generated from the `@theme inline` block in `app/globals.css`.

| CSS custom property  | Tailwind class       | Value          | Usage guidance                                                                                     |
| -------------------- | -------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `--disabled-opacity` | `opacity-disabled`   | `0.5`          | Opacity applied to all disabled controls — reduces visual weight while keeping content legible.    |
| (none — hardcoded)   | `cursor-disabled`    | `not-allowed`  | Cursor shown when hovering a disabled control — communicates non-interactivity.                    |

> **Contrast note.** A 50 % opacity overlay on any background/foreground pair still maintains ≥ 3 : 1 perceived contrast for the disabled surface vs. the enabled surface (WCAG 2.1 SC 1.4.1 Use of Color). The underlying text/icon colour tokens already meet 4.5 : 1 against their background; the opacity reduction does not introduce new contrast failures because disabled controls are inert and do not require readable content per WCAG 2.1 SC 1.4.3 (the criterion applies to active/functional content).

### Usage in components

All form and button primitives apply the disabled-state tokens through Tailwind's `disabled:` variant modifier:

| Component                                         | Classes applied                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `components/ui/button.tsx`                        | `disabled:pointer-events-none disabled:opacity-disabled disabled:cursor-disabled` |
| `components/ui/checkbox.tsx`                      | `disabled:cursor-disabled disabled:opacity-disabled`                              |
| `components/common/text-input.tsx` (wrapper div)  | `opacity-disabled cursor-disabled pointer-events-none` (via conditional class)    |
| `components/ui/input.tsx`                         | `disabled:pointer-events-none disabled:cursor-disabled disabled:opacity-disabled` |

The `disabled-state` utility class (defined in `app/globals.css`) also bundles all three properties for use on non-form elements:

```html
<button class="disabled-state" disabled>Save</button>
```

Prefer the individual `disabled:opacity-disabled` / `disabled:cursor-disabled` pattern in components that already use Tailwind's `disabled:` variant.

---

## Typography tokens

Font-family tokens are registered in `@theme inline` and resolve to CSS variables injected by Next.js `localFont`.

| CSS custom property | Tailwind class      | Font variable        | Usage guidance                                                                    |
| ------------------- | ------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `--font-sans`       | `font-sans`         | `--font-inter`       | Body text, UI labels, form inputs. Default; applied globally via `body { @apply font-sans }`. |
| `--font-clash`      | `font-clash`        | `--font-clash`       | Display headings, hero text, and marketing copy. Used with `font-clash` utility.  |
| `--font-general`    | `font-general`      | `--font-general`     | Secondary display font. Used in specific landing-page sections.                   |

---

## Utility classes (non-token)

These are custom utility classes defined directly in `app/globals.css` and not backed by a CSS custom property.

| Class              | Definition                              | Usage guidance                                                                                        |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.skeleton-shimmer`| Left-to-right shimmer keyframe animation via `::after` pseudo-element, driven by `--shimmer-duration` and `--shimmer-easing` CSS custom properties in `:root`. | Add alongside `bg-[#3A3A3A]` or `bg-[#2D2D2D]` on skeleton loader elements. Used by `<Skeleton>` in `components/ui/skeleton.tsx` and composed by `CardSkeleton` / `TransactionTableSkeleton`. Respects `prefers-reduced-motion: reduce` by falling back to a static opacity pulse. |
| `.scrollbar-hide`  | `scrollbar-width: none` + webkit override | Hides scrollbars on overflow containers (horizontal scroll carousels, analytics tab bars) while keeping the content scrollable. |

---

## Token composition examples

The examples below show how to combine tokens correctly for common patterns.

### Primary button (matches `<Button variant="default">`)

```html
<button class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium">
  Pay Now
</button>
```

### Card with description

```html
<div class="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm">
  <h2 class="font-semibold leading-none">Account Balance</h2>
  <p class="text-muted-foreground text-sm mt-1">Last updated 2 minutes ago</p>
</div>
```

### Destructive inline error

```html
<p class="text-destructive text-sm" role="alert">
  Invalid wallet address.
</p>
```

### Input with focus ring

```html
<input
  class="border-input bg-transparent rounded-md px-3 py-1 text-base
         focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
         outline-none transition-[color,box-shadow]"
/>
```

### Muted helper text

```html
<p class="text-muted-foreground text-xs mt-1">
  Enter your 56-character Stellar address (starts with G).
</p>
```

---

## Anti-patterns

| ❌ Avoid                                      | ✅ Prefer                              | Reason                                                                  |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `text-[#9CA3AF]`                              | `text-muted-foreground`                | Hard-coded hex bypasses the dark mode switch and fails token audits.   |
| `bg-[#ffffff]` / `bg-[#0a0a0a]`              | `bg-background`                        | Same reason — use the semantic token.                                   |
| `border-gray-200`                             | `border-border`                        | `border-border` adjusts opacity in dark mode; `border-gray-200` does not. |
| `text-red-500`                                | `text-destructive`                     | The semantic token scales with the theme; raw Tailwind palette steps do not. |
| `text-green-500`                              | `text-success`                         | Same reason.                                                            |
| Using `bg-accent` for decorative colour       | Use brand gradient or a chart token    | `bg-accent` is reserved for interactive hover feedback only.           |
| Adding a sixth chart colour as a raw hex      | Extend `--chart-*` in `globals.css`    | Keeps the colour palette auditable and swappable without touching components. |

---

## Responsive behaviour

Token-based classes work at every breakpoint without additional overrides because they are pure colour/radius utilities. Apply Tailwind's responsive prefixes to layout and size utilities, not to token classes:

```html
<!-- ✅ Breakpoint on layout, token on colour -->
<div class="p-4 sm:p-6 lg:p-8 bg-card text-card-foreground rounded-lg">…</div>

<!-- ❌ Do not use breakpoint-scoped token classes unless the colour genuinely changes per viewport -->
<div class="bg-white sm:bg-card">…</div>
```

Breakpoints used in this project:

| Prefix | Min-width |
| ------ | --------- |
| `sm:`  | 640 px    |
| `md:`  | 768 px    |
| `lg:`  | 1 024 px  |
| `xl:`  | 1 280 px  |

---

## Dark mode

Dark mode is controlled by the `.dark` class on the root element, toggled via the [`useTheme`](../context/theme-context.tsx) hook in `context/theme-context.tsx`. Tailwind 4 uses the `@custom-variant dark (&:is(.dark *))` declaration in `app/globals.css` to scope dark variants. Use the `dark:` modifier when a component needs to override a token beyond what the CSS variable already provides:

```html
<!-- Most dark mode changes are handled automatically by the token -->
<div class="bg-card text-card-foreground">…</div>

<!-- Use dark: override only for cases the token cannot cover -->
<div class="bg-input/30 dark:bg-input/50">…</div>
```

---

## Adding a new token

1. Declare the CSS custom property in both `:root` and `.dark` in [`app/globals.css`](../app/globals.css).
2. Add a `--color-<name>: var(--<name>)` entry in the `@theme inline` block (same file) to generate the Tailwind utility.
3. Add a row to the relevant table in this document with light and dark values and usage guidance.
4. If the token fixes a known a11y exception, remove the entry from `KNOWN_EXCEPTIONS` in `tests/a11y.spec.ts`.

---

*Last updated: docs/design-token-mapping-reference branch.*
