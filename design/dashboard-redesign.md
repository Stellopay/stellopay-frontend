Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

## Transaction Receipt View (#728)

### Overview
Clicking a row in `components/transactions/transactions-table.tsx` opens a dialog-based receipt view summarizing the transaction's amount, parties, memo, and status. The receipt includes a print button with dedicated print styles.

### Component Changes

#### `types/transaction.ts`
- Added `txId: string` (required) and `memo?: string` (optional) to the `TransactionProps` interface for receipt display.
- Added `memo?: string` to the `Transaction` interface.

#### `components/transactions/transactions-table.tsx`
- Added `TransactionReceipt` sub-component rendering a styled dialog with:
  - Transaction ID, type, amount, token, counterparty address, date/time, memo (when present)
  - Status badge using existing `getStatusColor` utility
  - Print button calling `window.print()`
  - Inline `<style>` with `@media print` overrides
- Added `selectedTransaction` state and `openReceipt`/`closeReceipt` callbacks
- Desktop `<TableRow>` and mobile cards are now clickable (`cursor-pointer`, `onClick`, `onKeyDown` for Enter/Space)
- Each interactive row has `role="button"`, `tabIndex={0}`, and `aria-label` describing the action

#### `components/transactions/transactions-content.tsx`
- Updated `toTransactionProps` mapper to include `txId` and `memo` from the source `Transaction`

#### `lib/transactions.ts`
- Added `memo` field to several mock transactions for testing

### Accessibility (WCAG 2.1 AA)
- Rows are keyboard-accessible (Enter/Space to open receipt)
- Receipt dialog uses Radix `Dialog` with accessible title, description, and close button
- Print button has focus ring and hover styles
- Status badge has `aria-label` prefix

### Print Stylesheet
Inline `@media print` rules in `TransactionReceipt`:
- White background, black text
- Removes shadows and dark-theme borders
- Hides the close and print buttons (`.no-print`)
- Keeps all receipt content visible

### Responsive Behavior
- Receipt dialog uses `sm:max-w-md` constraint — full-width on mobile, centered on larger screens
- Works at breakpoints: sm (640), md (768), lg (1024), xl (1280)
