import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  recordAuditEvent,
  readAuditEvents,
  clearAuditEvents,
  filterAuditEvents,
  exportAuditEventsCsv,
  sanitizeCsvCell,
  sanitizeAuditValue,
  MAX_AUDIT_LOG_EVENTS,
  AUDIT_LOG_STORAGE_KEY,
} from "./audit-log";
import { safeStorage } from "@/utils/safeStorage";
import { AuditEvent, AuditEventInput } from "@/types/audit";

describe("lib/audit-log.ts", () => {
  beforeEach(() => {
    safeStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  describe("recordAuditEvent and readAuditEvents", () => {
    it("records an event and reads it back from safeStorage", () => {
      const input: AuditEventInput = {
        type: "wallet_connected",
        summary: "Connected wallet GA4GYK...ABH4GJ",
        details: { network: "testnet" },
      };

      const event = recordAuditEvent(input);
      expect(event).not.toBeNull();
      expect(event?.type).toBe("wallet_connected");
      expect(event?.summary).toBe("Connected wallet GA4GYK...ABH4GJ");
      expect(event?.id).toBeDefined();
      expect(event?.timestamp).toBeDefined();

      const events = readAuditEvents();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(event?.id);
      expect(events[0].type).toBe("wallet_connected");
    });

    it("orders events newest-first and caps at MAX_AUDIT_LOG_EVENTS (500), dropping oldest", () => {
      // Pre-fill storage with 500 events
      const existingEvents: AuditEvent[] = Array.from({ length: 500 }, (_, i) => ({
        id: `audit_old_${i}`,
        timestamp: new Date(Date.now() - (500 - i) * 1000).toISOString(),
        type: "api_key_created",
        summary: `API Key ${i}`,
      }));

      safeStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(existingEvents));

      // Record a new 501st event
      const newest = recordAuditEvent({
        type: "password_changed",
        summary: "Password changed",
      });

      const events = readAuditEvents();
      expect(events).toHaveLength(MAX_AUDIT_LOG_EVENTS);
      expect(events[0].id).toBe(newest?.id);
      expect(events[0].summary).toBe("Password changed");

      // Oldest event should have been dropped
      const ids = events.map((e) => e.id);
      expect(ids).not.toContain("audit_old_499");
    });

    it("handles corrupt JSON in safeStorage gracefully without crashing", () => {
      safeStorage.setItem(AUDIT_LOG_STORAGE_KEY, "{ invalid json corrupt content");

      expect(() => readAuditEvents()).not.toThrow();
      expect(readAuditEvents()).toEqual([]);
    });

    it("handles non-array stored data gracefully", () => {
      safeStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify({ not: "an array" }));

      expect(readAuditEvents()).toEqual([]);
    });

    it("never throws if safeStorage.setItem throws", () => {
      vi.spyOn(safeStorage, "setItem").mockImplementation(() => {
        throw new Error("Disk quota exceeded");
      });

      expect(() => {
        const result = recordAuditEvent({
          type: "two_factor_enabled",
          summary: "Enabled 2FA",
        });
        expect(result).toBeNull();
      }).not.toThrow();
    });

    it("clears all audit events", () => {
      recordAuditEvent({
        type: "wallet_connected",
        summary: "Connected",
      });
      expect(readAuditEvents()).toHaveLength(1);

      clearAuditEvents();
      expect(readAuditEvents()).toHaveLength(0);
    });
  });

  describe("Mandatory Secret Redaction and Address Truncation", () => {
    it("redacts sensitive fields like passwords, secrets, totp, seeds, and tokens", () => {
      expect(sanitizeAuditValue("hunter2", "password")).toBe("[REDACTED]");
      expect(sanitizeAuditValue("my-secret", "newPassword")).toBe("[REDACTED]");
      expect(sanitizeAuditValue("123456", "totpCode")).toBe("[REDACTED]");
      expect(sanitizeAuditValue("jwt-token-xyz", "token")).toBe("[REDACTED]");
      expect(sanitizeAuditValue("api-secret-abc", "secretKey")).toBe("[REDACTED]");
      expect(sanitizeAuditValue("backup-1234", "backupCode")).toBe("[REDACTED]");
    });

    it("redacts Stellar secret seeds starting with S and 55 base32 chars", () => {
      const secretSeed = "SB2WXYZ6J5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6";
      expect(sanitizeAuditValue(secretSeed, "seedValue")).toBe("[REDACTED]");
      expect(sanitizeAuditValue(secretSeed, "someRandomKey")).toBe("[REDACTED]");
    });

    it("truncates full Stellar public addresses in details and summary", () => {
      const fullGAddress = "GA4GYKB4JP2K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6";
      const sanitized = sanitizeAuditValue(fullGAddress, "address");
      expect(sanitized).toBe("GA4GYK...ABH4GJ");
      expect(sanitized).not.toContain("2K7UABH4GJ6Y5K7UABH4GJ6Y5K7U");

      // Verify in recorded event
      const event = recordAuditEvent({
        type: "wallet_connected",
        summary: `Connected wallet ${fullGAddress}`,
        details: { fullAddress: fullGAddress },
      });

      expect(event?.summary).toContain("GA4GYK...ABH4GJ");
      expect(event?.summary).not.toContain(fullGAddress);
      expect(event?.details?.fullAddress).toBe("GA4GYK...ABH4GJ");
    });

    it("allows non-sensitive metadata keys like keyName, keyId, prefix", () => {
      expect(sanitizeAuditValue("My Production Key", "keyName")).toBe("My Production Key");
      expect(sanitizeAuditValue("api_key_123", "keyId")).toBe("api_key_123");
      expect(sanitizeAuditValue("sk_live_1234", "prefix")).toBe("sk_live_1234");
    });
  });

  describe("filterAuditEvents", () => {
    const mockEvents: AuditEvent[] = [
      {
        id: "1",
        timestamp: "2026-11-20T10:00:00.000Z",
        type: "wallet_connected",
        summary: "Connected wallet GA4G...H4GJ",
      },
      {
        id: "2",
        timestamp: "2026-11-22T14:00:00.000Z",
        type: "password_changed",
        summary: "Password changed successfully",
      },
      {
        id: "3",
        timestamp: "2026-11-24T08:00:00.000Z",
        type: "api_key_created",
        summary: "Created API key 'Reporting'",
        details: { keyName: "Reporting" },
      },
    ];

    it("filters by event type", () => {
      const filtered = filterAuditEvents(mockEvents, { type: "password_changed" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });

    it("filters by search query matching summary or details", () => {
      const filtered = filterAuditEvents(mockEvents, { searchQuery: "reporting" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("3");
    });

    it("filters by date range", () => {
      const filtered = filterAuditEvents(mockEvents, {
        startDate: "2026-11-21T00:00:00.000Z",
        endDate: "2026-11-23T00:00:00.000Z",
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });
  });

  describe("exportAuditEventsCsv and sanitizeCsvCell", () => {
    it("neutralizes formula injection cells starting with =, +, -, @, \\t, \\r", () => {
      expect(sanitizeCsvCell("=SUM(A1:B1)")).toBe("\"'=SUM(A1:B1)\"");
      expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");
      expect(sanitizeCsvCell("-123")).toBe("\"'-123\"");
      expect(sanitizeCsvCell("@evil")).toBe("\"'@evil\"");
    });

    it("properly escapes quotes according to RFC 4180", () => {
      expect(sanitizeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    it("exports valid CSV rows from audit events", () => {
      const events: AuditEvent[] = [
        {
          id: "audit_1",
          timestamp: "2026-11-24T12:00:00.000Z",
          type: "two_factor_enabled",
          summary: "Enabled 2FA",
          severity: "info",
        },
      ];

      const csv = exportAuditEventsCsv(events);
      expect(csv).toContain("Event ID,Timestamp (UTC),Event Type,Severity,Summary,Details");
      expect(csv).toContain('"audit_1"');
      expect(csv).toContain('"two_factor_enabled"');
      expect(csv).toContain('"Enabled 2FA"');
    });
  });
});
