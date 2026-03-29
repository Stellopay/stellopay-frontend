# Settings Information Architecture

## Overview

This pass restructures the settings surface around four primary sections:

- Account
- Notifications
- Security
- Wallets

The goal is to keep frequent tasks obvious, reduce visual overload, and separate destructive actions from routine edits.

## IA Decisions

### 1. Clear section grouping

- **Account:** profile identity, email, locale, and billing-related defaults
- **Notifications:** alert priorities, channel routing, and quiet hours
- **Security:** password work, verification controls, and active sessions
- **Wallets:** connected wallets, outbound safeguards, and destructive wallet removal

The top chrome now uses a persistent settings section bar built from the existing `components/ui/tabs.tsx` primitive. The active section is mirrored into the URL with `?section=...` so users can deep-link directly into a settings area without creating additional nested routes.

### 2. Progressive disclosure

The page now exposes only high-frequency tasks by default and hides lower-frequency details behind disclosure patterns:

- Advanced identity and billing fields
- Delivery channel customization
- Recovery methods
- Wallet metadata and compliance checks

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
- Review wallet controls: 1 section tap + 1 toggle
- Destructive actions: 1 section tap + 1 danger-zone action + typed confirmation

This keeps the overwhelming majority of settings tasks within the requested `<= 3 clicks` threshold from entry.

## Testing And Screenshots

Automated coverage is provided with Playwright in `tests/settings.spec.ts`.

Covered flows:

- Desktop settings navigation across grouped sections
- Typed-confirmation gating for account deactivation
- Mobile visibility of the settings section navigation

Generated screenshots:

- `design/screenshots/settings-desktop.png`
- `design/screenshots/settings-mobile.png`

## Notes

- The UI remains prototype-safe: save and destructive actions currently update local confirmation states until backend wiring exists.
- The branch for this work is `design/settings-ia`.
