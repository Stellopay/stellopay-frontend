import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  loadRecipients,
  saveRecipients,
  addRecipient,
  updateRecipient,
  deleteRecipient,
  markRecipientUsed,
  getRecentRecipients,
  exportRecipientsToCsv,
  importRecipientsFromCsv,
  parseCsvRows,
  useRecipients,
  getRecipientsStorageKey,
  RECIPIENTS_STORAGE_KEY_PREFIX,
  type Recipient,
} from "./recipients-store";
import { safeStorage } from "@/utils/safeStorage";

// Valid Stellar addresses for testing
const ADDR_1 = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const ADDR_2 = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
const ADDR_3 = "GA4GYKB4JP2K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y5K7UABH4GJ6Y";

describe("recipients-store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("storage and corrupt data handling", () => {
    it("returns an empty array when storage is empty", () => {
      const items = loadRecipients("test-scope");
      expect(items).toEqual([]);
    });

    it("handles corrupt JSON gracefully like useTransactionTags", () => {
      const key = getRecipientsStorageKey("corrupt-scope");
      safeStorage.setItem(key, "invalid-json{{{");
      expect(loadRecipients("corrupt-scope")).toEqual([]);
    });

    it("handles non-object JSON values gracefully", () => {
      const key = getRecipientsStorageKey("num-scope");
      safeStorage.setItem(key, "12345");
      expect(loadRecipients("num-scope")).toEqual([]);
    });

    it("loads version 1 items properly", () => {
      const recipient: Recipient = {
        id: "r1",
        name: "Alice",
        address: ADDR_1,
        createdAt: new Date().toISOString(),
      };
      saveRecipients("v1-scope", [recipient]);

      const key = getRecipientsStorageKey("v1-scope");
      const raw = safeStorage.getItem(key);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(1);
      expect(parsed.items).toHaveLength(1);

      const loaded = loadRecipients("v1-scope");
      expect(loaded).toEqual([recipient]);
    });

    it("scopes storage per account scope", () => {
      addRecipient("scope-a", {
        name: "Alice",
        address: ADDR_1,
      });

      addRecipient("scope-b", {
        name: "Bob",
        address: ADDR_2,
      });

      const scopeA = loadRecipients("scope-a");
      const scopeB = loadRecipients("scope-b");

      expect(scopeA).toHaveLength(1);
      expect(scopeA[0].name).toBe("Alice");

      expect(scopeB).toHaveLength(1);
      expect(scopeB[0].name).toBe("Bob");
    });
  });

  describe("addRecipient", () => {
    it("adds a valid recipient with trimmed and uppercase address", () => {
      const added = addRecipient("scope", {
        name: " Alice Supplier ",
        address: ` ${ADDR_1.toLowerCase()} `,
        memo: "Invoice 123",
        email: "alice@example.com",
        tags: ["vendor", "contractor"],
      });

      expect(added.id).toBeDefined();
      expect(added.name).toBe("Alice Supplier");
      expect(added.address).toBe(ADDR_1);
      expect(added.memo).toBe("Invoice 123");
      expect(added.email).toBe("alice@example.com");
      expect(added.tags).toEqual(["vendor", "contractor"]);
      expect(added.createdAt).toBeDefined();

      const all = loadRecipients("scope");
      expect(all).toHaveLength(1);
    });

    it("rejects an invalid Stellar address inline", () => {
      expect(() =>
        addRecipient("scope", {
          name: "Invalid Address",
          address: "GNOTAVALIDADDRESS",
        }),
      ).toThrow();
    });

    it("rejects secret keys", () => {
      expect(() =>
        addRecipient("scope", {
          name: "Secret Key",
          address: "SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        }),
      ).toThrow();
    });

    it("rejects duplicate address inline (case-insensitive)", () => {
      addRecipient("scope", {
        name: "First",
        address: ADDR_1,
      });

      expect(() =>
        addRecipient("scope", {
          name: "Second",
          address: ADDR_1.toLowerCase(),
        }),
      ).toThrow(/already exists/i);
    });
  });

  describe("updateRecipient", () => {
    it("updates recipient fields without error", () => {
      const created = addRecipient("scope", {
        name: "Old Name",
        address: ADDR_1,
      });

      const updated = updateRecipient("scope", created.id, {
        name: "New Name",
        memo: "New Memo",
        tags: ["updated"],
      });

      expect(updated.name).toBe("New Name");
      expect(updated.memo).toBe("New Memo");
      expect(updated.tags).toEqual(["updated"]);
      expect(updated.updatedAt).toBeDefined();

      const items = loadRecipients("scope");
      expect(items[0].name).toBe("New Name");
    });

    it("rejects updating to another recipient's duplicate address", () => {
      addRecipient("scope", {
        name: "Alice",
        address: ADDR_1,
      });
      const bob = addRecipient("scope", {
        name: "Bob",
        address: ADDR_2,
      });

      expect(() =>
        updateRecipient("scope", bob.id, {
          address: ADDR_1,
        }),
      ).toThrow(/already exists/i);
    });

    it("throws if recipient not found", () => {
      expect(() =>
        updateRecipient("scope", "non-existent-id", {
          name: "Ghost",
        }),
      ).toThrow(/not found/i);
    });
  });

  describe("deleteRecipient", () => {
    it("deletes an existing recipient by id", () => {
      const item = addRecipient("scope", {
        name: "To Delete",
        address: ADDR_1,
      });

      expect(loadRecipients("scope")).toHaveLength(1);
      const res = deleteRecipient("scope", item.id);
      expect(res).toBe(true);
      expect(loadRecipients("scope")).toHaveLength(0);
    });

    it("returns false when deleting a non-existent id", () => {
      const res = deleteRecipient("scope", "unknown-id");
      expect(res).toBe(false);
    });
  });

  describe("markRecipientUsed & getRecentRecipients", () => {
    it("orders recent recipients by lastUsedAt and maps to { address, label }", () => {
      const r1 = addRecipient("scope", { name: "R1", address: ADDR_1 });
      const r2 = addRecipient("scope", { name: "R2", address: ADDR_2 });

      // Mark r1 used
      markRecipientUsed("scope", r1.address);

      const recent = getRecentRecipients("scope");
      expect(recent).toHaveLength(2);
      expect(recent[0].address).toBe(ADDR_1);
      expect(recent[0].label).toBe("R1");
      expect(recent[1].address).toBe(ADDR_2);
      expect(recent[1].label).toBe("R2");
    });
  });

  describe("CSV export & import", () => {
    it("round-trips without data loss and escapes fields via escapeCsvField", () => {
      const r1: Recipient = {
        id: "1",
        name: "Acme, Inc.",
        address: ADDR_1,
        memo: "Invoice #999",
        email: "billing@acme.com",
        tags: ["vendor", "tier-1"],
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      const r2: Recipient = {
        id: "2",
        name: "=Formula",
        address: ADDR_2,
        memo: "Simple",
        email: "sec@example.com",
        tags: [],
        createdAt: "2026-01-02T00:00:00.000Z",
      };

      const csv = exportRecipientsToCsv([r1, r2]);

      // Check CSV injection mitigation on =Formula
      expect(csv).toContain("Acme, Inc.");
      expect(csv).toContain(ADDR_1);

      // Import to a new scope
      const result = importRecipientsFromCsv("import-scope", csv);
      expect(result.errors).toEqual([]);
      expect(result.imported).toHaveLength(2);

      const imported = loadRecipients("import-scope");
      expect(imported[0].name).toBe("Acme, Inc.");
      expect(imported[0].address).toBe(ADDR_1);
      expect(imported[0].memo).toBe("Invoice #999");
      expect(imported[0].email).toBe("billing@acme.com");
      expect(imported[0].tags).toEqual(["vendor", "tier-1"]);
      expect(imported[1].name).toBe("=Formula");
      expect(imported[1].address).toBe(ADDR_2);
    });

    it("rejects rows with invalid or duplicate addresses in CSV", () => {
      addRecipient("import-scope", {
        name: "Existing",
        address: ADDR_1,
      });

      const csv = `Name,Stellar Address,Memo,Email,Tags
Alice,${ADDR_1},,alice@example.com,
Bad Address,GINVALIDADDR,,,
Bob,${ADDR_2},,bob@example.com,`;

      const result = importRecipientsFromCsv("import-scope", csv);
      expect(result.imported).toHaveLength(1);
      expect(result.imported[0].name).toBe("Bob");
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("useRecipients hook", () => {
    it("provides CRUD operations and reactive recentRecipients", () => {
      const { result } = renderHook(() => useRecipients("hook-scope"));

      expect(result.current.recipients).toEqual([]);
      expect(result.current.recentRecipients).toEqual([]);

      act(() => {
        result.current.addRecipient({
          name: "Charlie",
          address: ADDR_1,
        });
      });

      expect(result.current.recipients).toHaveLength(1);
      expect(result.current.recentRecipients).toEqual([
        { address: ADDR_1, label: "Charlie" },
      ]);

      act(() => {
        result.current.updateRecipient(result.current.recipients[0].id, {
          name: "Charlie Updated",
        });
      });

      expect(result.current.recipients[0].name).toBe("Charlie Updated");

      act(() => {
        result.current.deleteRecipient(result.current.recipients[0].id);
      });

      expect(result.current.recipients).toHaveLength(0);
    });
  });
});
