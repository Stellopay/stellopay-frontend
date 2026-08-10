# Design-Token Migration Matrix

Tracks the tokenization status of every component across `app/` and `components/`
that still contains hardcoded hex colours or raw Tailwind palette utilities.
The goal is to give the team and future contributors a clear, prioritised view of
the remaining design-token debt after the component-by-component tokenization work
done in prior rounds (benefits.tsx, network-switcher.tsx, transactions-table.tsx,
transactions-header.tsx, and others).

> **How to read this matrix.** Each row is a component. The **Status** column says
> whether the component has been migrated to the semantic design tokens defined in
> [`app/globals.css`](../app/globals.css) (see the
> [token mapping reference](./design-token-mapping.md) for the full token catalogue).
>
> - **✅ Done** — no hardcoded hex and no raw Tailwind palette colour utilities remain.
> - **🟡 In progress** — mostly tokenized, but a small number of hardcoded colours remain.
> - **❌ Not started** — still contains hardcoded hex or raw palette utilities.

---

## Priority order

Rows are grouped by **user-facing visibility**: landing and dashboard first (they are
the surfaces a user sees on every visit), then auth/settings, then transactions, then
help/support, then lower-visibility/system surfaces. Within each group, rows are
ordered by the number of remaining hardcoded occurrences (highest first).

---

## 1. Landing (highest visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `components/landing/navbar.tsx` | 4 (`#0F172A`, `#F3F4F6`, `#9CA3AF` ×2) | yes | ❌ Not started | — | SVG fill/stroke should map to `--primary`/`--muted-foreground` |
| `components/landing/landing-page-nav-bar.tsx` | 1 (`#598EFF`) | yes | ❌ Not started | — | Brand accent in inline style; consider `--chart-blue` or a dedicated brand token |
| `components/landing/value-propositions.tsx` | 1 (`#83A7FF`) | yes | ❌ Not started | — | Inline background; map to a brand/chart token |
| `components/landing/benefits.tsx` | 0 | no | ✅ Done | (prior round) | Fully tokenized |
| `components/landing/hero.tsx` | 0 | yes | 🟡 In progress | — | No hardcoded hex; palette utilities remain |
| `components/landing/feature-card.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/feature-card-grid.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/features-grid.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/how-it-works.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/enterprise-section.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/get-started-cta.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/video-facade.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/landing/landing-page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## 2. Dashboard (very high visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `components/analytics/analytics-chart.tsx` | 4 (`#1f1b2e`, `#aaa` ×2, `#3b82f6`/`#2E2E2E`) | yes | ❌ Not started | — | Recharts tick/axis/stroke; map to `--chart-*` tokens |
| `components/dashboard/RechartsMiniBarChart.tsx` | 2 (docs only: `#3b82f6`, `#4f6fff`) | yes | 🟡 In progress | — | Docs examples reference palette; runtime fill uses token |
| `components/dashboard/dashboard-page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/account-summary-card.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/account-overview.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/analytics-insights.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/dashboard-header.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/dashboard-navbar.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/dashboard-tour.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/payment-history.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/quick-actions.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/quick-transfer.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/transaction-header.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/transaction-history.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/dashboard/sidebar-section.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/network-switcher.tsx` | 0 | yes | ✅ Done | (prior round) | Fully tokenized |

---

## 3. Transactions (high visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `app/transactions/page.tsx` | 3 (`#E5E5E5` ×3) | yes | ❌ Not started | — | SVG stroke; map to `--muted-foreground` |
| `components/transactions/transactions-filters.tsx` | 1 (`#9CA3AF`) | yes | ❌ Not started | — | Search icon colour; map to `--muted-foreground` |
| `components/transactions/transactions-table.tsx` | 1 (`#34D399`) | no (uses tokens) | 🟡 In progress | (prior round) | One tag-creation fallback colour remains; map to `--success` |
| `components/transactions/transactions-header.tsx` | 0 | yes | ✅ Done | (prior round) | No hardcoded hex; some palette utilities |
| `components/transactions/advanced-filter-panel.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/filter-chips.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/filter.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/sort.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/table-searchbar.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/tag-chip.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/transactions-export-toolbar.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/transactions/transactions-pagination.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## 4. Auth & Account (high visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `app/account-summary/page.tsx` | 0 | yes (`text-gray-400`, `text-green-400`, `text-orange-400`) | ❌ Not started | — | Map grey→`--muted-foreground`, green→`--success`, orange→`--warning` |
| `components/auth/sign-up/sign-up-form.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/auth/sign-up/sign-up-email-modal.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/auth/login/login-form.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/auth/forgot-password/forgot-password-form.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/auth/auth-social-buttons.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/auth/session-expired/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/verify-email/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## 5. Settings (medium-high visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `app/settings/preferences/components/notifications-section.tsx` | 0 | yes (heavy `text-zinc-*`, `border-zinc-*`) | ❌ Not started | — | Map `zinc-*`→`--foreground`/`--muted-foreground`/`--border` |
| `app/settings/preferences/components/account-section.tsx` | 0 | yes (`text-gray-900/500/400`) | ❌ Not started | — | Map grey→semantic tokens |
| `app/settings/preferences/components/security-tab.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/settings/preferences/components/destructive-action-dialog.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/settings/preferences/components/settings-page-shell.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/settings/preferences/components/tax-documents-section.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/settings-header.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/settings-search.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## 6. Help & Support (medium visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `app/help/support/page.tsx` | 5 (`#E5E5E5` ×5) | yes | ❌ Not started | — | Icon colours; map to `--muted-foreground` |
| `components/common/support-tabs.tsx` | 1 (`#E5E5E5`) | yes | ❌ Not started | — | Icon colour; map to `--muted-foreground` |
| `components/common/faq-card.tsx` | 1 (`#E5E5E5`) | yes | ❌ Not started | — | Icon colour; map to `--muted-foreground` |
| `components/help-support/ticket-status-widget.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/help/support/accountManagement/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/help/support/paymentTransfers/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/help/support/securityPrivacy/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/help/support/transactionIssues/page.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/help/support/accountManagement/loading.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## 7. Shared / Common UI (medium visibility)

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `components/common/nav-link.tsx` | 2 (`#0D0D0D`/`#FFFFFF`, `#E5E5E5`/`#71717A`) | yes | ❌ Not started | — | Dark/light icon colours; map to tokens |
| `components/common/footer.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/breadcrumb.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/cookie-consent-banner.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/highlight-text.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/search-bar.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/shortcut-help-modal.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/side-bar.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/toggle-card.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/common/was-this-helpful.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/icons/bell-fill-icon.tsx` | 0 | yes (test asserts `#333333`) | 🟡 In progress | — | Test fixture colour; component uses token |

---

## 8. Lower-visibility / System surfaces

| Component | Hardcoded hex | Raw palette utilities | Status | Tracking issue | Notes |
| --------- | :-----------: | :-------------------: | :----: | :------------- | :---- |
| `app/global-error.tsx` | 6 (`#f9fafb`, `#111827` ×2, `#6b7280` ×2, `#ffffff`) | no | ❌ Not started | — | Inline styles; map to `--background`/`--foreground`/`--muted-foreground` |
| `app/opengraph-image.tsx` | 8 (`#2563EB`, `#7C3AED`, `#059669`, `#FFFFFF`, `#09090B`, `#52525B`) | no | 🟡 In progress | — | OG image is a static SVG render; hex is expected for export, but track for consistency |
| `components/ui/error-state.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/error-summary.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/state-panel.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/stat-card.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/coach-mark-overlay.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/password-strength-indicator.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/ui/enterprise-solution-card.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `components/analytics/client-analytics-view.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |
| `app/dashboard/loading.tsx` | 0 | yes | 🟡 In progress | — | Palette utilities remain |

---

## Summary

| Status | Count | Priority action |
| :----- | :---: | :-------------- |
| ❌ Not started (hardcoded hex) | **8** | Convert inline hex → semantic `--color-*` tokens |
| 🟡 In progress (palette utilities only) | **~60** | Replace raw Tailwind palette utilities (`text-gray-*`, `text-zinc-*`, `border-gray-*`, …) with semantic tokens |
| ✅ Done | **4** | — |

**Recommended next steps**

1. **Convert the 8 hardcoded-hex components first** — they are the most fragile
   (they do not adapt to dark mode and fail token audits). Landing/dashboard/transactions
   hex (`navbar.tsx`, `analytics-chart.tsx`, `transactions/page.tsx`) should be the top
   priority because they are the most visible.
2. **Then sweep the palette-utility components** in the same visibility order, starting
   with dashboard and transactions, mapping `gray/zinc/slate` → `--muted-foreground` /
   `--border`, `green` → `--success`, `red` → `--destructive`, `amber/orange` → `--warning`.
3. **Update this matrix** as rows are completed so it stays the single source of truth
   for remaining design-token debt.

---

## Regenerate

To regenerate the hardcoded-hex inventory, run:

```bash
# Hardcoded hex colours
grep -rn '"#' --include="*.tsx" --include="*.ts" app components \
  | grep -v node_modules | grep -v '.test.' | grep -v '__snapshots__'

# Raw Tailwind palette utilities (e.g. text-gray-*, bg-zinc-*, border-red-*)
grep -rnE 'class(Name)?="[^"]*(text-|bg-|border-)(red|green|blue|gray|slate|zinc|neutral|amber|yellow|orange|teal|cyan|sky|indigo|violet|purple|pink|rose)-[0-9]' \
  --include="*.tsx" --include="*.ts" app components \
  | grep -v node_modules | grep -v '.test.' | grep -v '__snapshots__'
```

---

*Last updated 2026-08-10. Companion to [`design-token-mapping.md`](./design-token-mapping.md).*