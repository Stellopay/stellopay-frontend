Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

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
