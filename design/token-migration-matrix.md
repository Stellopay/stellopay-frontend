---
title: "Design Token Migration Matrix"
description: "Tracking document for hardcoded hex color migration to design tokens"
---

# Design Token Migration Matrix

This document tracks the migration of hardcoded hex values to semantic design tokens across the Stellopay frontend. It focuses on the components that are most visible to users first, while still surfacing the broader debt in settings, help, and analytics surfaces.

## Migration Status Overview

| Component | Area | Tokenization Status | Tracking Issue | Priority |
| --- | --- | --- | --- | --- |
| Landing Hero | Landing | In Progress 🟡 | [#905](https://github.com/stellopay/frontend/issues/905) | High |
| Landing CTA / Get Started | Landing | Not Started ❌ | [#910](https://github.com/stellopay/frontend/issues/910) | High |
| Landing Feature Grid | Landing | Not Started ❌ | [#915](https://github.com/stellopay/frontend/issues/915) | High |
| Dashboard Account Summary | Dashboard | Not Started ❌ | [#920](https://github.com/stellopay/frontend/issues/920) | High |
| Transaction History / Dashboard | Dashboard | Not Started ❌ | [#925](https://github.com/stellopay/frontend/issues/925) | High |
| Transactions Table | Transactions | In Progress 🟡 | [#930](https://github.com/stellopay/frontend/issues/930) | Medium |
| Settings Preferences | Settings | Not Started ❌ | [#935](https://github.com/stellopay/frontend/issues/935) | Medium |
| Help Center / CTA | Help | Not Started ❌ | [#940](https://github.com/stellopay/frontend/issues/940) | Medium |
| Analytics View | Analytics | Not Started ❌ | [#945](https://github.com/stellopay/frontend/issues/945) | Low |
| Account Summary Page | App Shell | Not Started ❌ | [#950](https://github.com/stellopay/frontend/issues/950) | Low |

## Priority Order

1. Landing surfaces first because they are the first impression of the product.
2. Dashboard and transaction flows next because they are used repeatedly in core journeys.
3. Settings, help, and analytics follow once the core experience is consistent.

## Detailed Component Tracking

### Landing Hero (In Progress 🟡)

- Source: [components/landing/hero.tsx](components/landing/hero.tsx)
- Status: The component still uses hardcoded brand colors for gradients, borders, and surface states.
- Token targets: `--primary`, `--secondary`, `--accent`, `--border`, `--background`, `--foreground`
- Next step: Replace hero gradients and card surfaces with semantic tokens while preserving the existing visual hierarchy.
- Accessibility: Confirm contrast ratios stay at or above WCAG 2.1 AA for text and controls.

### Landing CTA / Get Started (Not Started ❌)

- Source: [components/landing/get-started-cta.tsx](components/landing/get-started-cta.tsx)
- Status: CTA surfaces use hardcoded button, border, and text colors that should map to theme tokens.
- Token targets: `--primary`, `--accent`, `--background`, `--foreground`, `--ring`
- Next step: Audit the call-to-action, input field, and supporting badges for semantic replacements.

### Landing Feature Grid (Not Started ❌)

- Source: [components/landing/feature-card-grid.tsx](components/landing/feature-card-grid.tsx)
- Status: Feature card surfaces and icon highlights still rely on explicit hex values.
- Token targets: `--card`, `--card-foreground`, `--accent`, `--muted`
- Next step: Consolidate shared card and badge colors so the landing page can be themed consistently.

### Dashboard Account Summary (Not Started ❌)

- Source: [app/account-summary/page.tsx](app/account-summary/page.tsx)
- Status: The account summary cards and borders still use hardcoded dark-surface colors.
- Token targets: `--card`, `--border`, `--foreground`, `--muted`
- Next step: Move the summary cards to semantic tokens for light and dark mode parity.

### Transaction History / Dashboard (Not Started ❌)

- Source: [components/dashboard/transaction-history.tsx](components/dashboard/transaction-history.tsx)
- Status: Transaction rows and status surfaces need token-based replacements for better consistency with the rest of the dashboard.
- Token targets: `--card`, `--muted`, `--success`, `--warning`, `--destructive`
- Next step: Audit status badges and hover states before moving the component to semantic tokens.

### Transactions Table (In Progress 🟡)

- Source: [components/transactions/transactions-table.tsx](components/transactions/transactions-table.tsx)
- Status: The table has started the migration, but a few row and divider styles still need token-based replacements.
- Token targets: `--card`, `--border`, `--muted`, `--foreground`
- Next step: Finish the remaining row and divider styling to align with the token system.

### Settings Preferences (Not Started ❌)

- Source: [components/settings](components/settings)
- Status: The settings surface should adopt the shared theme tokens for backgrounds, borders, and destructive actions.
- Token targets: `--background`, `--foreground`, `--border`, `--destructive`, `--ring`
- Next step: Migrate the settings shell and preference cards to the theme tokens already defined in [app/globals.css](app/globals.css).

### Help Center / CTA (Not Started ❌)

- Source: [components/common/support-tabs.tsx](components/common/support-tabs.tsx)
- Status: Help and support surfaces still contain explicit color values that should move to semantic tokens for consistent contrast and theming.
- Token targets: `--card`, `--border`, `--foreground`, `--muted`
- Next step: Replace help-shell backgrounds, separators, and CTA surfaces with shared semantic tokens.

### Analytics View (Not Started ❌)

- Source: [components/analytics/analytics-view.tsx](components/analytics/analytics-view.tsx)
- Status: Analytics cards and empty states still include hardcoded surface colors that should be tokenized for consistency across themes.
- Token targets: `--card`, `--border`, `--muted`, `--accent`
- Next step: Migrate card surfaces and chart wrappers to reusable tokens before expanding the rest of the analytics experience.

### Account Summary Page (Not Started ❌)

- Source: [app/account-summary/page.tsx](app/account-summary/page.tsx)
- Status: The account summary experience still carries dark-surface styling in the shell and content cards.
- Token targets: `--background`, `--card`, `--border`, `--foreground`
- Next step: Replace hardcoded surface colors in the shell and summary cards with shared tokens and verify both themes.

## Accessibility, Responsive, and Review Checklist

- All remaining migrations should meet WCAG 2.1 AA contrast for normal text, large text, and interactive controls.
- Keyboard focus states should remain visible and use the shared `--ring` token.
- Color-only status messaging should be paired with text labels or icons so screen-reader and low-vision users receive the same information.
- Responsive behavior should be re-checked at `sm`, `md`, `lg`, and `xl` breakpoints after each token migration.
- Reviewers should verify both light and dark themes before closing the related issue.

## Additional Surface Inventory

- [components/common/footer.tsx](components/common/footer.tsx)
- [components/common/navbar.tsx](components/common/navbar.tsx)
- [components/dashboard/account-summary.tsx](components/dashboard/account-summary.tsx)
- [components/transactions/transactions-header.tsx](components/transactions/transactions-header.tsx)

## Migration Notes

- The source of truth for shared theme values remains [app/globals.css](app/globals.css).
- This matrix is intentionally scoped to the components most likely to affect user perception and the core product journey first.
- Each component should move from hardcoded hex usage to semantic tokens in small, reviewable steps so the changes remain easy to validate.

## Priority Order

1. Landing surfaces first because they are the first impression of the product.
2. Dashboard and transaction flows next because they are used repeatedly in core journeys.
3. Settings, help, and analytics follow once the core experience is consistent.

## Detailed Component Tracking

### Landing Hero (In Progress 🟡)

- **Source**: [components/landing/hero.tsx](components/landing/hero.tsx)
- **Status**: The component still uses hardcoded brand colors for gradients, borders, and surface states.
- **Token targets**: `--primary`, `--secondary`, `--accent`, `--border`, `--background`, `--foreground`
- **Next step**: Replace hero gradients and card surfaces with semantic tokens while preserving the existing visual hierarchy.
- **Accessibility**: Confirm contrast ratios stay at or above WCAG 2.1 AA for text and controls.

### Landing CTA / Get Started (Not Started ❌)

- **Source**: [components/landing/get-started-cta.tsx](components/landing/get-started-cta.tsx)
- **Status**: CTA surfaces use hardcoded button, border, and text colors that should map to theme tokens.
- **Token targets**: `--primary`, `--accent`, `--background`, `--foreground`, `--ring`
- **Next step**: Audit the call-to-action, input field, and supporting badges for semantic replacements.

### Landing Feature Grid (Not Started ❌)

- **Source**: [components/landing/feature-card-grid.tsx](components/landing/feature-card-grid.tsx)
- **Status**: Feature card surfaces and icon highlights still rely on explicit hex values.
- **Token targets**: `--card`, `--card-foreground`, `--accent`, `--muted`
- **Next step**: Consolidate shared card and badge colors so the landing page can be themed consistently.

### Dashboard Account Summary (Not Started ❌)

- **Source**: [app/account-summary/page.tsx](app/account-summary/page.tsx)
- **Status**: The account summary cards and borders still use hardcoded dark-surface colors.
- **Token targets**: `--card`, `--border`, `--foreground`, `--muted`
- **Next step**: Move the summary cards to semantic tokens for light and dark mode parity.

### Transaction History / Dashboard (Not Started ❌)

- **Source**: [components/dashboard/transaction-history.tsx](components/dashboard/transaction-history.tsx)
- **Status**: Transaction rows and status surfaces need token-based replacements for better consistency with the rest of the dashboard.
- **Token targets**: `--card`, `--muted`, `--success`, `--warning`, `--destructive`
- **Next step**: Audit status badges and hover states before moving the component to semantic tokens.

### Transactions Table (In Progress 🟡)

- **Source**: [components/transactions/transactions-table.tsx](components/transactions/transactions-table.tsx)
- **Status**: The table has started the migration, but a few row and divider styles still need token-based replacements.
- **Token targets**: `--card`, `--border`, `--muted`, `--foreground`
- **Next step**: Finish the remaining row and divider styling to align with the token system.

### Settings Preferences (Not Started ❌)

- **Source**: [components/settings](components/settings)
- **Status**: The settings surface should adopt the shared theme tokens for backgrounds, borders, and destructive actions.
- **Token targets**: `--background`, `--foreground`, `--border`, `--destructive`, `--ring`
- **Next step**: Migrate the settings shell and preference cards to the theme tokens already defined in [app/globals.css](app/globals.css).

## Accessibility, Responsive, and Review Checklist

- All remaining migrations should meet WCAG 2.1 AA contrast for normal text, large text, and interactive controls.
- Keyboard focus states should remain visible and use the shared `--ring` token.
- Color-only status messaging should be paired with text labels or icons so screen-reader and low-vision users receive the same information.
- Responsive behavior should be re-checked at `sm`, `md`, `lg`, and `xl` breakpoints after each token migration.
- Reviewers should verify both light and dark themes before closing the related issue.

## Migration Notes

- The source of truth for shared theme values remains [app/globals.css](app/globals.css).
- This matrix is intentionally scoped to the components most likely to affect user perception and the core product journey first.
- Each component should move from hardcoded hex usage to semantic tokens in small, reviewable steps so the changes remain easy to validate.
