/**
 * Security and Activity Audit Log type definitions.
 *
 * Defines the schema for append-only audit events stored locally
 * in versioned safeStorage, tracking security-sensitive user actions
 * (wallet connections, credentials, 2FA, and API keys).
 */

export type AuditEventType =
  | "wallet_connected"
  | "wallet_disconnected"
  | "password_changed"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "api_key_created"
  | "api_key_revoked"
  | "api_key_rotated";

export type AuditEventSeverity = "info" | "warning" | "critical";

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO 8601 UTC
  type: AuditEventType;
  summary: string;
  severity?: AuditEventSeverity;
  details?: Record<string, string | number | boolean | null | undefined>;
}

export type AuditEventInput = {
  type: AuditEventType;
  summary: string;
  severity?: AuditEventSeverity;
  details?: Record<string, unknown>;
  timestamp?: string;
  id?: string;
};

export interface AuditLogFilterOptions {
  type?: AuditEventType | "all";
  startDate?: string | null;
  endDate?: string | null;
  searchQuery?: string;
}
