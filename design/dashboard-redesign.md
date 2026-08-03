# Dashboard Redesign

Main Figma Design Workspace:
## Account Overview — Copy Address Affordance

**Branch:** `feat/account-overview-copy-address-feedback`

### What was added

The `AccountOverview` welcome heading now includes an inline **Copy** button
immediately after the truncated wallet address. The button provides clear,
accessible confirmation that the copy operation succeeded (or failed) before
the user can trigger it a second time.

```
Welcome back,  GABC...F123  [Copy ⎘]  👋
                             ↑
                  idle / copied / error
```

### Component: `CopyAddressButton`

A private sub-component declared in
`components/dashboard/account-overview.tsx`. It is **not exported** because it
is only needed in this one location; the wallets-settings surface keeps its own
equivalent.

#### States

| State    | Button label | Icon     | Colour tokens                          | aria-label              |
|----------|-------------|----------|----------------------------------------|-------------------------|
| `idle`   | Copy        | Copy ⎘   | `text-zinc-500 dark:text-zinc-400`     | "Copy wallet address"   |
| `copied` | Copied      | Check ✓  | `text-emerald-600 dark:text-emerald-400` | "Address copied"        |
| `error`  | Failed      | X ✗      | `text-destructive`                     | "Copy failed — try again" |

#### Timing

- `copied` → `idle`: **2 000 ms** (driven by `copyToClipboardWithTimeout`).
- `error` → `idle`: **3 000 ms** (driven by a local `setTimeout`).

#### Clipboard strategy

Uses `copyToClipboardWithTimeout` from `utils/clipboardUtils.ts` (spec
requirement). That utility:

1. Tries `navigator.clipboard.writeText` (modern async Clipboard API,
   HTTPS / localhost only).
2. Falls back to `document.execCommand('copy')` (synchronous legacy, works in
   non-secure contexts and older browsers).
3. On total failure calls `window.alert()`.

`CopyAddressButton` intercepts the `window.alert` call for the duration of the
handler to suppress the blocking dialog and set the `error` state instead.
`window.alert` is **always restored** — both on the happy path (early restore
after `setCopied(true)`) and after the Promise settles.

The **full address** is copied to the clipboard. The truncated form
(`GABC...F123`) is the only representation ever rendered in the DOM.

### Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **Perceivable** | `aria-label` updates on each state transition so the button's accessible name always reflects the current action. |
| **Operable** | The button is a native `<button type="button">`, fully keyboard-operable (Tab to focus, Enter/Space to activate). Focus ring: `focus-visible:ring-2 focus-visible:ring-zinc-400`. |
| **Understandable** | An `aria-live="polite"` + `aria-atomic="true"` `role="status"` region (`data-testid="copy-address-announcement"`) announces the copy result to screen readers without interrupting ongoing speech. The region is visually hidden (`sr-only`) and does not shift layout. |
| **Robust** | Icons carry `aria-hidden="true"` — meaning is conveyed through the button label and the live region. The button itself never contains only an icon. |

Colour contrast (Tailwind design tokens, both light and dark):

| Element | Foreground | Background | Estimated ratio |
|---|---|---|---|
| Idle button text | `zinc-500` (#71717a) | `white` (#ffffff) | ≈ 4.6 : 1 ✓ |
| Copied state | `emerald-600` (#059669) | `white` (#ffffff) | ≈ 4.5 : 1 ✓ |
| Failed state | `destructive` (CSS var, ~`#dc2626`) | `white` (#ffffff) | ≈ 5.9 : 1 ✓ |
| Dark idle | `zinc-400` (#a1a1aa) | `#111111` | ≈ 6.2 : 1 ✓ |
| Dark copied | `emerald-400` (#34d399) | `#111111` | ≈ 7.5 : 1 ✓ |

### Responsive behaviour

The button is an `inline-flex` element inside the existing `flex-wrap` heading.
At all breakpoints (sm 640 → xl 1280) it wraps naturally with the address span
when space is constrained. No breakpoint-specific markup was added.

### Tests

New describe block: **"AccountOverview – copy address button"** in
`components/dashboard/account-overview.test.tsx`.

Coverage:

| Category | Tests |
|---|---|
| Presence | Button rendered when connected; absent when disconnected; `type="button"` |
| Clipboard | Writes full address; truncated form is the only DOM text |
| Success feedback | "Copied" text; aria-label update; live region; 2 s auto-reset; live region clears |
| Error feedback | "Failed" text; aria-label update; live region; 3 s auto-reset |
| Accessibility | `role="status"`, `aria-live="polite"`, `aria-atomic="true"`; keyboard Enter |

Run the suite:

```bash
npx vitest run components/dashboard/account-overview.test.tsx --coverage.enabled=false
```

---

## Drag-and-Drop Widget Reordering

**Branch:** `feature/dashboard-widget-reordering`

**Issue:** #886 — Add drag-and-drop widget reordering (persisted to localStorage).

### What was added

Users can now reorder the five dashboard widgets by either:

1. **Drag and drop** using the grip handle (⠿ icon) in the top bar of each widget.
2. **Keyboard Move Up / Move Down** buttons in the same top bar.

The chosen order is persisted to `localStorage` via `safeStorage.ts` and restored on the next visit.

### Widgets

The dashboard renders five widgets in a vertical sortable list:

| ID | Component | Tour Ref |
|---|---|---|
| `account-overview` | `AccountOverview` | `accountSummaryRef` |
| `quick-transfer` | `QuickTransfer` | — |
| `quick-actions` | `QuickActions` | `quickActionsRef` |
| `analytics-insights` | `AnalyticsInsights` (dynamic) | `analyticsInsightsRef` |
| `client-analytics` | `ClientAnalyticsView` | `clientAnalyticsRef` |

### Persistence

- **Storage key:** `stellopay_dashboard_widget_order` (in `STORAGE_KEYS`).
- **Format:** `JSON.stringify([...WidgetId[]])`.
- **Hydration flow:**
  1. On mount, `safeStorage.getWidgetOrder()` is called.
  2. If a valid array of 5 known widget IDs is returned, it replaces the default order.
  3. If the saved value is `null`, malformed, wrong length, or contains unknown IDs, the default order is used.
  4. After hydration sets `hasHydrated = true`, every subsequent order change is persisted via `useEffect`.

### Components

#### `WidgetId` type and constants

```ts
type WidgetId = "account-overview" | "quick-transfer" | "quick-actions"
              | "analytics-insights" | "client-analytics";
```

Exported from `dashboard-page.tsx`:
- `WIDGET_IDS` — default-order array (`WidgetId[]`).
- `WIDGET_LABELS` — human-readable label map (`Record<WidgetId, string>`).

#### `WidgetDragHandle`

Renders a top bar with:
- **Drag handle button** (left): GripVertical icon + widget label; spreads `listeners` from `useSortable`. `aria-roledescription="sortable"`.
- **Move Up / Move Down buttons** (right): chevron icons; disabled at list boundaries. Wrapped in a `role="group"` with an accessible label.

#### `SortableWidget`

Wrapper around each widget using `useSortable` from `@dnd-kit/sortable`. Applies `transform`/`transition` CSS for smooth drag animations. Reduces opacity (`opacity-60`) while dragging. Forwards the tour ref to the inner content.

#### `DashboardDragOverlay`

Shown as a drag preview while the user is dragging. Renders a simplified card with the widget label.

#### `Dashboard` (modified)

- Replaces the hardcoded widget order with a `widgetOrder` state array.
- Renders widgets inside a `DndContext` + `SortableContext` with `verticalListSortingStrategy`.
- `PointerSensor` with `activationConstraint: { distance: 8 }` prevents accidental drags.
- `handleMove(id, direction)` callback for Move Up/Down buttons uses the same `arrayMove` logic as drag-and-drop.
- `DndContext.onDragEnd` updates `widgetOrder` and persists via `safeStorage`.

### Sensors

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.
- **New props**: `eventId` is rendered in a `<code>` block with `aria-label` describing the reference; the report link uses `aria-label="Report this issue"` so screen readers announce purpose clearly.

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


---

## Watchlist Panel — Design & Spec

> Issue: [#891](https://github.com/Stellopay/stellopay-frontend/issues/891) | Status: Implemented

## Overview

Users who transact repeatedly with the same counterparties or hold specific
assets have no quick way to reference them on the dashboard. The **Watchlist
Panel** lets users pin a small set of addresses or token assets and see their
latest balance or last-activity timestamp at a glance — without scrolling
through the full transaction or asset list.

---

## Component location

| File | Purpose |
|---|---|
| `components/dashboard/watchlist-panel.tsx` | Main panel + sub-components |
| `components/dashboard/watchlist-panel.test.tsx` | Vitest unit tests |
| `types/watchlist.ts` | `WatchlistItem` TypeScript type |
| `context/wallet-context.tsx` | `WatchlistProvider`, `useWatchlist`, persistence helpers |
| `app/layout.tsx` | `WatchlistProvider` added inside `WalletProvider` |
| `components/dashboard/dashboard-page.tsx` | `<WatchlistPanel />` placed between Analytics Insights and Client Analytics View |

---

## Data model

```ts
interface WatchlistItem {
  id: string;           // crypto.randomUUID() — stable across re-renders
  address: string;      // Stellar G-address or token key
  label?: string;       // User-supplied friendly name (≤ 40 chars)
  token?: string;       // e.g. "XLM", "USDC"
  balance?: string;     // Formatted display string, e.g. "$1,234.56"
  lastAmount?: number;  // +/- numeric value of most recent tx
  lastActivity?: string;// Human-readable date, e.g. "Apr 12, 2023"
  lastStatus?: string;  // "Completed" | "Pending" | "Failed"
  lastStatusColor?: "success" | "warning" | "destructive";
  pinnedAt: string;     // ISO 8601 timestamp set on pin
}
```

---

## State & persistence

Watchlist state lives in `WatchlistContext` (exported from
`context/wallet-context.tsx`). The provider:

1. Reads the persisted list from `localStorage` under the key
   `stellopay.watchlist.<walletAddress>` on mount and whenever the connected
   address changes.
2. Writes back on every mutation (`addItem`, `removeItem`, `updateItem`).
3. Scopes the key per account — each Stellar address has its own list.
4. Returns an empty array for a disconnected wallet (`address === null`).
5. Silently handles corrupted or missing localStorage data (returns `[]`).

The `WatchlistProvider` is composed *inside* `WalletProvider` in
`app/layout.tsx` so it can read the active address:

```tsx
<WalletProvider>
  <WatchlistProvider>
    <SidebarProvider>{children}</SidebarProvider>
  </WatchlistProvider>
</WalletProvider>
```

Consume it anywhere with:

```tsx
import { useWatchlist } from "@/context/wallet-context";

const { items, addItem, removeItem, updateItem } = useWatchlist();
```

---

## Component API

```tsx
<WatchlistPanel className?: string />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | — | Appended to the outer `<section>` — useful for tests and Storybook overrides |

The panel reads all state from `useWatchlist()` — no data props are needed.

---

## UX flows

### Pin a new item
1. Click **Pin Item** in the panel header.
2. An inline form expands below the header.
3. Enter the address (required, ≥ 8 chars) and an optional label.
4. Click **Pin** — the form closes, the card appears in the grid.
5. Duplicate addresses (case-insensitive) are silently ignored.

### Unpin an item
Click the **PinOff** icon on the top-right of any item card. The card is
immediately removed and localStorage is updated.

### Search / filter
When one or more items are pinned, a search input appears above the grid.
It filters by address, label, or token symbol (case-insensitive substring
match). Clearing the input restores the full list.

### Empty state
When no items are pinned, a centred empty-state panel invites the user to
pin their first item (same flow as the header button).

---

## Responsive behaviour

| Breakpoint | Layout |
|---|---|
| `< md` (< 768 px) | Single-column item grid |
| `≥ md` (≥ 768 px) | Two-column item grid |
| `sm` (≥ 640 px) | Header row becomes flex-row (title left, button right) |

The panel itself respects the dashboard's `max-w-[1600px]` container and
inherits the full-width `space-y-10` vertical rhythm.

---

## Design tokens

Follows the project's existing token convention — no new colours introduced:

| Token (light) | Token (dark) | Usage |
|---|---|---|
| `bg-white` | `dark:bg-[#111111]` | Panel background |
| `border-zinc-200` | `dark:border-zinc-800` | Panel border |
| `text-zinc-900` | `dark:text-white` | Heading / primary text |
| `text-zinc-500` | `dark:text-zinc-400` | Secondary / subtitle text |
| `bg-zinc-50/50` | `dark:bg-zinc-900/30` | Item card background |
| `border-zinc-100` | `dark:border-zinc-800/50` | Item card border |
| `text-emerald-600` | `dark:text-emerald-400` | Positive amount / success status |
| `text-rose-600` | `dark:text-rose-400` | Negative amount / destructive status |
| `text-amber-600` | `dark:text-amber-400` | Warning status |
| `focus-visible:ring-2 focus-visible:ring-blue-500` | (same) | Focus ring on all interactive elements |

---

## Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **1.3.1 Info and Relationships** | Panel is `<section aria-labelledby>` tied to the `<h2>`. Items list is `<ul aria-label="N pinned items">`. Each card is `<article aria-label="Watchlist item: …">`. |
| **1.4.3 Contrast** | All text/background pairs use the project's zinc palette, which meets 4.5:1 contrast at AA. |
| **2.1.1 Keyboard** | All interactive elements are native `<button>` or `<input>` — fully keyboard-reachable with no custom `tabindex`. |
| **2.4.6 Headings and Labels** | Every input has a `<label>` with `htmlFor`. The search input has an `aria-label` in addition to the visually-hidden `<label>`. |
| **2.4.7 Focus Visible** | `focus-visible:ring-2 focus-visible:ring-blue-500` applied to all buttons and inputs. |
| **3.3.1 Error Identification** | Validation errors use `role="alert"` and set `aria-invalid="true"` on the input, with `aria-describedby` pointing to the error message. |
| **4.1.2 Name, Role, Value** | The **Pin Item / Cancel** toggle button uses `aria-expanded`. The address input uses `aria-required`. |
| **Live regions** | The loading skeleton carries `role="status" aria-busy="true" aria-live="polite"`. |

---

## Test coverage

The test file (`components/dashboard/watchlist-panel.test.tsx`) covers:

1. Render & structure (panel mounts, heading, subtitle, section role, `aria-labelledby`)
2. Empty state (shown on mount, CTA button, disappears after first pin)
3. Loading state (skeleton present/absent)
4. Add-item form (toggle open/close, `aria-expanded`, validation errors, successful pin with and without label, duplicate guard, cancel)
5. Remove / unpin (button label, item removed, empty state reappears, label in button name)
6. Search / filter (by address, label, token; no-results message; clear button)
7. Item card display (address, label, balance, last-amount ±, last-activity, status, token badge)
8. Persistence (reads from localStorage, writes on pin, removes on unpin, per-account scoping, null-address guard, malformed JSON guard)
9. `useWatchlist` outside-provider error guard
10. Accessibility spot-checks (no `tabindex="-1"`, all inputs labelled, `role="alert"`, heading level)

Run with:

```bash
npm test -- watchlist-panel
```

---

## Future work

- **Live balance refresh** — `updateItem` is already exposed from the context; a `useWatchlistEnrich` hook can call the Horizon API and patch `balance` / `lastActivity` on a polling interval.
- **Drag-to-reorder** — the `items` array order is preserved in localStorage; drag-and-drop can be added as a progressive enhancement.
- **Pin from transaction row** — a `Pin` icon can be added to each transaction row in `transaction-history.tsx`, calling `addItem(transaction.address)` directly.
- **E2E coverage** — add a Playwright spec to `tests/dashboard.spec.ts` covering the full pin → view → unpin flow on `/dashboard`.
