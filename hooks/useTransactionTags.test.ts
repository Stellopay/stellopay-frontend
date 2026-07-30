import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTransactionTags } from "./useTransactionTags";

const storage: Record<string, string> = {};

vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
      return true;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
      return true;
    }),
  },
}));

describe("useTransactionTags", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  });

  it("starts with no tags and no assignments", () => {
    const { result } = renderHook(() => useTransactionTags());
    expect(result.current.allTags).toEqual([]);
    expect(result.current.assignments).toEqual({});
  });

  it("adds a tag and returns it", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Rent");
    });
    expect(tag!.name).toBe("Rent");
    expect(result.current.allTags).toHaveLength(1);
    expect(result.current.allTags[0].name).toBe("Rent");
  });

  it("does not create duplicate tags (case-insensitive)", () => {
    const { result } = renderHook(() => useTransactionTags());
    act(() => {
      result.current.addTag("Rent");
      result.current.addTag("rent");
    });
    expect(result.current.allTags).toHaveLength(1);
  });

  it("assigns a tag to a transaction", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Rent");
    });
    act(() => {
      result.current.assignTag("TX-1", tag!.id);
    });
    const txTags = result.current.getTagsForTransaction("TX-1");
    expect(txTags).toHaveLength(1);
    expect(txTags[0].name).toBe("Rent");
  });

  it("unassigns a tag from a transaction", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Rent");
    });
    act(() => {
      result.current.assignTag("TX-1", tag!.id);
    });
    act(() => {
      result.current.unassignTag("TX-1", tag!.id);
    });
    expect(result.current.getTagsForTransaction("TX-1")).toHaveLength(0);
  });

  it("removes a tag and cleans up assignments", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Rent");
    });
    act(() => {
      result.current.assignTag("TX-1", tag!.id);
    });
    act(() => {
      result.current.removeTag(tag!.id);
    });
    expect(result.current.allTags).toHaveLength(0);
    expect(result.current.getTagsForTransaction("TX-1")).toHaveLength(0);
  });

  it("renames a tag", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Rent");
    });
    act(() => {
      result.current.renameTag(tag!.id, "Lease");
    });
    expect(result.current.allTags[0].name).toBe("Lease");
  });

  it("getTagNamesForTransaction returns tag names", () => {
    const { result } = renderHook(() => useTransactionTags());
    let tag;
    act(() => {
      tag = result.current.addTag("Subscription");
    });
    act(() => {
      result.current.assignTag("TX-1", tag!.id);
    });
    const names = result.current.getTagNamesForTransaction("TX-1");
    expect(names).toEqual(["Subscription"]);
  });

  it("persists tags across hook re-mounts via safeStorage", () => {
    const { result: first } = renderHook(() => useTransactionTags());
    act(() => {
      first.current.addTag("Payroll");
    });
    const { result: second } = renderHook(() => useTransactionTags());
    expect(second.current.allTags).toHaveLength(1);
    expect(second.current.allTags[0].name).toBe("Payroll");
  });
});
