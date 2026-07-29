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

## First-Login Guided Product Tour

A 5-step spotlight overlay (`DashboardTour`) highlights one dashboard widget per step on first authenticated dashboard visit, reducing the learning curve for new users.

### Steps

| Step | Widget | Icon | Highlight |
|------|--------|------|-----------|
| 1 | Welcome (overview) | Sparkles | No target; centered tooltip |
| 2 | Account Summary | Wallet | AccountOverview ref |
| 3 | Quick Actions | Zap | QuickActions ref |
| 4 | Analytics & Insights | BarChart3 | AnalyticsInsights ref |
| 5 | Detailed Analytics | TrendingUp | ClientAnalyticsView ref |

### Implementation

- **File**: `components/dashboard/dashboard-tour.tsx`
- **Trigger**: Auto-opens 800ms after first authenticated dashboard visit (tracked via `safeStorage` key `stellopay_dashboard_tour_completed`)
- **Persistence**: Marked complete in `localStorage` after "Get Started" is clicked or user dismisses any step
- **Dismissible**: Skip button (X) on every step; Escape key closes the entire tour
- **Keyboard nav**: Tab cycles through tooltip controls; Enter activates; Escape dismisses

### Accessibility (WCAG 2.1 AA)

- **ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-describedby` linking to step description
- **Focus management**: Focus trapped within the tour tooltip on open and during navigation
- **Contrast**: White tooltip on dark overlay (`bg-black/70`); blue focus rings on interactive elements
- **Reduced motion**: Respects `prefers-reduced-motion`; disables spotlight highlight transitions
- **Screen reader**: Step announcements via live-region description, current step indicated on indicator dots
