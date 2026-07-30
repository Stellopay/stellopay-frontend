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

---

## Motion Duration & Easing Tokens (#758)

### Token Scale

| Token      | Value | Use Case                                | Example Components               |
| :--------- | :---- | :-------------------------------------- | :------------------------------- |
| `fast`     | 200ms | Micro-interactions (hover, tap, focus)  | Sidebar logo fade, toggle button |
| `base`     | 300ms | Standard UI transitions                 | FAQ accordion expand/collapse    |
| `slow`     | 500ms | Entrance / scroll-reveal animations     | Hero section, how-it-works steps |
| `xslow`    | 600ms | Layout animations, spring-like movement | Nav-link active indicator        |

### Easing Curves

| Curve       | Cubic Bézier                        | Use Case                    |
| :---------- | :---------------------------------- | :-------------------------- |
| `easeOut`   | `cubic-bezier(0.16, 1, 0.3, 1)`    | Entrance animations         |
| `easeInOut` | `cubic-bezier(0.65, 0, 0.35, 1)`   | UI toggle / accordion       |

### Transition Presets (`lib/motion.ts`)

Exported framer-motion transition objects that combine duration + easing:

```typescript
transition.fast   // { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
transition.base   // { duration: 0.3, ease: [0.65, 0, 0.35, 1] }
transition.slow   // { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
transition.spring // { type: "spring", bounce: 0.2, duration: 0.6 }
```

### Variant Presets

| Variant               | Behavior                           |
| :-------------------- | :--------------------------------- |
| `variants.fadeOnly`   | Opacity 0 → 1 (no transform)       |
| `variants.fadeSlideUp`| Opacity 0 + y:20 → Opacity 1 + y:0 |

### Reduced Motion

The `resolveVariants(prefersReduced, delay?)` helper returns `fadeOnly` (zero-duration) when the user has `prefers-reduced-motion: reduce`, and animated `fadeSlideUp` variants otherwise.

### Migrated Components

| Component                                 | Before (inline)         | After (token)              |
| :---------------------------------------- | :---------------------- | :------------------------- |
| `components/landing/how-it-works.tsx`     | `duration: 0.5, easeOut`| `duration.slow, easing.easeOut` |
| `components/landing/feature-card-grid.tsx`| `duration: 0.5, easeOut`| `duration.slow, easing.easeOut` |
| `components/landing/faq-section.tsx`      | `duration: 0.3, easeInOut` | `duration.base, easing.easeInOut` |
| `components/common/nav-link.tsx`          | `spring, bounce: 0.2, duration: 0.6` | `transition.spring` |
| `components/landing/hero.tsx`             | N/A (no framer-motion)  | `resolveVariants()` with `duration.slow` |
| `components/common/side-bar.tsx`          | CSS `duration-200`      | `transition.fast` via framer-motion |

### Accessibility (WCAG 2.1 AA)

| File | Purpose |
|------|---------|
| `components/transactions/advanced-filter-panel.tsx` | Togglable drawer with status radio, min/max amount inputs, counterparty text input, Apply/Clear All buttons |
| `components/transactions/filter-chips.tsx` | Removable chips showing active filter state with individual remove and bulk clear |
| `components/transactions/transactions-filters.tsx` | Updated with Advanced filter toggle button (indicator dot when active) |
| `components/transactions/transactions-content.tsx` | Orchestrates panel open/close, draft state, apply/commit, chip removal, and passes values to API |

### State Model

- Draft state lives in `transactions-content.tsx` — panel inputs modify draft values; committed filters flow through `TransactionFilters` (which gained `minAmount`, `maxAmount`, and `counterparty` fields).
- The API layer (`lib/api/transactions.ts` → `utils/transactionUtils.ts`) applies `counterparty` filtering as a case-insensitive partial match on the transaction address field.

### Accessibility Notes (WCAG 2.1 AA)

#### Advanced Filter Panel (`advanced-filter-panel.tsx`)

- **Role & Label**: Panel uses `role="dialog"` with `aria-modal="true"` and `aria-label="Advanced transaction filters"`.
- **Focus Trap**: When the panel opens, focus is moved to the first focusable element after a 150ms animation delay. Tab/Shift+Tab cycles within the panel. Focus is restored to the triggering element on close.
- **Escape to Close**: Pressing Escape closes the panel and returns focus.
- **Backdrop Click**: Clicking the backdrop overlay closes the panel.
- **Body Scroll Lock**: `document.body.style.overflow = "hidden"` is set while the panel is open; restored on close/unmount.
- **Validation Errors**: Amount range validation uses `role="alert"` with `aria-live="polite"` for non-intrusive screen reader announcement.
- **Contrast**: 
  - Status radio labels: white text on dark background (#160f17) — passes AA.
  - Selected status: `border-[#04842E]` (green) on `bg-[#04842E]/10` background.
  - Inputs: white text on `bg-[#1A1A1A]` with `border-[#2D2D2D]`.
  - Apply button: white text on `bg-[#04842E]` (green) background.
  - Clear All button: gray-400 text on transparent, darkens on hover.
- **Keyboard Navigation**: All buttons, inputs, and radio controls are fully keyboard-accessible with visible `focus-visible:ring-2` focus indicators.
- **Disabled State**: When `disabled={true}`, all inputs and buttons receive `disabled` attribute, preventing interaction during loading states.

#### Filter Chips (`filter-chips.tsx`)

- **Region Role**: Chips container uses `role="region"` with `aria-label="Active filters"` (customizable).
- **Remove Buttons**: Each chip's remove button has a descriptive `aria-label` (e.g., "Remove Status filter: Payment Sent").
- **Clear All**: When multiple chips are present, a "Clear all" button with `aria-label="Clear all active filters"` is shown.
- **Focus Indicators**: Remove buttons and Clear all link use `focus-visible:ring-2` outlines.

#### Responsive Behavior

- **Panel Width**: Full width on mobile, `sm:w-[420px]` on small screens, `lg:w-[480px]` on large screens.
- **Amount Range**: Two-column grid (`grid-cols-2`) adapts well at all breakpoints.
- **Advanced Toggle Button**: Label text is hidden on mobile (`hidden sm:inline`) to conserve space; the sliders icon remains visible.
- **Chips**: Use `flex-wrap` for natural wrapping on narrow viewports.

## Saved Views Feature (Added: feature/transactions-saved-views)

The Saved Views feature lets users name and persist filter/sort combinations so they can recall them across visits without rebuilding state by hand. Views are stored per-account in localStorage via the existing `safeStorage` utility.

### Components

| File | Purpose |
|------|---------|
| `components/transactions/transactions-filters.tsx` | Updated with "Save" button and "Saved Views" dropdown (load, rename, delete) |
| `components/transactions/transactions-content.tsx` | Manages saved views state, CRUD operations, and localStorage persistence |
| `types/transaction.ts` | Added `SavedView` interface and extended `TransactionsFiltersProps` |

### State Model

- A `SavedView` captures the full `TransactionFilters` state (type filter, sort configs, advanced filters, date range, search query) plus a user-defined name.
- Saved views are stored under `stellopay.transactions-saved-views.{walletAddress}` (or `.default` when no wallet is connected).
- Maximum 10 saved views per account; names are limited to 50 characters.
- A `hasHydratedViews` flag prevents overwriting localStorage with empty defaults before the stored data is restored on mount.

### User Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Save** | Click "Save" button | Prompts for a name via `window.prompt`, then stores the current filter/sort state |
| **Load** | Click a saved view name | Replaces all active filters and sort configs with the stored preset |
| **Rename** | Click pencil icon | Inline text input appears; Enter or blur commits, Escape cancels |
| **Delete** | Click trash icon | Confirmation dialog appears before removal |

### Accessibility Notes (WCAG 2.1 AA)

#### Save View Button

- **Label**: `aria-label="Save current view"` on the button.
- **Visibility**: Hidden when 10 views already exist (max reached) or when the callback is not provided.
- **Contrast**: Gray-400 text on dark background; brightens to white on hover — passes AA.

#### Saved Views Dropdown

- **Label**: `aria-label="Saved views"` on the dropdown trigger.
- **Count Badge**: Shows the number of saved views for quick scanning.
- **Items**: Each saved view is wrapped in `role="group"` with `aria-label="Saved view: {name}"`.
- **Load Button**: Descriptive `aria-label="Load saved view: {name}"`.
- **Rename Button**: `aria-label="Rename saved view: {name}"`; inline input has `aria-label="Rename saved view"` and `focus-visible:ring-2` for keyboard focus indication.
- **Delete Button**: `aria-label="Delete saved view: {name}"` with a `window.confirm` guard.
- **Keyboard Navigation**: All interactive elements are fully keyboard-accessible with visible focus rings. Enter commits rename, Escape cancels.

#### Action Button Visibility

- On desktop (`sm`+), rename/delete buttons appear on row hover/focus via `sm:group-hover:opacity-100` / `sm:group-focus-within:opacity-100`.
- On mobile/touch devices, action buttons are always visible (`opacity-100`) for discoverability.

#### Contrast

- Saved view names: white text on `#160f17` dark background — passes AA.
- Action buttons: gray-500 to white on hover; delete button to red-400 on hover.
- Rename input: white text on `bg-[#1A1A1A]` with `border-[#2D2D2D]` — consistent with the search input.
- Focus rings: `focus-visible:ring-[#04842E]` (green) for interactive elements, `focus-visible:ring-red-500` for the delete button.

#### Responsive Behavior

- Save button label text is hidden on mobile (`hidden sm:inline`); the bookmark icon remains visible.
- Saved Views dropdown label shows the view count badge; the "Views" label is hidden on mobile.
- Inline rename input adapts to the dropdown width with `flex-1`.
- Action buttons use `flex` layout that adapts naturally to narrow viewports.
