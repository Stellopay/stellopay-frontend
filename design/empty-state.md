# Empty states

`components/ui/empty-state.tsx` is the canonical empty-state primitive. Use it
instead of hand-rolling markup for an empty list, an unmatched filter, a failed
fetch, or a lost connection — that is what keeps spacing, tone and screen-reader
announcements consistent across features.

Layout comes from `StatePanel` (shared with `ErrorState`), so an empty result and
a failed request never shift the page when one replaces the other.

## Variants

Pick a variant first, then override copy only when the feature needs more
specific wording.

| Variant   | Use when                                       | Icon            | Tone    | Announcement            |
| --------- | ---------------------------------------------- | --------------- | ------- | ----------------------- |
| `default` | Nothing has been created yet                   | `Inbox`         | neutral | `status` / polite       |
| `search`  | A query or filter matched nothing              | `SearchX`       | neutral | `status` / polite       |
| `error`   | The data could not be loaded                   | `AlertTriangle` | danger  | `alert` / assertive     |
| `offline` | The device has no connection                   | `WifiOff`       | neutral | `status` / polite       |

Each variant ships default `title`, `description` and CTA label, so the minimum
usage is a single prop:

```tsx
<EmptyState variant="search" />
```

## Overriding copy

`title` and `description` are optional and layer on top of the variant:

```tsx
<EmptyState
  variant="offline"
  description="Your transactions will sync once you're back online."
/>
```

## Actions

`action` is the preferred CTA slot. The legacy `onRetry` + `actionLabel` pair
still works; when only `onRetry` is given, the variant's label is used
(`Clear Filters`, `Try Again`, `Retry`).

```tsx
<EmptyState
  title="No transactions"
  description="Transactions you send will appear here."
  action={{ label: "New transaction", onClick: openComposer }}
/>

<EmptyState variant="error" action={{ label: "Retry", onClick: refetch }} />

<EmptyState variant="search" onRetry={clearFilters} />
```

## Illustration slot

`illustration` accepts any SVG or `next/image` element and replaces the icon.
The icon-only path remains the default, so pass an illustration only where the
surface is large enough to earn it (a full-page empty dashboard, not a table
body).

```tsx
<EmptyState
  title="No wallets"
  description="Add your first wallet to get started."
  illustration={<EmptyWalletSvg />}
  action={{ label: "Add wallet", onClick: handleAdd }}
/>
```

The illustration is capped at `220px` wide and scales down on narrow viewports.
Custom `icon` is still supported and is ignored when `illustration` is set.

## Accessibility

- Icons and illustrations are decorative and `aria-hidden`; the title and
  description carry the meaning, so nothing is conveyed by glyph or colour alone
  (SC 1.4.1).
- Neutral variants announce politely — an empty result is not an error and must
  not interrupt what the user is already hearing. `error` announces assertively
  because the user's request failed.
- The title renders as an `h3`, so panels nest under a section's `h2` without
  skipping a level (SC 1.3.1).
- The CTA carries a visible `focus-visible` ring with a tone-matched offset
  (SC 2.4.7).

See also [a11y-checklist.md](./a11y-checklist.md).
