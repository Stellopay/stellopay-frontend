


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

## Dashboard Navbar Unread Notification Badge (#714)

### Overview
The notification bell in `components/dashboard/dashboard-navbar.tsx` previously showed only a static red dot with no indication of how many notifications were unread. Now it displays a numeric badge reflecting the `unreadCount` prop, with the count capped at "9+" for double-digit values.

### Component Changes

#### `components/dashboard/dashboard-navbar.tsx`
- Added `unreadCount` prop (optional, defaults to 0)
- Replaced the static red dot on the desktop bell icon with a numeric badge showing `unreadCount` (or "9+" if > 9)
- Updated `aria-label` to announce unread count (e.g. "Notifications, 3 unread")
- Added matching badge to the mobile drawer notification button
- Badge is hidden entirely when `unreadCount` is 0

### Accessibility (WCAG 2.1 AA)
- `aria-label` on the notification button includes the unread count so screen reader users hear "Notifications, 3 unread" rather than navigating blindly
- Badge is visually hidden from the accessibility tree when count is 0 (no redundant "0" announced)
- Badge colour (red-500 on white) exceeds the 3:1 non-text contrast threshold

### Usage
```tsx
<DashboardNavbar unreadCount={unreadNotifications.length} />
```

### Files changed
| File | Changes |
|------|---------|
| `components/dashboard/dashboard-navbar.tsx` | Added `unreadCount` prop, numeric badge on desktop + mobile bell buttons, updated aria-label |
| `components/dashboard/dashboard-navbar.test.tsx` | Added tests for badge rendering, capping, aria-label, mobile drawer badge, default state |
| `design/dashboard-redesign.md` | This section |

### Out of scope: non-`zinc-*` hardcoded colors

The file also hardcodes non-token hex values that are **not** `zinc-*` utilities and were left untouched per this issue's scope (e.g. `bg-white dark:bg-[#111111]`, `bg-[#0D0D0D80]`, `border-[#2D2D2D]`, `bg-[#121212]`). These represent the same class of design-token debt and would be a reasonable follow-up issue, but reconciling them changes a much larger surface area of the component (including the non-`showNotifications` dark-card visual treatment) than a zinc-vs-token audit calls for.

### Responsive & accessibility validation

- Verified visually and via existing tests across the `showNotifications`/`showDropdown` permutations, which drive the `sm`/`md` breakpoint layout switch (`flex-col md:flex-row`) — no layout classes were touched, only color utilities.
- All existing tests in `components/analytics/analytics-view.test.tsx` pass against the new markup (one unrelated pre-existing failure, `renders empty state component when empty data is provided`, reproduces identically on `main` and is unrelated to this change).
- No text or non-text contrast regressions: token swaps were chosen to preserve or exceed the contrast ratios of the `zinc-*` values they replaced (see notes above).

## Notification Panel Per-Category Filter (#790)

### Overview
`components/common/notification-panel.tsx` now supports per-category filtering using lightweight filter chips (`All`, `Payments`, `Security`, `System`) derived from `types/notification-item.ts`.

### Features & Behavior
- **Category Filter Chips**: Filter tabs allow users to quickly switch between `All`, `Payments`, `Security`, and `System` categories.
- **Dynamic Category Item Counts**: Each chip displays the category label and live item count, e.g. `All (4)`, `Payments (2)`, `Security (1)`, `System (1)`.
- **Session Persistence**: The user's last selected filter category is persisted in `sessionStorage` under the key `notification-panel-category-filter` (`CATEGORY_STORAGE_KEY`) and automatically restored when the notification panel is rendered again during the session. Safe fallback handling ensures grace when `sessionStorage` is unavailable.
- **Empty States**: If a selected category filter returns zero matching notifications, the accessible `NotificationPanelEmptyState` ("You're all caught up") is displayed cleanly.

### Accessibility Annotations (WCAG 2.1 AA)
- **Contrast**: Selected category chip uses high-contrast surface treatment (`bg-[#1E1E1E]` text `white` with border `#3E3E3E`) meeting 4.5:1 AA contrast against the dark card surface. Unselected chips use `#A0A0A0` text with hover escalation to `#E5E5E5`.
- **Keyboard Navigation**:
  - `role="tablist"` with `aria-label="Filter notifications by category"`.
  - Individual category chips have `role="tab"`, `aria-selected`, `aria-controls="notification-list-panel"`, and roving `tabIndex`.
  - Arrow key navigation (`ArrowRight` / `ArrowLeft`) moves focus between category tabs with automatic selection and focus placement.
  - Visible focus indicator (`focus-visible:ring-2 focus-visible:ring-[#D7E0EF]`) on focused chips and list items.
- **ARIA & Screen Readers**:
  - List items maintain the WAI-ARIA `listbox` pattern with roving `tabIndex` (`ArrowUp`, `ArrowDown`, `Home`, `End`, `Escape`, `Enter`, `Space`).
  - XSS safe text rendering prevents HTML injection in titles and notification messages.

### Responsive Breakpoint Validation
- Category chip container utilizes `flex flex-wrap gap-1.5 sm:gap-2 mb-4` to wrap cleanly across small (`sm: 640px`), medium (`md: 768px`), large (`lg: 1024px`), and extra-large (`xl: 1280px`) viewports without overflowing the max `400px` panel container.

---

## RechartsMiniBarChart — Theme-Aware Design Tokens (#821)

### Overview
`components/dashboard/RechartsMiniBarChart.tsx` previously passed hardcoded Tailwind class strings (e.g. `"bg-blue-500"`) to Recharts' `fill` prop, which Recharts does not interpret as a valid CSS color — effectively leaving bars unfilled. The tooltip referenced an undefined `--chart-tooltip-bg` variable that silently defaulted to `transparent`.

The component now reads colour values from the CSS custom properties defined in `app/globals.css`, so bar and tooltip colours respond to theme changes (light/dark) without a page reload.

### What changed

| File | Change |
|------|--------|
| `app/globals.css` | Added `--chart-1` through `--chart-5` and `--chart-tooltip-*` tokens in both `:root` (light) and `.dark` (dark) blocks |
| `components/dashboard/RechartsMiniBarChart.tsx` | Added `"use client"`; introduced `cssVar` prop for CSS variable names; added empty-state rendering; wired tooltip to `--chart-tooltip-bg/text/border` |
| `components/dashboard/summary-data.tsx` | Changed `chartColor` values from `"bg-blue-500"` / `"bg-emerald-500"` / `"bg-amber-500"` to `"--chart-1"` / `"--chart-2"` / `"--chart-3"` |
| `components/dashboard/account-summary-card.tsx` | Changed prop from `color={chartColor}` to `cssVar={chartColor}` |
| `components/dashboard/RechartsMiniBarChart.test.tsx` | New file — 22 tests covering render states, props, edge cases, tooltip CSS variables, and aria |

### Design tokens added to `app/globals.css`

```css
:root {
  --chart-1: #4f6fff;           /* blue — first data series */
  --chart-2: #10b981;           /* emerald — second data series */
  --chart-3: #f59e0b;           /* amber — third data series */
  --chart-4: #8b5cf6;           /* purple — fourth data series */
  --chart-5: #ef4444;           /* red — fifth data series (use sparingly) */
  --chart-tooltip-bg: #ffffff;
  --chart-tooltip-text: #09090b;
  --chart-tooltip-border: #e4e4e7;
}

.dark {
  --chart-1: #6b8aff;
  --chart-2: #34d399;
  --chart-3: #fbbf24;
  --chart-4: #a78bfa;
  --chart-5: #f87171;
  --chart-tooltip-bg: #18181b;
  --chart-tooltip-text: #fafafa;
  --chart-tooltip-border: #27272a;
}
```

### How it works

The `fill` attribute on Recharts' `<Bar>` component is set to `var(--chart-1)` (or whichever variable the consumer passes). Since SVG `fill` supports CSS custom properties, the browser re-evaluates the variable whenever the `.dark` class toggles on `<html>`, and the chart repaints immediately without a React re-render.

### CSS variable reference (live cascade)

| CSS variable | Used in | Light value | Dark value | WCAG 2.1 AA contrast |
|---|---|---|---|---|
| `--chart-tooltip-bg` | Tooltip background | `#ffffff` | `#18181b` | — |
| `--chart-tooltip-text` | Tooltip text | `#09090b` | `#fafafa` | >15:1 (light), ~14.5:1 (dark) |
| `--chart-tooltip-border` | Tooltip border | `#e4e4e7` | `#27272a` | >3:1 non-text |

### Accessibility annotations (WCAG 2.1 AA)

- **Contrast**: Tooltip text on background exceeds 4.5:1 in both modes (15:1 light, 14.5:1 dark). Bar colours use the chart tokens which provide sufficient contrast against both the light (`#fff`) and dark (`#111`) card surfaces.
- **Keyboard**: The chart is purely decorative/illustrative — it receives no interactive focus. Navigation proceeds to adjacent interactive elements (buttons, links) with no interruption.
- **ARIA**: The wrapper `div` has `role="img"` and `aria-label` (customisable via `ariaLabel` prop, defaults to `"Mini bar chart"`). Empty state renders `aria-label="No chart data available"` on the placeholder. The empty-state text uses `text-muted-foreground` for adequate contrast.

### Responsive behaviour

- The chart container uses `height` as a CSS `style` prop (default `3rem`) and `width: 100%` via `ResponsiveContainer`. No breakpoint-specific overrides are needed — the chart reflows with its parent container.
- At `sm: 640px`, `md: 768px`, `lg: 1024px`, and `xl: 1280px`, the card grid that hosts the chart uses the existing `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` responsive layout; the mini chart scales down fluidly inside each card.

### Testing

```bash
# Unit tests (22 tests covering render, props, edge cases, tooltip, aria)
npm test -- --run components/dashboard/RechartsMiniBarChart.test.tsx
```

| Test group | Tests | Covers |
|---|---|---|
| Basic rendering | 3 | Renders chart, empty state, default fill |
| cssVar prop | 2 | Custom CSS variable, cssVar overrides color |
| color prop | 1 | Static fill fallback |
| height prop | 2 | Default 3rem, custom height |
| ariaLabel prop | 3 | Default label, custom label, role="img" |
| Data transformation | 2 | Index labels, zero margins |
| Bar props | 2 | dataKey, radius |
| XAxis props | 1 | Data key and hidden |
| Tooltip props | 3 | cursor, CSS variable references, percentage formatter |
| Edge cases | 4 | Single point, zero value, empty array, empty state aria |

### Files changed

| File | Status |
|------|--------|
| `app/globals.css` | Modified — added chart token block |
| `components/dashboard/RechartsMiniBarChart.tsx` | Modified — CSS variable fill, tooltip tokens, empty state |
| `components/dashboard/summary-data.tsx` | Modified — updated chartColor values |
| `components/dashboard/account-summary-card.tsx` | Modified — `cssVar` prop |
| `components/dashboard/RechartsMiniBarChart.test.tsx` | New |
| `design/dashboard-redesign.md` | This section |

