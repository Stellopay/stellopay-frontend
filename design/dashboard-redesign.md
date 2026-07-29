Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

## Analytics & Insights - Customizable Metrics (Issue #893)

The Analytics & Insights widget now supports user-configurable custom metric cards, allowing users to choose which metrics appear in their dashboard and rearrange them.

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

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.



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

### Accessibility (WCAG 2.1 AA)
- Native `<select>` with an associated `<label htmlFor>` for full screen
  reader and keyboard support
- Visible focus ring via `focus-visible:ring-2`
- No color-only signaling; uses existing design tokens (`bg-background`,
  `text-foreground`, `border-border`)

### Responsive
Verified at sm (640px), md (768px), lg (1024px), xl (1280px) — control
remains a single row, wraps under the sort label on narrow widths.