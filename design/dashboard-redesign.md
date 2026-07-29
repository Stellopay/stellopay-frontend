# Typography System: Line-Height & Letter-Spacing Scale (#764)

This document specifies the tokenized typographic scale mapping for the **Clash Display**, **General Sans**, and **Inter** font family stacks across StelloPay landing and dashboard surfaces.

## Typography Scale Matrix

| Role | Utility Class | Font Family | Size | Line Height (Leading) | Letter Spacing (Tracking) | Usage Surface |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 2XL** | `.text-display-2xl` | Clash Display | 72px (`4.5rem`) | 1.05 | `-0.03em` | Hero main headlines |
| **Display XL** | `.text-display-xl` | Clash Display | 60px (`3.75rem`) | 1.1 | `-0.025em` | Major section headers |
| **Heading LG** | `.text-heading-lg` | Clash Display | 36px (`2.25rem`) | 1.2 | `-0.02em` | Dashboard section titles |
| **Heading MD** | `.text-heading-md` | Clash Display | 24px (`1.5rem`) | 1.25 | `-0.015em` | Card & modal titles |
| **Body LG** | `.text-body-lg` | General Sans / Inter | 18px (`1.125rem`) | 1.6 | `-0.01em` | Lead paragraphs |
| **Body MD** | `.text-body-md` | General Sans / Inter | 16px (`1rem`) | 1.5 | `0em` | Standard interface copy |
| **Caption SM** | `.text-caption-sm` | Inter | 14px (`0.875rem`) | 1.43 | `+0.01em` | Table headers & captions |

### Feature Overview

**Metric Picker Dialog**
- Accessible button (Settings icon + "Customize" label on desktop, icon-only on mobile)
- Modal dialog showing all 4 available metrics from the catalog
- Multi-select UI with clear visual feedback (blue highlight for selected)
- Maximum 4 metrics enforced at UI level (disabled state when limit reached)
- Real-time feedback: warning messages for empty selection and max-limit states
- Reset and Save buttons to persist changes

**Metric Catalog**
The following metrics are available for selection:
1. **Total Volume** - TrendingUp icon, blue theme (`text-[#2563EB]`, `bg-[#EFF6FF]`)
2. **Avg. Transaction** - DollarSign icon, green theme (`text-[#16A34A]`, `bg-[#F0FDF4]`)
3. **Success Rate** - Activity icon, purple theme (`text-[#7C3AED]`, `bg-[#F5F3FF]`)
4. **Active Wallets** - Wallet icon, orange theme (`text-[#EA580C]`, `bg-[#FFF7ED]`)

Each metric in the catalog includes:
- A unique `id` (e.g., "total-volume")
- Icon component from lucide-react
- Display label (e.g., "Total Volume")
- Formatted value (e.g., "$847.5K")
- Change indicator (e.g., "+12.5%")
- Semantic color tokens for light/dark modes

**Persistence & Defaults**

- **Storage Key**: `"stellopay.kpi-preferences"` (follows dot-namespace convention)
- **Storage Format**: JSON array of metric IDs, e.g., `["total-volume", "success-rate"]`
- **Default (First-Time Users)**: All 4 metrics are shown in catalog order
- **Hydration Pattern**:
  1. On component mount, `useEffect` reads from `safeStorage` (SSR-safe, returns `null` on error)
  2. Sets `hasHydrated` flag to avoid overwriting on SSR mismatches
  3. Renders picker only after hydration completes
- **Persistence After Change**: 
  1. When user clicks "Save Changes" in the picker, selected IDs are written to localStorage
  2. On next visit, those metrics are restored
  3. Fallback to defaults if storage contains malformed data or empty arrays

**Card Rendering & Ordering**

- Cards are rendered in the order they appear in the metric catalog, filtered by selected IDs
- Visual design (icon, colors, layout) remains unchanged from the original fixed set
- Grid layout: responsive 1-col (mobile), 2-col (tablet), 4-col (desktop) using Tailwind breakpoints (`sm:`, `lg:`)
- Each card maintains hover effects (shadow increase, icon scale 110%)

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**
- Customize button fully keyboard operable: `Tab` to focus, `Enter` to open dialog
- Inside picker dialog:
  - `Tab` navigates between metric items
  - `Space` / `Enter` toggles selection of a metric
  - `Tab` to Reset / Save buttons
  - `Enter` to activate buttons
  - `Escape` closes dialog (via Radix Dialog primitive)
- Focus is trapped within the modal and returned to the trigger button on close

**ARIA Attributes**
- Customize button: `aria-label="Customize metrics"` for screen readers
- Metric selection items: `aria-pressed="true|false"` to indicate selection state
- Dialog: `role="dialog"` and `aria-modal="true"` (via Radix DialogPrimitive)
- Metric icons: `aria-hidden="true"` (decorative, not read)
- Selected checkmark: Indicates selection state visually for all users

**Color Contrast**
- Selected metric: Blue highlight (`bg-blue-50` light / `dark:bg-blue-900/20`) with sufficient contrast against text
- Disabled metrics: `opacity-50` to clearly indicate unavailable state, meets minimum contrast
- Warning messages: Amber for "no selection", blue for "max selected" – both have WCAG AA contrast
- Dark mode support: All colors defined with `dark:` variants using semantic CSS variables

**Visual Indicators**
- Check icon appears next to selected metrics
- Disabled metrics have reduced opacity (50%)
- Hover states for interactive items (color change, cursor change)
- Clear button states: Save disabled when no metrics selected, enabled otherwise

### Responsive Behavior

**Dialog Presentation**
- Desktop (lg+): Centered modal dialog (`DialogContent` with `sm:max-w-md`)
- Mobile (< 640px): Full-width responsive wrapper, auto-scrolls if content exceeds viewport
- Customize button: Icon + "Customize" text on desktop (`hidden sm:inline`), icon only on mobile

**Grid Layout**
- After metric selection saved:
  - `grid-cols-1` (mobile < 640px): 1 card per row
  - `sm:grid-cols-2` (640px - 1023px): 2 cards per row
  - `lg:grid-cols-4` (1024px+): 4 cards per row (full row when fewer selected)
- Gap: `gap-6` (1.5rem) maintained across all breakpoints
- No regression: existing responsive behavior preserved

### Design Tokens & Styling Consistency

**Color System (Light Mode)**
- Background: `bg-white` (section), `bg-zinc-50` (picker trigger)
- Text: `text-zinc-900` (primary), `text-zinc-500` (secondary)
- Borders: `border-zinc-200`
- Selected state: Blue (`bg-blue-50`, `border-blue-300`, `text-blue-600`)
- Disabled state: Same base but with `opacity-50`

**Color System (Dark Mode)**
- Background: `dark:bg-[#111111]` (section), `dark:bg-zinc-900/50` (picker trigger)
- Text: `dark:text-white` (primary), `dark:text-zinc-400` (secondary)
- Borders: `dark:border-zinc-800`
- Selected state: `dark:bg-blue-900/20`, `dark:border-blue-700/50`, `dark:text-blue-400`
- Disabled state: Same with `opacity-50`

**Spacing & Typography**
- Button padding: `px-4 py-2` for triggers, `px-3 py-2` for dialog buttons
- Border radius: `rounded-xl` (12px, matching card design)
- Font weight: `font-bold` for titles, `font-semibold` for metric labels, `font-medium` for buttons
- Font size: `text-sm` for button text, `text-xs` for secondary info

**Transitions**
- All interactive elements: `transition-colors` or `transition-all` for smooth state changes
- Hover effects: Background color, button shadow
- Dialog open/close: Via Radix `DialogContent` animations (fade-in/out, zoom effects)

### Data Sources & Backend Integration

The metric catalog is currently static/demo data. To connect to real backend data:

1. **Fetch function per metric**: Each metric should have a corresponding data-fetch function
2. **Data structure**: Values, changes, and error states are managed at the data layer (not in the component)
3. **Current implementation**: The component accepts `kpis` prop for injection (backward compatible)

**Recommended Extension**
```typescript
// Add a hook to fetch metric data
async function fetchMetricData(metricId: string) {
  // Call API based on metricId
  // Return { value, change, icon, label }
}
```

### State Management & Hydration

**Component State**
- `timeRange`: Selected time period (stored locally, not persisted)
- `selectedMetricIds`: Array of chosen metric IDs (persisted to localStorage)
- `hasHydrated`: Flag to prevent SSR mismatch overwrites
- `dropdownOpen`: Time range dropdown visibility

**Hydration Flow**
1. Component mounts with `selectedMetricIds = []` and `hasHydrated = false`
2. First `useEffect` runs:
   - Calls `safeStorage.getItem(STORAGE_KEY)`
   - Parses JSON (with try/catch for malformed data)
   - Sets `selectedMetricIds` and `hasHydrated = true`
3. Second `useEffect` watches `selectedMetricIds` and `hasHydrated`:
   - Only writes to storage when `hasHydrated === true` (prevents premature writes)
   - Serializes array to JSON and stores

This pattern matches the existing sidebar and theme context patterns in the codebase.

### Testing Coverage

**Unit Tests** (`analytics-insights.test.tsx`)

*Default Rendering*
- ✓ Shows all 4 metrics when localStorage is empty (first-time users)
- ✓ Renders header, time range selector, customize button, view all link

*Persistence*
- ✓ Reads and restores saved metric IDs from localStorage
- ✓ Fallback to defaults on malformed JSON
- ✓ Fallback to defaults on empty array
- ✓ Persists new selections to localStorage after Save

*Picker Dialog*
- ✓ Customize button opens/closes dialog
- ✓ All 4 metrics displayed with correct labels, values, icons
- ✓ Currently selected metrics show check marks
- ✓ Reset button reverts to default selection

*Selection Constraints*
- ✓ Up to 4 metrics can be selected
- ✓ Selection UI disables when 4 metrics selected (not in picker)
- ✓ Warning message shown at max capacity
- ✓ Warning message shown when no metrics selected
- ✓ Save button disabled when no metrics selected

*Keyboard Accessibility*
- ✓ Tab navigation through metric items
- ✓ Space/Enter toggles selection
- ✓ Tab to Reset/Save buttons
- ✓ Enter activates button actions
- ✓ Escape closes dialog

*Edge Cases*
- ✓ Handles SSR context (typeof window === "undefined")
- ✓ Handles localStorage unavailable (privacy mode, quota exceeded)
- ✓ Handles missing metric IDs gracefully (filters to available metrics)
- ✓ Respects time range selection independently of metric changes

*Responsive & Dark Mode*
- ✓ Grid renders at sm/md/lg/xl breakpoints
- ✓ Dark mode classes applied correctly
- ✓ Customizable button text hidden on mobile

### Known Limitations

- **Fixed Catalog**: Metrics are currently hardcoded; expanding the catalog requires code changes
- **No Drag-to-Reorder**: Metrics are ordered by catalog sequence, not freely repositionable. This is acceptable for accessibility (drag-and-drop is inherently harder for keyboard/screen-reader users)
- **No API Connection**: Currently uses demo/static data; real data fetching requires backend integration

## Error States vs Empty States

The Transactions list component distinguishes between an empty result (e.g. no transactions matching the selected filters) and a network or server error.

- **Empty State**: Rendered via the `TransactionsTable` empty message (`No transactions found. Try adjusting your filters.`).
- **Error State**: Rendered using the `<ErrorState />` UI component which displays the actual error message or a generic "Failed to load transactions." It also provides a "Try Again" button.

### Route-Scoped Error Boundaries (`app/transactions/error.tsx`, `app/settings/preferences/error.tsx`)

Both routes now have dedicated App Router error segments that catch render errors locally, preventing them from bubbling to the generic `app/error.tsx`. Each boundary uses the shared `components/ui/error-state.tsx` component and provides:

- **Event ID placeholder** (`digest` mapped through `eventId` prop) — visible reference for support debugging.
- **Retry action** (`reset()` wired to the retry button) — allows users to recover without leaving the route.
- **Report-issue link** (`/help/support` by default) — accessible link for escalation.

These boundaries mirror the existing `app/dashboard/error.tsx` pattern (console logging of digest, dev-only message rendering, accessible `main` wrapper with `role="alert"` and `aria-live="assertive"`).

### Responsive Behavior

- **sm (640px)**: Container uses full width with `px-6`; content stays centered.
- **md (768px)**: `max-w-md` keeps the error card readable without excessive line length.
- **lg (1024px)** and **xl (1280px)**: The `min-h-[60vh]` wrapper ensures vertical centering across larger viewports.

The design tokens (`bg-background`, `text-foreground`, `text-red-500`, rounded-xl, `max-w-md`) remain consistent across breakpoints.

### Accessibility Notes (WCAG 2.1 AA)

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

- **Reduced Motion**: All motion-enabled components check `useReducedMotion()` and disable non-essential movement when the OS-level `prefers-reduced-motion: reduce` is set.
- **No Content Loss**: Hidden decorative elements (gradient orbs, rotating cards) remain visually hidden without animation; all content stays accessible and functional.
- **Focus Management**: Sidebar open/close preserves focus order and returns focus to `#main-content` on close (handled in `AppLayout`).
- **Contrast**: All transition elements use the existing color token system with `dark:` variants for sufficient contrast.

---

## Card Elevation / Shadow Scale (#759)

### Token Definition

A 4-step elevation scale defined as CSS custom properties in `app/globals.css` and exposed as Tailwind v4 utility classes via `@theme inline`.

| Token | Tailwind Class | Light value | Dark value | Elevation intent |
| :---- | :------------- | :---------- | :--------- | :--------------- |
| `--elevation-1` / `--shadow-elevation-1` | `shadow-elevation-1` | `0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 1px 0 rgb(0 0 0 / 0.02)` | `0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)` | Static / default cards |
| `--elevation-2` / `--shadow-elevation-2` | `shadow-elevation-2` | `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03)` | `0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)` | Hoverable / interactive cards |
| `--elevation-3` / `--shadow-elevation-3` | `shadow-elevation-3` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)` | `0 10px 15px -3px rgb(0 0 0 / 0.55), 0 4px 6px -4px rgb(0 0 0 / 0.45)` | Floating panels (popovers, dropdowns) |
| `--elevation-4` / `--shadow-elevation-4` | `shadow-elevation-4` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)` | `0 20px 25px -5px rgb(0 0 0 / 0.65), 0 8px 10px -6px rgb(0 0 0 / 0.5)` | Modals / dialogs |

### Component-to-elevation mapping

| Component | Default elevation | Hover / interactive elevation |
| :-------- | :---------------- | :---------------------------- |
| `Card` (`components/ui/card.tsx`) | 1 (static) | N/A (use interactive wrapper if needed) |
| `AccountSummaryCard` (`components/dashboard/account-summary-card.tsx`) | 1 | 2 (`hover:shadow-elevation-2`) |
| `SummaryCardSkeleton` (`components/dashboard/summary-data.tsx`) | 1 | N/A (skeleton) |
| `TransactionHistory` (`components/dashboard/transaction-history.tsx`) | 1 | N/A |
| `QuickTransfer` (`components/dashboard/quick-transfer.tsx`) | 1 | N/A |
| `AnalyticsInsights` section wrapper | 1 | N/A |
| `AnalyticsInsights` KPI cards | 1 | 2 (`hover:shadow-elevation-2`) |
| `QuickActions` section wrapper | 1 | N/A |
| `QuickActions` interactive cards | 1 | 2 (`hover:shadow-elevation-2`) |
| `DashboardPage` section | 1 | N/A |
| `<DropdownMenuContent>`, `<PopoverContent>` | 3 (floating) | N/A |
| `<DialogContent>`, `<CoachMarkOverlay>` | 4 (modal) | N/A |

### Usage

```tsx
// Default static card (elevation 1)
<Card>Content</Card>

// Custom elevation
<Card elevation={2}>Interactive card</Card>
<Card elevation={3}>Floating panel</Card>

// Hoverable card pattern (elevation 1 → 2)
<div className="shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
  ...
</div>
```

### Accessibility

- **Contrast**: Shadows are purely decorative (`content` layer per WCAG 1.4.1). No information is conveyed through shadow alone.
- **Reduced motion**: The `transition-shadow` duration (default 150-300 ms) is not animated when `prefers-reduced-motion: reduce` is set because Tailwind's `transition-*` utilities are disabled by the browser.
- **Dark mode**: Dark-mode shadow values are defined via `.dark` CSS variables, selected to provide sufficient depth on dark surfaces without creating high-contrast artifacts.

### Validation criteria

1. Every `<Card>` usage either omits `elevation` (defaults to 1) or explicitly sets a valid value.
2. Dashboard summary cards transition from `shadow-elevation-1` → `shadow-elevation-2` on hover.
3. No raw `shadow-sm`/`shadow-md`/hand-rolled `boxShadow` remains in migrated components.
4. Dark-mode shadows are deeper (higher opacity) to maintain legibility on dark backgrounds.
5. All existing tests pass without modification (elevation is additive, not breaking).

### Migrated files

| File | Changes |
| :--- | :------ |
| `app/globals.css` | Added `--elevation-1` through `--elevation-4` CSS vars in `:root` and `.dark`, plus `@theme inline` entries |
| `components/ui/card.tsx` | Added `elevation` prop (1-4) mapping to `shadow-elevation-*` classes |
| `components/ui/card.test.tsx` | New test suite verifying `elevation` prop behaviour |
| `components/dashboard/account-summary-card.tsx` | `shadow-sm` → `shadow-elevation-1`, `hover:shadow-md` → `hover:shadow-elevation-2` |
| `components/dashboard/summary-data.tsx` | `shadow-sm` → `shadow-elevation-1` |
| `components/dashboard/transaction-history.tsx` | `shadow-sm` → `shadow-elevation-1` |
| `components/dashboard/quick-transfer.tsx` | `shadow-sm` → `shadow-elevation-1` |
| `components/dashboard/quick-actions.tsx` | `shadow-sm` → `shadow-elevation-1`, `hover:shadow-md` → `hover:shadow-elevation-2` |
| `components/dashboard/analytics-insights.tsx` | `shadow-sm` → `shadow-elevation-1`, `hover:shadow-md` → `hover:shadow-elevation-2` |
| `components/dashboard/dashboard-page.tsx` | `shadow-sm` → `shadow-elevation-1` |
| `design/dashboard-redesign.md` | Added this section |
