import type { StatCardItem } from "@/types/landing";
import type { PendingInvite, TeamMember } from "@/types/team";

/**
 * @file demo-data.ts
 * @description Centralized placeholder demo data and illustrative landing stats.
 * This ensures no realistic personal identifiable information (PII) or fake
 * trust signals are hardcoded inside individual UI components.
 *
 * NOTE: These values are placeholders pending full backend integration.
 */

/**
 * Demo profile placeholder data.
 */
export const DEMO_PROFILE = {
  firstName: "Demo",
  lastName: "User",
  displayName: "Demo User",
  email: "user@example.com",
  timezone: "Africa/Lagos",
  currency: "USD",
  legalEntity: "Demo Labs Inc.",
  billingCountry: "United States",
} as const;

/**
 * Demo security and recovery placeholder contacts.
 */
export const DEMO_SECURITY = {
  primaryEmail: "user@example.com",
  backupContact: "+1 555 0100", // Standard safe US placeholder phone number
  recoveryCodesStatus: "generated and stored offline",
} as const;

/**
 * Demo connected wallets with clearly redacted/placeholder addresses.
 */
export const DEMO_WALLETS = [
  {
    name: "Primary Treasury",
    network: "Stellar Mainnet",
    address: "GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX",
    status: "Default settlement wallet",
  },
  {
    name: "Operations Wallet",
    network: "Starknet",
    address: "0x-REDACTED-DEMO-STARKNET-ADDRESS-XXXX",
    status: "Approvals required for outbound transfers",
  },
] as const;

/**
 * Demo connected third-party OAuth applications, marked as illustrative
 * placeholder data pending real OAuth-provider integration.
 */
export const DEMO_CONNECTED_APPS = [
  {
    id: "app-budgeting-buddy",
    name: "Budgeting Buddy",
    scopes: ["Read account balance", "Read transaction history"],
    authorizedAt: "2026-03-14",
  },
  {
    id: "app-tax-helper",
    name: "TaxHelper Pro",
    scopes: ["Read transaction history", "Export statements"],
    authorizedAt: "2026-05-02",
  },
  {
    id: "app-ledger-sync",
    name: "LedgerSync",
    scopes: ["Read account balance", "Read-only reporting"],
    authorizedAt: "2026-06-21",
  },
] as const;

/**
 * Landing page marketing metrics, marked as illustrative placeholder statistics.
 */
export const ILLUSTRATIVE_STATS: StatCardItem[] = [
  { value: "$2.5B+", label: "Transaction Volume" },
  { value: "150K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "<3s", label: "Transaction Speed" },
];

/**
 * Demo team members placeholder fixtures clearly flagged as illustrative data
 * pending backend RBAC integration.
 */
export const DEMO_TEAM_MEMBERS: readonly TeamMember[] = [
  {
    id: "member-owner-1",
    name: "Demo Owner (Placeholder)",
    email: "owner.demo@example.com",
    role: "Owner",
    joinedAt: "2026-01-10",
    isCurrentUser: true,
  },
  {
    id: "member-admin-1",
    name: "Demo Admin (Placeholder)",
    email: "admin.demo@example.com",
    role: "Admin",
    joinedAt: "2026-02-14",
  },
  {
    id: "member-finance-1",
    name: "Demo Finance Lead (Placeholder)",
    email: "finance.demo@example.com",
    role: "Finance",
    joinedAt: "2026-03-05",
  },
  {
    id: "member-viewer-1",
    name: "Demo Auditor (Placeholder)",
    email: "viewer.demo@example.com",
    role: "Viewer",
    joinedAt: "2026-04-20",
  },
] as const;

/**
 * Demo pending team invitations placeholder fixtures clearly flagged as
 * illustrative data pending email delivery integration.
 */
export const DEMO_PENDING_INVITES: readonly PendingInvite[] = [
  {
    id: "invite-pending-1",
    email: "pending.payroll.demo@example.com",
    role: "Finance",
    invitedAt: "2026-06-18",
    invitedBy: "owner.demo@example.com",
  },
  {
    id: "invite-pending-2",
    email: "pending.observer.demo@example.com",
    role: "Viewer",
    invitedAt: "2026-06-22",
    invitedBy: "admin.demo@example.com",
  },
] as const;
