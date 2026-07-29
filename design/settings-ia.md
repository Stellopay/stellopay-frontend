# Settings Information Architecture

## Overview

This pass restructures the settings surface around five primary sections:

- Account
- Notifications
- Security
- Wallets
- Statements

The goal is to keep frequent tasks obvious, reduce visual overload, and separate destructive actions from routine edits.

## IA Decisions

### 1. Clear section grouping

- **Account:** profile identity, email, locale, and billing-related defaults
- **Notifications:** alert priorities, channel routing, and quiet hours
- **Security:** password work, verification controls, API key management, and active sessions
- **Wallets:** connected wallets, outbound safeguards, and destructive wallet removal
- **Statements:** downloadable periodic statements and tax-relevant transaction summaries

The top chrome now uses a persistent settings section bar built from the existing `components/ui/tabs.tsx` primitive. The active section is mirrored into the URL with `?section=...` so users can deep-link directly into a settings area without creating additional nested routes.

### 2. Progressive disclosure

The page now exposes only high-frequency tasks by default and hides lower-frequency details behind disclosure patterns:

- Advanced identity and billing fields
- Delivery channel customization
- Recovery methods
- Wallet metadata and compliance checks
- Empty statement history when no downloadable documents have been generated yet

This keeps the initial scan light on both desktop and mobile while still keeping advanced controls on the same page.

### 3. Safe destructive actions

Destructive actions are isolated into explicit danger zones instead of appearing beside standard save actions.

Current destructive patterns:

- `Deactivate account`
- `Sign out all sessions`
- `Remove primary wallet`

Each destructive flow uses:

- A dedicated confirmation dialog
- Impact statements before confirmation
- A typed confirmation token before the destructive CTA enables

This keeps destructive actions deliberate and reduces accidental activation risk.

## Reachability

The intended click depth from `/settings/preferences` is:

- Change profile fields: 1 section tap + 1 save action
- Adjust notification priorities: 1 section tap + 1 toggle
- Change password: 1 section tap + form interaction
- Create, rotate, or revoke an API key: 1 section tap + key action + typed confirmation for rotate/revoke
- Review wallet controls: 1 section tap + 1 toggle
- Download a statement or tax summary: 1 section tap + 1 download action
- Destructive actions: 1 section tap + 1 danger-zone action + typed confirmation

This keeps the overwhelming majority of settings tasks within the requested `<= 3 clicks` threshold from entry.

## Statements Section

The Statements tab lists generated documents by period using the shared
`components/ui/table.tsx` primitive. Each row includes the reporting period,
covered date range, document type, generation date, and a keyboard-focusable
download action with an explicit accessible name such as
`Download Q2 2026 Transaction statement`.

When no documents are available, the tab renders the shared
`components/ui/empty-state.tsx` component so the section has a clear, polite
screen-reader announcement instead of a blank panel.

Accessibility and responsive notes:

- Contrast follows the existing zinc/white/dark-mode settings tokens used by the other sections.
- The tab remains reachable through the existing Radix tabs keyboard model: arrow keys, Home, and End.
- The document list uses semantic table headers and a horizontal overflow wrapper from the shared table component for small screens.
- The table and empty state are designed to remain usable at `sm` 640px, `md` 768px, `lg` 1024px, and `xl` 1280px.
- Download links include visible text, an icon marked `aria-hidden`, and a specific `aria-label` per document.

## Testing And Screenshots

Automated coverage is provided with Playwright in `tests/settings.spec.ts`.

Covered flows:

- Desktop settings navigation across grouped sections
- Typed-confirmation gating for account deactivation
- Mobile visibility of the settings section navigation
- Unit coverage in `settings-page-shell.test.tsx` for statements tab routing, downloads, and the empty state

Generated screenshots:

- `design/screenshots/settings-desktop.png`
- `design/screenshots/settings-mobile.png`

The statements change is a settings-tab addition only. Capture updated
screenshots when the visual regression pass is run for the broader settings
surface.

## Security API Keys

The Security tab now includes an API keys subsection for developer-minded users
who need programmatic account access.

Behavior:

- The list shows each key name, creation date, last-used timestamp, and a short
  non-secret prefix for orientation.
- Creating a key requires a 3+ character name, shows a short loading state, and
  reveals the raw `sk_live_...` value exactly once.
- Rotating a key uses the shared destructive action dialog with the `ROTATE`
  confirmation token before replacing the existing secret.
- Revoking a key uses the shared destructive action dialog with the `REVOKE`
  confirmation token before removing access.
- Raw secrets are only rendered in the one-time reveal panel after create or
  rotate. Dismissing the panel removes the raw value from the DOM.

Accessibility and responsive notes:

- The create form has an explicit accessible name, label, instruction text, and
  `aria-describedby` error wiring.
- The one-time secret reveal uses `role="status"` and `aria-live="polite"` so
  assistive technology receives creation/rotation feedback without a forced
  focus jump.
- Copy, hide, rotate, and revoke controls are keyboard-focusable buttons with
  visible focus treatment inherited from shared UI primitives.
- Rotate and revoke inherit the Radix dialog focus trap, typed confirmation
  input autofocus, exact-token validation, and focus restoration from
  `destructive-action-dialog.tsx`.
- Long key names and raw secrets use wrapping constraints so they remain usable
  at `sm` 640px, `md` 768px, `lg` 1024px, and `xl` 1280px in light and dark
  mode.

## Notes

- The UI remains prototype-safe: save and destructive actions currently update local confirmation states until backend wiring exists.
- The branch for this work is `design/settings-ia`.
