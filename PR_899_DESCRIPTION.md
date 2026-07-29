# feat: add a combinable advanced filter panel to transactions

Closes #899

## Summary

Adds a togglable advanced filter drawer combining **status**, **amount range**, **counterparty address**, and **date range** into a single panel, with removable chips for each active filter displayed below the filter bar. This makes complex transaction queries easier to build, review, and clear.

## Demo

### Before
The transaction filter bar had a status dropdown, search input, duplicate filter dropdown, and sort — all inline. There was no visual summary of active filters and no way to filter by amount range, counterparty address, or combine filters in one place.

### After
- An **"Advanced"** toggle button (with a green indicator dot when filters are active) sits in the filter bar next to search.
- Clicking it opens a sliding **drawer** (from the right on desktop, full-width on mobile) containing all filter dimensions.
- Active filters appear as **removable chips** below the filter bar with individual remove buttons and a bulk "Clear all" link.
- The drawer includes **Apply** and **Clear All** buttons, so users can build complex queries before committing them.

## Changes

### New Files

| File | Purpose |
|------|---------|
| `components/transactions/advanced-filter-panel.tsx` | Togglable drawer with status radio selection, min/max amount inputs, counterparty text input, and date range pickers. Full focus trap, ESC to close, body scroll lock, ARIA dialog with `aria-modal`. Validation alerts for inverted amount ranges. |
| `components/transactions/filter-chips.tsx` | Removable chip component for each active filter. Uses `role="region"` with `aria-label`. Individual chip remove buttons have descriptive `aria-label`s (e.g., "Remove Status filter: Payment Sent"). Shows "Clear all" when multiple chips are active. |
| `components/transactions/advanced-filter-panel.test.tsx` | 23 tests covering: rendering all sections, open/close behavior (close button, Escape key, backdrop click), value changes for status/min/max/counterparty, amount range validation (min > max error), apply/clear buttons, disabled state, ARIA attributes (`role="dialog"`, `aria-modal`, focus trap), scroll lock. |
| `components/transactions/filter-chips.test.tsx` | 10 tests covering: empty state renders nothing, renders all chips with labels/values, region role, accessible remove button labels, individual removal, "Clear all" link (shown with 2+ chips, hidden with 1). |

### Modified Files

#### `types/transaction.ts`
- Added `minAmount?: number`, `maxAmount?: number`, and `counterparty?: string` to `TransactionFilters` interface.
- Cleaned up `TransactionsFiltersProps` to reflect actual component usage: removed unused `onMinAmountChange`/`onMaxAmountChange`/`onCounterpartyChange`/`onClearAdvancedFilters`, added `onAdvancedFilterToggle` and `hasAdvancedFilters`.

#### `utils/transactionUtils.ts`
- Added `counterparty` parameter to `filterTransactions()`.
- Implements case-insensitive partial match filtering on `transaction.address` when `counterparty` is provided.

#### `lib/api/transactions.ts`
- Destructures `minAmount`, `maxAmount`, and `counterparty` from the filters object.
- Passes them through to `filterTransactions()` so they take effect in the API layer.

#### `components/transactions/transactions-content.tsx`
- Manages draft vs. committed filter state for the advanced panel (draft values are updated in the panel, committed on Apply).
- `buildFilterChips()` extracts active filters into chip data for display.
- `handleChipRemove()` maps chip keys to individual filter resets.
- `handlePanelApply()` commits all draft values (status, amount range, counterparty, dates) to the committed filter state.
- `handlePanelClearAll()` resets draft values to defaults.
- Passes new filter values through to `useTransactions()` → `getTransactions()`.

#### `components/transactions/transactions-filters.tsx`
- Added an "Advanced" toggle button with `SlidersHorizontal` icon.
- Shows a **green indicator dot** (`bg-[#34D399]`) with a subtle pulse animation when any advanced filter is active.
- Uses the cleaned-up `TransactionsFiltersProps` type directly (removed intersection type hack).

#### `design/dashboard-redesign.md`
- Added comprehensive section documenting the Advanced Filter Panel and Filter Chips components.
- Includes: component table, state model explanation, full WCAG 2.1 AA accessibility breakdown (contrast, keyboard nav, focus trap, ARIA roles, screen reader announcements), responsive behavior notes.

## Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---------|---------------|
| **Panel role** | `role="dialog"` with `aria-modal="true"` and `aria-label="Advanced transaction filters"` |
| **Focus trap** | Tab/Shift+Tab cycles within panel; focus restored to trigger on close |
| **Escape to close** | `keydown` listener closes panel and restores focus |
| **Scroll lock** | `document.body.style.overflow = "hidden"` while open |
| **Validation alerts** | `role="alert"` with `aria-live="polite"` on amount range errors |
| **Focus indicators** | `focus-visible:ring-2` on all interactive elements |
| **Chip region** | `role="region"` with `aria-label="Active filters"` |
| **Remove buttons** | Descriptive `aria-label`s (e.g., "Remove Status filter: Payment Sent") |
| **Contrast** | White text on `#160f17`/`#1A1A1A` backgrounds; green (`#04842E`) apply button with white text; `#34D399` indicator dot |
| **Hidden state** | `aria-hidden="true"` on panel when closed; `aria-hidden="true"` on decorative icons |
| **Disabled state** | All inputs and buttons receive `disabled` attribute during loading |

## Responsive Behavior

| Breakpoint | Panel Width | Notes |
|------------|-------------|-------|
| `< 640px` (mobile) | Full width (`w-full`) | Slides from right, fills screen |
| `≥ 640px` (sm) | `420px` | Slides from right as narrow drawer |
| `≥ 1024px` (lg) | `480px` | Larger drawer on wide screens |
| Amount range | `grid-cols-2` | Two columns at all breakpoints |
| Advanced toggle label | `hidden sm:inline` | "Advanced" text hidden on mobile; icon always visible |
| Filter chips | `flex-wrap` | Natural wrapping on narrow viewports |

## Testing

```
pnpm test -- components/transactions/advanced-filter-panel.test.tsx
pnpm test -- components/transactions/filter-chips.test.tsx
pnpm test -- components/transactions/transactions-content.test.tsx
```

**Results:** 45/45 tests passing (23 panel + 10 chips + 12 content).

TypeScript type-check passes with no new errors.

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| **Empty panel** | All fields default to empty/neutral values |
| **Min > Max amount** | Validation alert shown; filters not applied until corrected |
| **Empty counterparty** | Treated as "no filter" (undefined passed to API) |
| **Loading state** | All panel inputs/buttons disabled via `disabled` prop |
| **Multiple rapid opens** | Draft values reset to committed state each time panel opens |
| **Single chip** | "Clear all" link hidden (only shown with 2+ chips) |
| **No active chips** | `FilterChips` returns `null` (renders nothing) |
| **Long counterparty addresses** | Truncated with `max-w-[160px] truncate` in chip display |

## Future Considerations

- **URL persistence**: The panel is fully compatible with URL-persisted filter state. Adding `useSearchParams`/`useRouter` in `transactions-content.tsx` would make filters bookmarkable and shareable.
- **`filter.tsx` integration**: The existing `filter.tsx` component has min/max amount inputs and debounce logic but isn't wired into the main filter flow. It could be connected or deprecated.
