


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

### Props
- `value` (string): The primary large metric value to display.
- `label` (string): The secondary description label below the value.
- `className` (string): Additional CSS classes applied to the value text.

### Usage Example
```tsx
import EnterpriseSolutionCard from "@/components/ui/enterprise-solution-card";

export default function MetricView() {
  return (
    <EnterpriseSolutionCard 
      value="$1.2M" 
      label="Total Processed Volume" 
      className="text-green-500" 
    />
  );
}
```

### Near-Duplicate Notice
> **Note**: This component serves a similar purpose to a standard `MetricCard` or `StatCard` but has a fixed layout (`h-[118px]`) and centered alignment. It should not be reused blindly if a generic, flexible card is needed.

### Accessibility Notes (WCAG 2.1 AA)

The file also hardcodes non-token hex values that are **not** `zinc-*` utilities and were left untouched per this issue's scope (e.g. `bg-white dark:bg-[#111111]`, `bg-[#0D0D0D80]`, `border-[#2D2D2D]`, `bg-[#121212]`). These represent the same class of design-token debt and would be a reasonable follow-up issue, but reconciling them changes a much larger surface area of the component (including the non-`showNotifications` dark-card visual treatment) than a zinc-vs-token audit calls for.

### Responsive & accessibility validation

- **Flex Layout**: Uses `flex flex-col gap-2` to stack the value and label vertically, adapting to varying text lengths gracefully.
- **Dimensions**: Retains a fixed height (`h-[118px]`) with `w-full`, allowing the card to stretch fluidly across CSS grid or flex layouts across breakpoints (`sm`, `md`, `lg`, `xl`).
- **Text Wrapping**: The text is centered (`text-center`) and breaks naturally, preserving readability on smaller screens.

---

## Card Skeleton (components/ui/card-skeleton.tsx)

Provides loading placeholder states for various card layouts.

### Props (CardSkeleton)
- `showHeader` (boolean, optional): Whether to display a header block. Defaults to `true`.
- `lines` (number, optional): Number of content lines to display. Defaults to `3`.
- `className` (string, optional): Additional classes to apply to the root element.

### Usage Example
```tsx
import { CardSkeleton, AccountSummaryCardSkeleton } from "@/components/ui/card-skeleton";

export default function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CardSkeleton showHeader={true} lines={4} />
      <AccountSummaryCardSkeleton />
    </div>
  );
}
```

### Near-Duplicate Notice
> **Note**: `CardSkeleton` is a lightweight wrapper around `SkeletonCard` from `./skeleton.tsx`. When building new skeletons, consider if `SkeletonCard` is more appropriate or if a new specific component like `AccountSummaryCardSkeleton` should be added here instead of duplicating.

### Accessibility Notes (WCAG 2.1 AA)
- **ARIA**: These components represent loading states. They should be wrapped in an `aria-busy="true"` container or use `aria-hidden="true"` to prevent screen readers from announcing meaningless content while loading.
- **Contrast**: The skeleton background colors use subdued, low-contrast tokens by design to indicate a placeholder, but they adapt correctly to light and dark modes.

### Responsive Behavior
- **Fluid Width**: Components use `w-full` to fit within their parent containers.
- **Heights**: `AccountSummaryCardSkeleton` uses a fixed height `h-[7.5rem]` while `CardSkeleton` grows based on the `lines` prop. Both respect fluid layout breakpoints (`sm` to `xl`).


## Feature Card Grid Entrance Animation

### Accessibility Notes (WCAG 2.1 AA)

- **Reduced Motion**: The staggered entrance animation is gated behind the useReducedMotion hook. Users who prefer reduced motion will see the grid appear instantly at full opacity.
- **Layout Stability**: The animation uses only opacity and 	ransform (y-axis translation) to avoid layout recalculations and ensure smooth, jank-free performance.
- **Contrast & ARIA**: Existing contrast ratios and ARIA attributes are preserved without interference from the Framer Motion wrapper.

