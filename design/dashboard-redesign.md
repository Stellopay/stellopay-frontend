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

## Transaction Quick-View Dialog

The transactions table includes an in-place quick-view dialog that allows users to inspect full transaction details without leaving the filtered table view. This is distinct from the full-page `/transactions/[id]` route.

### Features

- **In-place quick-view**: Opens a modal dialog on row click showing full transaction details
- **View Full Details link**: Includes a link inside the dialog to navigate to the dedicated `/transactions/[id]` route
- **Focus restoration**: Returns focus to the triggering row when the dialog closes
- **Responsive**: Works on both desktop table view and mobile card view
- **Optional fields support**: Displays memo, counterparty, fee, and transaction hash when available

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: 
  - Focus ring (`focus:ring-[#D7E0EF]`) provides clear 3:1 contrast against dark background
  - All text meets 4.5:1 contrast ratio requirements
- **Keyboard Navigation**:
  - View detail buttons are fully keyboard accessible (Tab to focus, Enter/Space to activate)
  - Dialog can be closed with Escape key
  - Focus is trapped within the dialog while open
  - Focus returns to the triggering element when dialog closes
- **ARIA**:
  - Dialog uses `DialogTitle` and `DialogDescription` for proper accessible name and description
  - View detail buttons have descriptive `aria-label` (e.g., "View details for transaction 123")
  - Status badges have `aria-label` (e.g., "Status: Completed")
  - "View Full Details" link has `aria-label` for context
  - Decorative icons use `aria-hidden="true"`
- **Screen Reader Support**:
  - Dialog title and description are announced on open
  - All fields are properly labeled with semantic HTML
  - Status is announced with context ("Status: Completed" rather than just "Completed")

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| sm (640px) | Mobile card view - cards are clickable to open dialog |
| md (768px) | Desktop table view - view detail button in each row |
| lg (1024px) | Same as desktop, expanded dialog width |
| xl (1280px) | Same as desktop, expanded dialog width |

### Dark Mode

The dialog uses design tokens (`bg-background`, `text-muted-foreground`, etc.) that adapt to dark mode automatically. All contrast requirements are met in both light and dark modes.
