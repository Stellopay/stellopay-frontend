# Iconography Design Spec & Audit

## Overview

StelloPay uses **lucide-react** as its single primary icon library. Custom
hand-authored SVG icons are permitted only when no lucide equivalent exists.
All custom icons must conform to the lucide sizing and accessibility
conventions described in this document.

---

## Lucide-react Conventions (source of truth)

| Property          | Value                        | Notes                                         |
| ----------------- | ---------------------------- | --------------------------------------------- |
| `viewBox`         | `"0 0 24 24"`                | All icons share this coordinate space         |
| `width` / `height`| `24` (default)               | Overridable via `size`, `width`, or `height`  |
| `fill`            | `"none"`                     | Stroked icons; filled icons deviate (see §4)  |
| `stroke`          | `"currentColor"`             | Inherits CSS `color`                          |
| `strokeWidth`     | `2`                          | Overridable via `strokeWidth` prop            |
| `strokeLinecap`   | `"round"`                    |                                               |
| `strokeLinejoin`  | `"round"`                    |                                               |
| `aria-hidden`     | `"true"` when no label given | Omitted when `aria-label` / `role` is passed  |
| `forwardRef`      | Yes                          | All lucide icons expose a ref                 |

Reference: `node_modules/lucide-react/dist/esm/defaultAttributes.mjs` (v1.27.0)

---

## Size System

| Token   | Size   | Usage                                              |
| ------- | ------ | -------------------------------------------------- |
| Small   | 16 px  | Inline text, badges, tight UI (e.g., input prefix) |
| Default | 24 px  | Standard UI — matches lucide default               |
| Large   | 32 px  | Hero / feature call-outs                           |

> **Note:** The legacy default documented as 20 px in the original file was
> inconsistent with lucide's 24 px default and has been superseded. Use 24 px
> unless a specific layout context requires 16 px or 20 px.

---

## Import Rules (tree-shaking)

```tsx
// ✅ Named import — keeps bundle tight
import { Bell, ChevronRight } from "lucide-react";

// ❌ Namespace import — imports the entire library
import * as Icons from "lucide-react";
```

---

## Preferred Libraries

| Use case                      | Library / source                         |
| ----------------------------- | ---------------------------------------- |
| UI icons (primary)            | `lucide-react`                           |
| Filled variants (bell-fill)   | `components/icons/` (custom, see §4)     |
| Brand / logo marks            | `public/svg/svg.tsx`                     |
| Restricted                    | `react-icons`, `@hugeicons/react`        |

ESLint `no-restricted-imports` in `.eslintrc.json` blocks restricted packages.
`utils/import-guard.test.ts` CI-validates no prohibited library is used.

---

## Custom Icon Audit (2026-07-29)

### Scope

Files audited: `components/icons/**`

Sidebar / navigation icons in `public/svg/svg.tsx` (e.g., `DashBoardIcon`,
`TransactionIcon`, `SettinIcon`, …) are **out of scope** — they use a
different prop contract (`svgInterface { color: string }`) tied to the sidebar
colour system and are not consumed as general UI icons.

---

### `components/icons/bell-fill-icon.tsx` — `IconBell`

#### Before (original)

| Property    | Value              | Issue                                            |
| ----------- | ------------------ | ------------------------------------------------ |
| `viewBox`   | `"0 0 10 14"`      | ❌ Non-standard, mismatches every lucide icon    |
| `width`     | `10`               | ❌ Renders at 10 px — tiny inside a 24 px slot  |
| `height`    | `14`               | ❌ Non-square, looks squashed                    |
| `fill`      | `"currentColor"`   | ✅ Inherits CSS color correctly                  |
| `size` prop | absent             | ❌ No unified size override                      |
| `aria-*`    | absent             | ❌ Invisible to screen readers and AT tools      |
| `forwardRef`| absent             | ❌ Parent components cannot attach a ref         |

Coordinates: paths drawn in the original 10×14 space — intrinsically scaled
proportionally to a 10 px × 14 px bounding box, not a 24 px square.

#### After (normalized)

| Property    | Value            | Status                                              |
| ----------- | ---------------- | --------------------------------------------------- |
| `viewBox`   | `"0 0 24 24"`    | ✅ Matches lucide convention                         |
| `width`     | `size` (24)      | ✅ Square, matches lucide default                    |
| `height`    | `size` (24)      | ✅ Square                                            |
| `fill`      | `"currentColor"` | ✅ Preserved (intentional — see "Rationale" below)   |
| `size` prop | `24` default     | ✅ Added, matches lucide `size` prop API             |
| `aria-*`    | see below        | ✅ WCAG 2.1 AA compliant                             |
| `forwardRef`| yes              | ✅ Added                                             |

Path geometry: every coordinate was re-mapped from the original 10×14 grid to
the 24×24 grid (scale x × 2.4, scale y × 24/14 ≈ 1.7143). All cubic Bézier
control points are preserved, so the shape is identical — only the coordinate
space changed.

#### Rationale: why this icon cannot be replaced by lucide

Lucide v1.27.0 ships these bell variants, all **stroke-based** (outline only):

`Bell`, `BellCheck`, `BellDot`, `BellElectric`, `BellMinus`, `BellOff`,
`BellPlus`, `BellRing`

None is a **filled** bell. The notification panel uses a solid silhouette for
visual weight consistency with the dark UI. Replacing with a stroked variant
would require additional CSS hacks to achieve the same effect, so the custom
icon is retained.

#### Accessibility notes

The component mirrors lucide's own a11y heuristic:

- **Decorative** (default): `aria-hidden="true"` hides the element from the
  AT tree. Callers must provide adjacent visible text or a labelled container.
- **Meaningful** (explicit label): passing `aria-label`, `aria-labelledby`, or
  `role` promotes the element to `role="img"` and exposes the label to screen
  readers.

```tsx
// Decorative — aria-hidden="true" automatically applied
<div aria-label="Notification">
  <IconBell className="text-white" />
</div>

// Meaningful — when there is no adjacent text
<IconBell aria-label="New notification" />
```

#### Responsive behaviour

The `size` prop (or `width`/`height` overrides) controls the rendered
dimensions. Common breakpoint overrides via Tailwind:

```tsx
// 16 px on mobile, 24 px on md+
<IconBell className="text-white" size={16} style={{ width: undefined, height: undefined }}
  // or use Tailwind: w-4 h-4 md:w-6 md:h-6 (overrides width/height attrs via CSS)
/>
```

Because the icon is a proper 24×24 viewBox, Tailwind's `w-*` / `h-*` utilities
resize it without distortion at any breakpoint.

---

## Migration Strategy

### Replace `react-icons` → `lucide-react`

The ESLint guard and CI import-guard test already block new uses. For any
remaining occurrences found during migration:

1. Find the equivalent in [lucide.dev/icons](https://lucide.dev/icons).
2. Update the import from `react-icons/xx` to `lucide-react`.
3. Remove the `react-icons` package after all usages are cleared.

### Normalise existing custom icons

1. Audit `viewBox`, `width`, `height` against the 24×24 convention.
2. Re-map path coordinates if the coordinate space differs.
3. Add `size` prop, `forwardRef`, and `aria-hidden` default.
4. Add or update tests (see §Testing below).

### Do NOT migrate

- `public/svg/svg.tsx` — brand marks and sidebar glyphs with a fixed colour
  contract; normalising would break the sidebar colour system.
- `StellOpayLogo`, `StellarIcon` — logotype SVGs; these must preserve their
  exact proportions and are not UI icons.

---

## Adding a New Custom Icon

When a required icon has no lucide equivalent:

1. Create `components/icons/<name>-icon.tsx`.
2. Export a named component (`Icon<Name>`) and an interface
   (`<Name>IconProps extends IconProps`).
3. Follow the template exactly:

```tsx
import { forwardRef } from "react";
import { IconProps } from "@/types/icons";

export interface MyIconProps extends IconProps {
  size?: number | string;
}

export const IconMyIcon = forwardRef<SVGSVGElement, MyIconProps>(
  function IconMyIcon({ className, size = 24, "aria-label": ariaLabel, role, ...props }, ref) {
    const hasA11yLabel = ariaLabel !== undefined || props["aria-labelledby"] !== undefined || role !== undefined;
    const a11yProps = hasA11yLabel
      ? { "aria-label": ariaLabel, role: role ?? "img" }
      : { "aria-hidden": "true" as const };

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"                  // use "currentColor" for filled variants
        stroke="currentColor"        // omit for filled variants
        strokeWidth={2}              // omit for filled variants
        strokeLinecap="round"        // omit for filled variants
        strokeLinejoin="round"       // omit for filled variants
        className={className}
        {...a11yProps}
        {...props}
      >
        {/* paths */}
      </svg>
    );
  },
);

IconMyIcon.displayName = "IconMyIcon";
```

4. Add an entry to this document under "Custom Icon Audit".
5. Write tests covering: fill/stroke, size prop, className, aria-hidden
   default, aria-label promotion, and viewBox.
6. Add the file path to `vitest.config.ts` coverage `include` list.

---

## Testing

Every icon in `components/icons/` should have a companion test file at
`components/icons/<name>.test.tsx` covering:

| Test case                          | Assertion                                          |
| ---------------------------------- | -------------------------------------------------- |
| Default render                     | Renders without error                              |
| `fill` / `stroke`                  | Paths use `currentColor`                           |
| viewBox                            | `viewBox === "0 0 24 24"`                          |
| Default size                       | `width === "24"` and `height === "24"`             |
| `size` prop                        | `width` and `height` reflect the prop value        |
| `className` forwarding             | SVG has the supplied class                         |
| Decorative `aria-hidden`           | `aria-hidden === "true"` when no label             |
| `aria-label` promotion             | `role="img"` + label present when `aria-label` set |
| Color inheritance (light/dark)     | Computed color matches parent `color`              |
| Prop forwarding                    | Arbitrary SVG props land on the element            |
| `forwardRef`                       | Ref points to the `<svg>` element                  |

---

## Stroke Width Reference

| Context                  | `strokeWidth` | Notes                       |
| ------------------------ | ------------- | --------------------------- |
| Standard UI              | `2`           | Lucide default              |
| Dense / small (≤ 16 px)  | `1.5`         | Avoids heavy appearance     |
| Filled icons             | N/A           | No stroke used              |
