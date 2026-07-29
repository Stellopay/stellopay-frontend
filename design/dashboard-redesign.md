

## Printable transaction statement

The Transactions screen now includes **Generate statement**, which snapshots the selected inclusive date range and opens a reconciliation view. It is deliberately separate from the transaction table and from a single-transaction receipt.

### Content and calculation

- Opening balance is the signed total of recorded ledger activity before the start date.
- Money in, money out, closing balance, transaction count, and signed net totals grouped by transaction type are calculated over the inclusive selected range.
- The view uses `formatCurrency` and `formatDate`; dates and amounts therefore follow the app's existing formatting conventions.
- The ledger request is intentionally independent of table search/type filters, so a filtered table cannot produce an incomplete reconciliation. The current client data source caps this request at 100 records; the production API hand-off should replace it with a server-side statement endpoint for larger ledgers.
- No-activity ranges still produce a valid zero summary and clear explanatory row. The action is unavailable while its ledger is loading or unavailable.

### Responsive, print, and accessibility hand-off

- Summary cards are one column below **sm (640px)**, two columns at sm/md (640/768px), and four columns at **lg (1024px)** and above; the category table horizontally scrolls rather than truncating at narrow widths. At **xl (1280px)** it remains constrained by the dashboard's existing max width.
- `@media print` targets `.statement-print-root` only. It hides dashboard/table controls, removes the interactive statement controls, repeats table headers, avoids row breaks, and prints a high-contrast white document suitable for browser PDF export.
- The trigger, Close, and Print buttons are native keyboard-operable buttons with visible focus rings. The statement is a named section, table headers use scopes/caption, dates retain machine-readable `time` values, and the unavailable/error state is announced using a status region. Token-based foreground/background colors preserve the established light/dark design system; print overrides are black on white for AA contrast.
- Long category labels wrap; monetary values use tabular numerals. Screenshot capture should cover desktop (>=1024px), tablet (768px), mobile (375px), and print preview after data is available.
