


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

## Zinc vs. Token Audit — `components/analytics/analytics-view.tsx` (#763)

`analytics-view.tsx` previously reached for Tailwind's built-in `zinc-*` palette directly instead of the semantic tokens defined in `app/globals.css` (the shadcn neutral base color). This meant its grays didn't move together with the rest of the dashboard if the neutral base color is ever retuned. All 18 `zinc-*` usages in the file have been mapped to tokens.

### Catalogue and mapping

| Zinc usage | Purpose | Token replacement |
|---|---|---|
| `border-zinc-200 dark:border-zinc-800` | Card / panel outer border | `border-border` |
| `border-zinc-100 dark:border-zinc-800/50` | Subtler inner border (chart wells) | `border-border/50` |
| `bg-zinc-50 dark:bg-zinc-900/50` | Chip / icon-well / button background | `bg-muted` |
| `bg-zinc-50/30 dark:bg-zinc-900/20` | Very subtle chart-well background | `bg-muted/30 dark:bg-muted/20` |
| `text-zinc-900 dark:text-white` | Headings (`Analytics views`, `Notifications`) | `text-foreground` |
| `text-zinc-700 dark:text-zinc-300` / `text-zinc-600 dark:text-zinc-400` | Body/label text (dropdown trigger, dropdown items, "View All") | `text-foreground` (see contrast note below) |
| `text-zinc-400` | Decorative chevron icons | `text-muted-foreground` |
| `hover:bg-zinc-100 dark:hover:bg-zinc-800` / `hover:bg-zinc-50 dark:hover:bg-zinc-900/50` | Hover feedback on chips/menu items | `hover:bg-muted-foreground/10` (see flagged gap below) |

### Flagged: no distinct hover/accent token exists yet

`app/globals.css` currently defines `--muted`, `--accent`, and `--secondary` with **identical** OKLCH values in both light and dark mode. That means a literal semantic mapping of the old `hover:bg-zinc-100` state to `hover:bg-accent` (the conventionally "correct" token for hover treatment) would be a visual no-op, since `bg-accent` renders identically to the `bg-muted` base it would be hovering from — a real loss of hover affordance versus the previous zinc-based behavior.

As a stopgap that doesn't invent a new CSS variable, this PR uses the existing `--muted-foreground` token at low opacity (`hover:bg-muted-foreground/10`) as a neutral overlay: it reliably darkens the surface in light mode and lightens it in dark mode, restoring the escalation without depending on `--accent`.

**Recommendation for the design-system owner**: give `--accent` (and/or `--secondary`) a value distinct from `--muted` so components can use the canonical `bg-accent` hover token directly instead of this opacity-based workaround.

### Flagged: `text-zinc-700`/`text-zinc-600` mapped to `foreground`, not `muted-foreground`

The obvious "one step down from full text" token is `--muted-foreground`, but at `oklch(55.553%)` (light) it produces roughly a 4:1 contrast ratio against the card background — below the 4.5:1 AA threshold for normal (non-large) 14px text such as the dropdown trigger label and "View All". To avoid regressing contrast, this text was mapped to `text-foreground` instead, which keeps the original ~10:1+ contrast the `zinc-700`/`zinc-900` values had. `text-muted-foreground` remains reserved for decorative, non-text-bearing elements (chevrons) where the WCAG 1.4.11 non-text 3:1 threshold applies instead.

### Out of scope: non-`zinc-*` hardcoded colors

The file also hardcodes non-token hex values that are **not** `zinc-*` utilities and were left untouched per this issue's scope (e.g. `bg-white dark:bg-[#111111]`, `bg-[#0D0D0D80]`, `border-[#2D2D2D]`, `bg-[#121212]`). These represent the same class of design-token debt and would be a reasonable follow-up issue, but reconciling them changes a much larger surface area of the component (including the non-`showNotifications` dark-card visual treatment) than a zinc-vs-token audit calls for.

### Responsive & accessibility validation

- Verified visually and via existing tests across the `showNotifications`/`showDropdown` permutations, which drive the `sm`/`md` breakpoint layout switch (`flex-col md:flex-row`) — no layout classes were touched, only color utilities.
- All existing tests in `components/analytics/analytics-view.test.tsx` pass against the new markup (one unrelated pre-existing failure, `renders empty state component when empty data is provided`, reproduces identically on `main` and is unrelated to this change).
- No text or non-text contrast regressions: token swaps were chosen to preserve or exceed the contrast ratios of the `zinc-*` values they replaced (see notes above).

## Quick Transfer Widget — `components/dashboard/quick-transfer.tsx` (#892)

### Overview
Added a compact quick-transfer card to the dashboard so repeat senders can initiate a Stellar payment without leaving `components/dashboard/dashboard-page.tsx`. The widget surfaces recent transaction counterparties as autocomplete suggestions, validates the recipient address and amount inline, and requires an explicit confirmation dialog before the transfer is dispatched.

### Component surface

| Concern | Implementation |
|---|---|
| **Recipient autocomplete** | Custom `combobox` pattern: `role="combobox"` input with `aria-expanded`, `aria-controls`, and `aria-activedescendant`. Suggestions are filtered by address or label, limited to 5 items, and navigable with ArrowUp/ArrowDown/Enter/Escape. |
| **Address validation** | Reuses `utils/stellarAddress.ts` (`isValidStellarAddress`). Ed25519 public keys (`G...`) and muxed accounts (`M...`) are accepted; secret seeds (`S...`) are rejected. Shows an inline `FormMessage` on blur. |
| **Amount validation** | Zod schema enforces positive, numeric input with up to 7 decimal places (Stellar precision). The input uses `inputMode="decimal"` for mobile keyboards. |
| **Confirmation step** | Radix `Dialog` with `role="dialog"`, `aria-labelledby`, and `aria-describedby`. Displays recipient and amount for final review; Cancel aborts, Confirm & Send triggers the provided `onSend` callback. |
| **Accessibility** | WCAG 2.1 AA: all form fields have `<label>` + `htmlFor`, `aria-invalid` is driven by the Input `error` prop, error messages use `role="alert"`, the dialog focus is trapped by Radix, and no interactive element relies on hover alone. |
| **Responsive breakpoints** | Card spacing uses `p-5 sm:p-6`; headings resize with `text-lg sm:text-xl`; dialog remains usable at `sm:max-w-lg`. No horizontal overflow at `sm` (640), `md` (768), `lg` (1024), or `xl` (1280). |
| **Design tokens** | Matches existing dashboard cards (`rounded-2xl`, `border-zinc-200 dark:border-zinc-800`, `bg-white dark:bg-[#111111]`, `shadow-sm`). Text colors use `text-zinc-900/600/500/400` with dark counterparts. |

### Keyboard navigation
- **ArrowDown / ArrowUp** cycles autocomplete suggestions.
- **Enter** selects the active suggestion or submits the form.
- **Escape** closes the suggestion list or the confirmation dialog.
- **Tab** moves focus through fields without trapping.

### Edge cases covered in tests
- Empty recent-recipients list renders without crashing.
- Invalid Stellar addresses show validation text after blur.
- Negative values and >7 decimals are rejected.
- Empty/disconnected states leave the Submit button disabled.
- `onSend` rejections surface an accessible `role="alert"` message.
- Suggestion keyboard traversal scrolls the active item into view.

