


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

### Accessibility (WCAG 2.1 AA)
- Native `<select>` with an associated `<label htmlFor>` for full screen
  reader and keyboard support
- Visible focus ring via `focus-visible:ring-2`
- No color-only signaling; uses existing design tokens (`bg-background`,
  `text-foreground`, `border-border`)

### Responsive
Verified at sm (640px), md (768px), lg (1024px), xl (1280px) — control
remains a single row, wraps under the sort label on narrow widths.