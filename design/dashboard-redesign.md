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

## Advanced Filter Panel (Added: feature/transactions-advanced-filter-panel)

The Advanced Filter Panel is a togglable drawer that combines all transaction filter dimensions (status, amount range, counterparty address) into a single, auditable interface. It slides in from the right on desktop and takes full width on mobile (< 640px). Active filters are represented as removable chips below the filter bar.

### Components

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

## Enterprise Solution Card (components/ui/enterprise-solution-card.tsx)

Migrated hardcoded hex colors to semantic tokens for better theme consistency and maintenance.

### Props
- `value` (string): The primary large metric value to display.
- `label` (string): The secondary description label below the value.
- `className` (string): Additional CSS classes applied to the value text.

### Usage Example
```tsx
import EnterpriseSolutionCard from "@/components/ui/enterprise-solution-card";

export default function MetricView() {
  return (
    <EnterpriseSolutionCard 
      value="$1.2M" 
      label="Total Processed Volume" 
      className="text-green-500" 
    />
  );
}
```

### Near-Duplicate Notice
> **Note**: This component serves a similar purpose to a standard `MetricCard` or `StatCard` but has a fixed layout (`h-[118px]`) and centered alignment. It should not be reused blindly if a generic, flexible card is needed.

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: `text-muted-foreground` ensures sufficient contrast against the card's background in both light and dark modes. The `font-bold text-4xl` value text uses the default foreground color, guaranteeing readability.
- **Keyboard Nav**: The card itself is non-interactive. No custom focus management is necessary for its current static state.
- **ARIA**: The component utilizes semantic HTML allowing screen readers to interpret the layout natively.

### Responsive Behavior

- **Flex Layout**: Uses `flex flex-col gap-2` to stack the value and label vertically, adapting to varying text lengths gracefully.
- **Dimensions**: Retains a fixed height (`h-[118px]`) with `w-full`, allowing the card to stretch fluidly across CSS grid or flex layouts across breakpoints (`sm`, `md`, `lg`, `xl`).
- **Text Wrapping**: The text is centered (`text-center`) and breaks naturally, preserving readability on smaller screens.

---

## Card Skeleton (components/ui/card-skeleton.tsx)

Provides loading placeholder states for various card layouts.

### Props (CardSkeleton)
- `showHeader` (boolean, optional): Whether to display a header block. Defaults to `true`.
- `lines` (number, optional): Number of content lines to display. Defaults to `3`.
- `className` (string, optional): Additional classes to apply to the root element.

### Usage Example
```tsx
import { CardSkeleton, AccountSummaryCardSkeleton } from "@/components/ui/card-skeleton";

export default function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CardSkeleton showHeader={true} lines={4} />
      <AccountSummaryCardSkeleton />
    </div>
  );
}
```

### Near-Duplicate Notice
> **Note**: `CardSkeleton` is a lightweight wrapper around `SkeletonCard` from `./skeleton.tsx`. When building new skeletons, consider if `SkeletonCard` is more appropriate or if a new specific component like `AccountSummaryCardSkeleton` should be added here instead of duplicating.

### Accessibility Notes (WCAG 2.1 AA)
- **ARIA**: These components represent loading states. They should be wrapped in an `aria-busy="true"` container or use `aria-hidden="true"` to prevent screen readers from announcing meaningless content while loading.
- **Contrast**: The skeleton background colors use subdued, low-contrast tokens by design to indicate a placeholder, but they adapt correctly to light and dark modes.

### Responsive Behavior
- **Fluid Width**: Components use `w-full` to fit within their parent containers.
- **Heights**: `AccountSummaryCardSkeleton` uses a fixed height `h-[7.5rem]` while `CardSkeleton` grows based on the `lines` prop. Both respect fluid layout breakpoints (`sm` to `xl`).


## Feature Card Grid Entrance Animation

### Accessibility Notes (WCAG 2.1 AA)

- **Reduced Motion**: The staggered entrance animation is gated behind the useReducedMotion hook. Users who prefer reduced motion will see the grid appear instantly at full opacity.
- **Layout Stability**: The animation uses only opacity and 	ransform (y-axis translation) to avoid layout recalculations and ensure smooth, jank-free performance.
- **Contrast & ARIA**: Existing contrast ratios and ARIA attributes are preserved without interference from the Framer Motion wrapper.

