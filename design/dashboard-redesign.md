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

