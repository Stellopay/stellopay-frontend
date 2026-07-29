


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

## First-Login Guided Product Tour

A 5-step spotlight overlay (`DashboardTour`) highlights one dashboard widget per step on first authenticated dashboard visit, reducing the learning curve for new users.

### Steps

| Step | Widget | Icon | Highlight |
|------|--------|------|-----------|
| 1 | Welcome (overview) | Sparkles | No target; centered tooltip |
| 2 | Account Summary | Wallet | AccountOverview ref |
| 3 | Quick Actions | Zap | QuickActions ref |
| 4 | Analytics & Insights | BarChart3 | AnalyticsInsights ref |
| 5 | Detailed Analytics | TrendingUp | ClientAnalyticsView ref |

### Implementation

- **File**: `components/dashboard/dashboard-tour.tsx`
- **Trigger**: Auto-opens 800ms after first authenticated dashboard visit (tracked via `safeStorage` key `stellopay_dashboard_tour_completed`)
- **Persistence**: Marked complete in `localStorage` after "Get Started" is clicked or user dismisses any step
- **Dismissible**: Skip button (X) on every step; Escape key closes the entire tour
- **Keyboard nav**: Tab cycles through tooltip controls; Enter activates; Escape dismisses

### Accessibility (WCAG 2.1 AA)

- **ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` linking to step title (`tour-title-${step.id}`), `aria-describedby` linking to step description (`tour-description-${step.id}`).
- **Focus management**: Focus is automatically placed inside the tour tooltip upon opening and step change; Tab/Shift+Tab cycle focus strictly within the dialog controls.
- **Keyboard navigation**: Tab/Shift+Tab for focus trap navigation, Enter/Space for button activation, Escape key to dismiss and mark complete.
- **Contrast**: Complies with 4.5:1 ratio requirement (high-contrast dark text on light tooltip in light mode, bright white/zinc text on dark background `#111111` in dark mode). Blue focus rings (`ring-blue-500`) provide visible focus indicators.
- **Reduced motion**: Respects `prefers-reduced-motion` settings, bypassing smooth scrolling and highlight transitions when enabled.
- **Screen readers**: Icons set to `aria-hidden="true"`, step indicators announce current step via `aria-current="step"` and descriptive `aria-label`.

### Responsive Behavior Across Breakpoints

| Viewport Breakpoint | Target Width | Tour Overlay & Spotlight Behavior |
|---------------------|--------------|-----------------------------------|
| **sm** (640px) | 640px | Highlighting bounding box dynamically tracks target elements; overlay tooltip spans `w-[calc(100%-2rem)]` centered horizontally with touch-friendly targets (min 44px height). |
| **md** (768px) | 768px | Tooltip positions dynamically below highlighted widget with safe margin padding (`top: Math.min(...)`, `left: calc(50%)`). |
| **lg** (1024px) | 1024px | Multi-column widget layout supported; target element spotlight dynamically recalculates on resize/scroll events. |
| **xl** (1280px+) | 1280px+ | Full desktop layout (`max-w-[1600px]`); smooth scroll-into-view centers active target before spotlight calculation. |

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

