


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

The table receives selection as **controlled props**:

```tsx
<TransactionsTable
  transactions={paginatedTransactions}
  selectedIds={selectedIds}         // Set<string>
  onSelectRow={handleSelectRow}     // (id, checked) => void
  onSelectAll={handleSelectAllForPage} // (checked) => void
/>
```

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

