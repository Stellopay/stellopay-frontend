# Iconography Guidelines

> **Policy owner**: see [`CONTRIBUTING.md → Icon Library Policy`](../CONTRIBUTING.md#icon-library-policy)
> for the decision tree, enforcement details, and exception rules.
> This file covers sizing, stroke, and import conventions only.

---

## Preferred Library

| Priority | Library         | When to use                                              |
| -------- | --------------- | -------------------------------------------------------- |
| Primary  | `lucide-react`  | All UI icons — the single default                        |
| Custom   | Inline SVG      | Filled / brand shapes not available in lucide (see below)|
| Banned   | `react-icons`   | Never — blocked by ESLint and the import-guard test      |
| Banned   | `@hugeicons/*`  | Never — blocked by ESLint and the import-guard test      |

---

## Import Rules (Tree-shaking)

Always use named imports so bundlers can eliminate unused icons:

```ts
// ✅ named import — tree-shakeable
import { Home, Bell } from "lucide-react";

// ❌ namespace import — pulls the entire library into the bundle
import * as Icons from "lucide-react";
```

---

## Size System

| Token   | px  | Use case                                      |
| ------- | --- | --------------------------------------------- |
| Small   | 16  | Dense UI: table cells, badge overlays, chips  |
| Default | 20  | Most interactive controls, navigation items   |
| Large   | 24  | Hero sections, primary CTA buttons            |

Set size via the Tailwind `size-*` utility or explicit `width`/`height` props:

```tsx
<Bell size={20} />             // prop
<Bell className="size-5" />   // Tailwind (20 px)
```

---

## Stroke Width

- Default: **2**
- Do not vary stroke width across icons in the same surface — it breaks visual
  rhythm.

---

## Custom SVG Exception — `bell-fill-icon`

`lucide-react` ships only an outline `Bell`. The notification badge in the
dashboard requires a **filled** bell that is not available as a lucide variant,
so `components/icons/bell-fill-icon.tsx` is the approved exception.

**Component**: `IconBell` exported from `components/icons/bell-fill-icon.tsx`  
**Reason**: filled variant unavailable in lucide-react  
**ViewBox**: `0 0 10 14`  
**Known limitation**: fill is currently hard-coded to `#333333` instead of
`currentColor`. A future update should migrate it to `currentColor` so it
inherits the surrounding text colour and responds to dark-mode.

For the full policy on when and how to add new custom SVG components, see
[`CONTRIBUTING.md → Icon Library Policy`](../CONTRIBUTING.md#icon-library-policy).

---

## Migration Strategy

1. Replace any remaining `react-icons` usages with lucide equivalents.
2. Normalize icon sizes to 20 px (default) unless a specific size token applies.
3. Remove ad-hoc inline SVGs that have a lucide equivalent.
4. For `bell-fill-icon`: migrate `fill="#333333"` → `fill="currentColor"` and
   verify dark-mode contrast (WCAG 2.1 AA requires ≥ 4.5 : 1 for small
   graphical elements).
