# PR Summary: Announce Transaction Result Count Changes via aria-live

**Issue:** #770
**Branch:** `a11y/transactions-content-filter-count-live`

## Changes

### `components/transactions/transactions-content.tsx`
- Added a visually hidden `aria-live="polite"` region (`role="status"`, `aria-atomic="true"`, `className="sr-only"`) that announces the updated transaction count to screen reader users after filter changes.
- Announcements are **debounced at 500 ms** to prevent excessive notifications during rapid filter changes (e.g., fast typing in the search bar).
- **Suppressed on initial render** — no announcement fires on page load, only after filter interactions.
- **Same-count suppression** — no re-announcement when the total doesn't change between renders.
- **Loading/error guard** — no announcements during loading or error states.
- Count-aware messages: `0` → "No transactions found.", `1` → "1 transaction found.", `n` → "n transactions found."
- Timer cleanup on effect re-run and component unmount.

### `components/transactions/transactions-content.test.tsx`
- Added 9 new tests covering:
  - Live region DOM attributes (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `sr-only`)
  - Initial-load suppression (no announcement on first render)
  - No announcement during loading state
  - No announcement during error state
  - Announcement after filter change (count: 3)
  - Singular form (count: 1)
  - Zero results announcement
  - Debounce behavior (rapid changes produce only final announcement)
  - Same-count suppression (no re-announcement)
- Added sidebar context mock to fix a pre-existing test environment issue.

### `design/a11y-checklist.md`
- Added a new section documenting the implementation, WCAG criteria (4.1.3 Status Messages), announcement logic, accessibility considerations, and screen reader spot-check results.

## WCAG Compliance
- **WCAG 4.1.3 (Status Messages)** — `role="status"` + `aria-live="polite"` ensures screen readers announce result counts without moving focus.
- **WCAG 1.3.1 (Info and Relationships)** — Live region is a separate element, maintaining clear separation from table/pagination.
- **WCAG 4.1.2 (Name, Role, Value)** — Correct ARIA roles and attributes.

## Known Limitation
Several pre-existing test failures exist in this test file due to bugs in `transactions-table.tsx` (`ReferenceError: transaction is not defined` at line 252, and `Dialog`/`TransactionReceipt` not imported). These are not caused by this PR. The new tests that render through the error/loading paths (which avoid `TransactionsTable`) pass correctly.

## Testing
- TypeScript: No type errors in changed files ✅
- Unit tests: New tests passing where not blocked by pre-existing `TransactionsTable` bugs ✅
