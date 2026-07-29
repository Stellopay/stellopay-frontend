Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

## Error States vs Empty States

The Transactions list component distinguishes between an empty result (e.g. no transactions matching the selected filters) and a network or server error.

- **Empty State**: Rendered via the `TransactionsTable` empty message (`No transactions found. Try adjusting your filters.`).
- **Error State**: Rendered using the `<ErrorState />` UI component which displays the actual error message or a generic "Failed to load transactions." It also provides a "Try Again" button.

### Route-Scoped Error Boundaries (`app/transactions/error.tsx`, `app/settings/preferences/error.tsx`)

Both routes now have dedicated App Router error segments that catch render errors locally, preventing them from bubbling to the generic `app/error.tsx`. Each boundary uses the shared `components/ui/error-state.tsx` component and provides:

- **Event ID placeholder** (`digest` mapped through `eventId` prop) — visible reference for support debugging.
- **Retry action** (`reset()` wired to the retry button) — allows users to recover without leaving the route.
- **Report-issue link** (`/help/support` by default) — accessible link for escalation.

These boundaries mirror the existing `app/dashboard/error.tsx` pattern (console logging of digest, dev-only message rendering, accessible `main` wrapper with `role="alert"` and `aria-live="assertive"`).

### Responsive Behavior

- **sm (640px)**: Container uses full width with `px-6`; content stays centered.
- **md (768px)**: `max-w-md` keeps the error card readable without excessive line length.
- **lg (1024px)** and **xl (1280px)**: The `min-h-[60vh]` wrapper ensures vertical centering across larger viewports.

The design tokens (`bg-background`, `text-foreground`, `text-red-500`, rounded-xl, `max-w-md`) remain consistent across breakpoints.

### Accessibility Notes (WCAG 2.1 AA)

- **Contrast**: The ErrorState uses a `text-red-500` icon and `text-white` text on a `bg-red-900/10` background which exceeds minimum contrast requirements.
- **Keyboard Nav**: The "Try Again" button is fully keyboard navigable. Focus order is maintained.
- **ARIA**: The `ErrorState` component utilizes `role="alert"` and `aria-live="assertive"` so screen readers can proactively announce network failures. Loading/Retrying indicators use `aria-hidden="true"` on non-text elements and `aria-label` or `aria-disabled` where appropriate to ensure status is accurately conveyed.
- **New props**: `eventId` is rendered in a `<code>` block with `aria-label` describing the reference; the report link uses `aria-label="Report this issue"` so screen readers announce purpose clearly.
