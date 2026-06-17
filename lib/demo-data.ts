import type { StatCardItem } from "@/types/landing";

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
 * Landing page marketing metrics, marked as illustrative placeholder statistics.
 */
export const ILLUSTRATIVE_STATS: StatCardItem[] = [
  { value: "$2.5B+", label: "Transaction Volume" },
  { value: "150K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "<3s", label: "Transaction Speed" },
];
