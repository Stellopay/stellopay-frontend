import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useArchivedTransactions } from "./useArchivedTransactions";
import { safeStorage } from "utils/safeStorage";

describe("useArchivedTransactions", () => {
  beforeEach(() => {
    safeStorage.clear();
  });

  it("starts with empty archived ids and showArchived false", () => {
    const { result } = renderHook(() => useArchivedTransactions("addr1"));
    expect(result.current.archivedIds.size).toBe(0);
    expect(result.current.showArchived).toBe(false);
  });

  it("archives and unarchives transactions", () => {
    const { result } = renderHook(() => useArchivedTransactions("addr1"));

    act(() => {
      result.current.archiveTransactions(["tx-1", "tx-2"]);
    });

    expect(result.current.isArchived("tx-1")).toBe(true);
    expect(result.current.archivedIds.has("tx-2")).toBe(true);

    act(() => {
      result.current.unarchiveTransactions(["tx-1"]);
    });

    expect(result.current.isArchived("tx-1")).toBe(false);
    expect(result.current.isArchived("tx-2")).toBe(true);
  });

  it("toggles showArchived state", () => {
    const { result } = renderHook(() => useArchivedTransactions("addr1"));

    act(() => {
      result.current.setShowArchived(true);
    });

    expect(result.current.showArchived).toBe(true);
  });
});
