/**
 * Mock support tickets for demo and development purposes.
 * Represents typical ticket states across the support lifecycle.
 */

import { SupportTicket } from "@/types/support";

export const DEMO_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "TKT-2024-001",
    category: "Payment & Transfers",
    subject: "Transfer failed with error code 502",
    message:
      "I attempted to send 5000 NGN to a recipient but received error 502. The funds are still in my account. Can you help investigate?",
    status: "resolved",
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    lastUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    firstName: "Chioma",
    lastName: "Okonkwo",
    email: "chioma.okonkwo@example.com",
  },
  {
    id: "TKT-2024-002",
    category: "Account Management",
    subject: "Unable to update profile picture",
    message:
      "The profile picture upload keeps failing. I've tried multiple times with different image formats (JPG, PNG) but always get an error.",
    status: "in-progress",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    lastUpdatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    firstName: "Chioma",
    lastName: "Okonkwo",
    email: "chioma.okonkwo@example.com",
  },
  {
    id: "TKT-2024-003",
    category: "Security & Privacy",
    subject: "Suspicious login attempt",
    message:
      "I received an alert for a sign-in attempt from a location I don't recognize. I enabled 2FA but want to confirm if my account is secure.",
    status: "open",
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    lastUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    firstName: "Chioma",
    lastName: "Okonkwo",
    email: "chioma.okonkwo@example.com",
  },
];

/**
 * Gets mock support tickets for the current user.
 * In production, this would fetch from an API with proper authentication.
 *
 * @returns Array of support tickets for demo purposes
 */
export function getDemoSupportTickets(): SupportTicket[] {
  return DEMO_SUPPORT_TICKETS;
}
