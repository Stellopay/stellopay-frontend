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

---

## Multi-Select and Bulk Actions – Transactions Table

### Overview

Users can now select one or more transaction rows and act on the whole group at
once — without opening each row individually.  The feature adds three surfaces:

1. **Checkbox column** – first column in the desktop table and on each mobile
   card.
2. **Select-all header control** – single checkbox in the `<th>` of the
   checkbox column; supports three visual states.
3. **Floating bulk-action bar** – fixed to the viewport bottom when ≥ 1 row is
   selected; provides Export, Tag, and Archive actions plus a clear-selection
   dismiss button.

### Component anatomy

```
TransactionsContent
├── (sr-only aria-live region – announces count to screen readers)
├── TransactionsTable
│   ├── Checkbox (header – select-all / deselect-all)
│   └── Checkbox (per row – select / deselect individual transaction)
└── BulkActionBar (visible only when selectedIds.size > 0)
    ├── "{n} transaction(s) selected" label
    ├── [Export]  (Download icon)
    ├── [Tag]     (Tag icon)
    ├── [Archive] (Archive icon)
    └── [×]       (Clear selection – aria-label="Clear selection")
```

**Files changed / added:**

| File | Change |
|------|--------|
| `components/transactions/transactions-table.tsx` | Added `selectedIds`, `onSelectRow`, `onSelectAll` props; checkbox column; `aria-selected` on rows; indeterminate header state; adjusted empty-state `colSpan`. |
| `components/transactions/transactions-content.tsx` | Lifted selection state; `clearSelection` called on every filter/sort/page change; `aria-live` sr-only region; renders `BulkActionBar`. |
| `components/transactions/bulk-action-bar.tsx` | **New** – floating action bar with Export/Tag/Archive/Clear. |
| `components/transactions/transactions-table.test.tsx` | Full Vitest coverage for all new behaviour. |

### Selection state management

Selection state (`Set<string>` of transaction `id`s) lives in
`TransactionsContent`, not inside `TransactionsTable`.  This lets the parent
clear the selection atomically whenever filters, sort order, or the active page
change, avoiding "ghost selections" that reference rows no longer visible.

The table receives selection as **controlled props**:

```tsx
<TransactionsTable
  transactions={paginatedTransactions}
  selectedIds={selectedIds}         // Set<string>
  onSelectRow={handleSelectRow}     // (id, checked) => void
  onSelectAll={handleSelectAllForPage} // (checked) => void
/>
```

When `onSelectRow` / `onSelectAll` are omitted the checkbox column is hidden
entirely, preserving full backwards-compatibility.

### Bulk action bar

`BulkActionBar` is a pure-display component that returns `null` when
`selectedCount === 0`, so no DOM is emitted when nothing is selected.

```tsx
<BulkActionBar
  selectedCount={selectedIds.size}
  onExport={handleBulkExport}  // generates CSV download from current page
  onTag={handleBulkTag}        // stub – opens tag dialog
  onArchive={handleBulkArchive} // stub – sends archive request
  onClearSelection={clearSelection}
/>
```

The Export handler currently generates a client-side CSV from the already-loaded
page data and triggers a browser download.  Tag and Archive are stubs (`console.log`)
that are ready to be connected to API endpoints once those are available.

### Accessibility (WCAG 2.1 AA)

| Concern | Implementation |
|---------|---------------|
| **Screen reader announcement** | `aria-live="polite" aria-atomic="true"` sr-only `<div>` in `TransactionsContent` announces the selected count whenever it changes. |
| **Checkbox labels** | Header: `"Select all transactions on this page"` / `"Deselect all transactions on this page"`. Row: `"Select transaction {id}"`. |
| **Indeterminate state** | Radix `Checkbox` supports `checked="indeterminate"`. The header uses `"indeterminate"` when some but not all rows are selected. |
| **Row selection indicator** | `aria-selected` is set on each `<tr>` when selection props are present. |
| **Bulk bar region** | `role="region" aria-label="Bulk actions"`. Buttons are grouped in `role="toolbar" aria-label="Bulk action buttons"`. |
| **Icon-only button** | The clear (×) button has `aria-label="Clear selection"` so screen readers announce its purpose. |
| **Keyboard navigation** | All checkboxes and buttons are in natural tab order. No focus trapping or programmatic focus moves. Space toggles checkboxes; Enter activates buttons. |
| **Contrast** | Text on the dark `#1e1a1f` bar uses `#D7E0EF` (≥ 7:1 ratio). Selected row highlight `#1e1a1f` keeps all existing text colours compliant. |

### Responsive behaviour

| Breakpoint | Behaviour |
|-----------|-----------|
| `< md` (mobile) | Mobile cards are shown. Each card gains a leading checkbox. No header select-all (no table header in card layout). Bulk bar remains fixed to viewport bottom. |
| `≥ md` (desktop) | Full table with checkbox column as the first `<th>` / `<td>`. Header select-all checkbox present. |

### Before / After

**Before:** Single-row operations only (no checkboxes, no bulk bar).

**After:** Checkbox column in every row + header select-all + floating bulk-action
bar with Export / Tag / Archive / Clear.  Selection is cleared automatically
when the user changes a filter, sort, or page so there are never stale
selections pointing at off-screen rows.
