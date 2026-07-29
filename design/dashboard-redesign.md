Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/TzFU3lyfPfsM4Jzh6rXGzl/Stellopay-Dashboard-Redesign?node-id=2067-1817&t=PZ6D5lwLGX9gwnOJ-1

## Navigation — Account Summary

**Type:** Primary nav (top-level, immediately after Dashboard).

**Rationale:** Account Summary is a distinct first-class user concern (wallet
balance + usage overview) separate from the transaction feed. Placing it at the
top level gives it parity with Dashboard and Transactions rather than burying
it under an existing section.

**Route:** `/account-summary`

**Icon:** `AccountSummaryIcon` (user/profile glyph in `public/svg/svg.tsx`).

**Active highlighting:** Automatically handled by `isLinkActive` in
`utils/navigationUtils.ts` (prefix-match on `/account-summary`). Shares the
same `layoutId` spring animation and `aria-current="page"` logic as all other
sidebar links.

**Layout:** `app/account-summary/layout.tsx` wraps with `<SidebarProvider>` +
`<AppLayout>`, matching the pattern used by `/dashboard` and `/transactions`.

**Accessibility:**
- `aria-current="page"` set automatically on active link
- Tooltip with label "Account Summary" appears when sidebar is collapsed
- Focus ring, color contrast, and keyboard navigation inherited from existing
  `NavLink` / `Link` patterns
- Skip-to-content link present via `AppLayout`

**Responsive behaviour:** Collapses/expands identically to all other sidebar
links via the shared `isSidebarOpen` / `isMobile` state.
