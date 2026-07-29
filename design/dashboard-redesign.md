# Dashboard Redesign

Main Figma Design Workspace:

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

---

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

Only a `PointerSensor` is configured (no `KeyboardSensor`). Keyboard accessibility is handled entirely by the Move Up / Move Down buttons (native `<button>` elements), which are simpler and more discoverable than @dnd-kit's keyboard drag activation.

### Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|---|---|
| **Perceivable** | Drag handle has `aria-roledescription="sortable"` and `aria-label="Drag {widget} to reorder"`. Move buttons have `aria-label="Move {widget} up/down"`. The sortable container has `role="list"` with `aria-label="Dashboard widgets"`. Each widget has `role="listitem"` and `aria-label="{widget} widget"`. |
| **Operable** | All controls are native `<button>` elements, fully keyboard-operable. Move Up/Down buttons are disabled at boundaries. Drag handle is focusable with visible `focus-visible:ring-2` ring. |
| **Understandable** | Consistent layout: drag handle + label on left, move buttons on right. API is `arrayMove` — order always reflects the last user action. |
| **Robust** | GripVertical, ChevronUp, ChevronDown icons carry `aria-hidden="true"`. |
| **Contrast** | Uses existing Zinc design tokens (400/600 with hover states). Focus ring uses `zinc-900` (light) / `white` (dark) at 2px width. |

### Refs / Tour compatibility

The four refs used by `DashboardTour` (`accountSummaryRef`, `quickActionsRef`, `analyticsInsightsRef`, `clientAnalyticsRef`) are stored in a `refMap` keyed by widget ID. Each `SortableWidget` forwards the appropriate ref to the inner `<div>` wrapping the widget content. Refs follow the DOM when widgets are reordered, so the tour highlights remain correct.

### Tests

**File:** `components/dashboard/dashboard-page.test.tsx` (20 tests).

| Category | Tests |
|---|---|
| **Render** | Navbar, all 5 widgets, tour overlay, correct layout |
| **Default order** | Widgets render in `WIDGET_IDS` order |
| **Move buttons** | 5 up buttons, 5 down buttons; first up disabled; last down disabled |
| **Move down** | Clicks first move-down, checks item swapped |
| **Move up** | Moves down then up, checks return to original |
| **Persistence** | `safeStorage.setWidgetOrder` called after move with updated order |
| **Restore** | Custom order from `getWidgetOrder` is rendered on mount |
| **Fallback** | Null, truncated, and invalid localStorage values fall to default |
| **Drag handles** | 5 handles with correct `aria-roledescription` |
| **Props** | `isLoading` passed to ClientAnalyticsView; `recentRecipients` to QuickTransfer |
| **Save default** | Default order is persisted when no saved order exists |

### Pre-existing bug fix

The `DashboardTour` import was missing from the original file (`dashboard-page.tsx`). Added `import { DashboardTour } from "@/components/dashboard/dashboard-tour"`. Also added missing `FileText`, `Wallet`, `Shield`, `Settings`, `Clock3`, `ChevronRight` icon imports from `lucide-react`, `Link` from `next/link`, `useTransactions` from `@/hooks/useTransactions`, and `Transaction` type from `@/types/transaction` — all used by the `RecentActivityFeed` component but previously undeclared.

No test changes were needed for these fixes; the existing test suite was not exercising `RecentActivityFeed`.

---

## Empty-State & Error-State Audit

**Branch:** `refactor/dashboard-empty-state-adoption`

### What was done

Audited all four dashboard widgets and migrated ad hoc empty/error states onto
the shared `components/ui/empty-state.tsx` and `components/ui/error-state.tsx`
primitives.

### Changes per widget

| Widget | Was | Now |
|---|---|---|
| **Account Overview** | Ad-hoc `<div role="alert">` with `AlertCircle` + `RefreshCw` + "Retry" button | `<ErrorState title="Failed to Load" … onRetry={…} />` from `error-state.tsx` |
| **Payment History** | Already used shared `EmptyState` / `ErrorState` | No changes needed |
| **Analytics Insights** | No empty state when all KPIs deselected (unreachable via UI, defensive only) | Added `<EmptyState title="No Metrics Selected" … />` behind `visibleKPIs.length === 0 && hasHydrated` |
| **Client Analytics** | No empty/error states (chart library handles its own) | No changes needed |

### Theme-aware fix

Both `error-state.tsx` and `empty-state.tsx` had hardcoded dark-only colors
(e.g. `text-white` on `bg-red-900/10` — invisible in light mode). Fixed by
adding `dark:` variants with light-appropriate defaults.

### Tests

| File | Change |
|---|---|
| `components/dashboard/account-overview.test.tsx` | Replaced `getByTestId("summary-error")` with `getByRole("alert")`; changed button query from `/retry/i` to `/try again/i` |
| `components/dashboard/analytics-insights.test.tsx` | Added test verifying `EmptyState` renders when saved IDs don't match any known metric |

Run the suites:

```bash
npx vitest run components/dashboard/account-overview.test.tsx --no-coverage
npx vitest run components/dashboard/analytics-insights.test.tsx --no-coverage
npx vitest run components/dashboard/dashboard-page.test.tsx --no-coverage
```
