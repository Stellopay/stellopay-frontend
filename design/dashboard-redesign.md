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
