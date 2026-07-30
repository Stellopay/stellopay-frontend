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

 design-system/mini-bar-chart-dark-tokens
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


- **Reduced Motion**: All motion-enabled components check `useReducedMotion()` and disable non-essential movement when the OS-level `prefers-reduced-motion: reduce` is set.
- **No Content Loss**: Hidden decorative elements (gradient orbs, rotating cards) remain visually hidden without animation; all content stays accessible and functional.
- **Focus Management**: Sidebar open/close preserves focus order and returns focus to `#main-content` on close (handled in `AppLayout`).
- **Contrast**: All transition elements use the existing color token system with `dark:` variants for sufficient contrast.
 main
