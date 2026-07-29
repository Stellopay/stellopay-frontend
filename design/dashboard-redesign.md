


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

