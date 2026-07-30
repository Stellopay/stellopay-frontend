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

## CSV Export Toolbar (Added: feature/transactions-export-toolbar-options)

The CSV Export Toolbar is a dialog-based export interface that lets power users choose which columns to include in a CSV export and scope the export to an arbitrary date range independent of on-screen pagination. Users see a live row-count preview before committing the download.

### Components

| File | Purpose |
|------|---------|
| `components/transactions/transactions-export-toolbar.tsx` | Dialog with column checkboxes, from/to date pickers, row-count preview, and Export button |
| `utils/csvUtils.ts` | New `generateTransactionsCsv()` and `downloadCsvContent()` for column-aware export; `TRANSACTION_CSV_COLUMNS` constant defines exportable columns |
| `components/transactions/transactions-content.tsx` | Orchestrates preview fetching (via `getTransactions` with max page size) and full-data export download |

### State Model

- The export toolbar maintains its own local date range and column selection, completely independent of the on-screen transaction filters.
- When the dialog opens, a preview request is fired to `getTransactions` with `pageSize = MAX_TRANSACTION_PAGE_SIZE` (100) to count matching rows.
- Changing either date picker triggers a new preview fetch.
- The Export button fetches all matching rows (again using max page size) and streams them through `generateTransactionsCsv` → `downloadCsvContent`.

### Features

- **Column Selection**: Six toggleable columns (Transaction Type, Address, Date, Token, Amount, Status). All selected by default. "Select all" / "Deselect all" quick toggle.
- **Date Range Picker**: Reuses the `Date` component (`components/transactions/date.tsx`) which wraps the `Calendar` from `components/ui/calendar.tsx`. Dates are independent of the on-screen filter range.
- **Row-Count Preview**: Shows a live count of matching rows so users can sanity-check the export scope before downloading.
- **Export Button**: Disabled when no columns are selected or when an export is already in flight. Shows a loading spinner during export.

### Accessibility Notes (WCAG 2.1 AA)

#### CSV Export Toolbar (`transactions-export-toolbar.tsx`)

- **Role & Label**: Uses the `Dialog` primitive which provides `role="dialog"` with `aria-modal="true"`. The title is "Export Transactions".
- **Column Checkboxes**: Each checkbox is labelled via `aria-labelledby` linked to a `<Label>` with the column header text.
- **Row-Count Region**: The preview uses `role="status"` with `aria-live="polite"` so screen readers announce count updates without interrupting the user.
- **Loading States**: The preview spinner uses `aria-hidden="true"`. The export button shows "Exporting…" text and a spinning icon when in progress.
- **Focus Management**: The dialog traps focus. The trigger button has `aria-label="Open CSV export options"`.
- **Disabled States**: The Export button is disabled with descriptive `aria-label` when no columns are selected ("Select at least one column to export") or while exporting ("Exporting CSV...").
- **Contrast**:
  - Trigger button: white text on `bg-[#1a0c1d]` with `border-[#2D2D2D]`.
  - Dialog: white text on `bg-[#160f17]` background.
  - Export button: white text on `bg-[#04842E]` (green) — passes AA.
  - Column labels: `text-gray-200` on dark background.
  - Row count: white `text-lg font-semibold` on `bg-[#1a0c1d]`.
- **Keyboard Navigation**: All checkboxes, buttons, and the Select/Deselect all toggle are fully keyboard-accessible with `focus-visible:ring-2` outlines.
- **Zero-Row Warning**: When no transactions match the date range, an amber warning text ("No transactions match this date range.") is shown.

#### Responsive Behavior

- **Dialog Width**: `max-w-lg` on mobile, `sm:max-w-xl` on wider screens.
- **Date Pickers**: Stack vertically on mobile (`flex-col`), side-by-side on `sm:` with a "to" label between them.
- **Column Grid**: Single column on mobile, two columns (`sm:grid-cols-2`) on wider screens.
- **Trigger Button**: Label text ("Export CSV") is hidden on mobile (`hidden sm:inline`); the spreadsheet icon remains visible.
- **Footer Buttons**: Stack on mobile, side-by-side on `sm:` breakpoint with proper gap spacing.

### Test Coverage

- `utils/csvUtils.test.ts` — escapeCsvField, TRANSACTION_CSV_COLUMNS validation, generateTransactionsCsv with various column selections, downloadCsv/downloadCsvContent DOM interactions.
- `components/transactions/transactions-export-toolbar.test.tsx` — Dialog open/close, column toggle, select/deselect all, row-count preview states (count, null, zero, loading), export callback payload, accessibility attributes (roles, labels, aria-live).
- **Reduced Motion**: All motion-enabled components check `useReducedMotion()` and disable non-essential movement when the OS-level `prefers-reduced-motion: reduce` is set.
- **No Content Loss**: Hidden decorative elements (gradient orbs, rotating cards) remain visually hidden without animation; all content stays accessible and functional.
- **Focus Management**: Sidebar open/close preserves focus order and returns focus to `#main-content` on close (handled in `AppLayout`).
- **Contrast**: All transition elements use the existing color token system with `dark:` variants for sufficient contrast.
 main
