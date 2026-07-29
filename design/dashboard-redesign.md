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

## Dashboard Recent Activity Feed

### Purpose

The dashboard now includes a **Recent activity** widget that gives users one unified place to review the latest account activity. It combines:

- transaction events from the existing transactions data hook,
- wallet connection / wallet preference events,
- security-setting changes, and
- general settings updates.

Events are merged by ISO timestamp, sorted newest first, and capped to a default of **12** items with a hard maximum of **15**. The card includes a **View all** link that currently routes to `/transactions` while a dedicated full account-activity route is not yet available.

### Visual Design and Tokens

- Container follows existing dashboard card treatment: `rounded-2xl`, `border-zinc-200 dark:border-zinc-800`, `bg-white dark:bg-[#111111]`, and `shadow-sm`.
- Typography mirrors dashboard hierarchy:
  - `text-xl font-bold` for the card heading,
  - `text-sm text-zinc-600 dark:text-zinc-400` for supporting copy,
  - `text-sm font-semibold` for event titles.
- Event type icon treatments use existing lucide-react icons and WCAG-conscious color pairs:
  - Transaction: `FileText`, blue treatment.
  - Wallet: `Wallet`, emerald treatment.
  - Security: `Shield`, amber treatment.
  - Settings: `Settings`, violet treatment.
- Event type is never conveyed by icon/color alone. Each row includes a visible uppercase text badge such as `Transaction`, `Wallet`, `Security`, or `Settings`.

### Accessibility Notes (WCAG 2.1 AA)

- **Structure**: The widget is a `section` labelled by `#recent-activity-heading`; the event feed is an ordered list with an accessible name and `aria-describedby` pointing to the descriptive helper text.
- **Loading State**: Uses `role="status"`, `aria-busy="true"`, and `aria-live="polite"`, plus an `sr-only` loading label.
- **Error State**: Reuses `<ErrorState />`, preserving `role="alert"`, `aria-live="assertive"`, and a keyboard-operable retry button.
- **Empty State**: Reuses `<EmptyState />`, preserving polite status announcement semantics.
- **Keyboard Navigation**: The only interactive control inside the widget is the **View all** link. It is a native anchor, appears in the natural tab order, and has a visible focus ring via `focus-visible:ring-*` classes.
- **Icons**: Lucide icons are decorative and marked `aria-hidden="true"`; visible text badges provide the non-visual equivalent.
- **Contrast**: Primary text uses `text-zinc-900` on white and `text-white` on `#111111`. Secondary text uses `text-zinc-600` / `dark:text-zinc-400`. Badge and icon colors use darker light-mode shades and lighter dark-mode shades to preserve AA contrast.
- **Long Text**: Event title/description/metadata use `break-words`, `min-w-0`, and `line-clamp-2` to avoid horizontal overflow while keeping the full row reachable to assistive technologies.

### Responsive Behavior

Validated layout expectations by breakpoint:

- **sm (640px)**: Header controls move from stacked to horizontal. Feed rows switch from a two-column mobile grid to icon/content/time alignment.
- **md (768px)**: Card content remains readable with consistent spacing inside the dashboard's main content column.
- **lg (1024px)**: Widget aligns with other dashboard cards within the wider dashboard spacing (`lg:p-10`).
- **xl (1280px)**: Feed preserves max-width behavior through the dashboard container (`max-w-[1600px]`) and avoids over-stretched row copy through `max-w-2xl` helper text and row `min-w-0` constraints.

### States and Edge Cases

- **Loading**: Skeleton rows reserve row structure and announce busy state.
- **Error**: A retryable alert appears if transaction activity fails to load.
- **Empty**: If all event sources are empty, a clear empty state tells users where future activity will appear.
- **Long text**: Long event titles, descriptions, metadata, and addresses wrap/clamp instead of overflowing.
- **Dark mode**: All rows, borders, badges, icons, and focus states include dark-mode tokens.

### Review and Screenshot Checklist

When opening a PR, capture these screenshots for hand-off:

1. **Before**: Dashboard without the unified Recent activity widget.
2. **After — desktop**: Dashboard at `xl` width showing the new widget between Quick Actions and Analytics Insights.
3. **After — tablet/mobile**: Dashboard at `sm`/`md` widths showing stacked header and row wrapping.
4. **After — dark mode**: Dashboard with `.dark` applied, verifying card, badges, and focus-ring contrast.
5. **Edge states**: Loading skeleton, error alert with retry, and empty-state card.

Automated coverage is in `components/dashboard/dashboard-page.test.tsx`, including merge/sort/cap behavior, loading/error/empty states, visible event type labels, decorative icon ARIA, dashboard placement, and an axe scan for the loaded widget.
