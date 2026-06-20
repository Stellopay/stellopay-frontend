import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { safeStorage } from "./safeStorage";

describe("safeStorage", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe("Server-side (no window)", () => {
    beforeEach(() => {
      // @ts-ignore
      delete global.window;
    });

    it("getItem returns null", () => {
      expect(safeStorage.getItem("key")).toBeNull();
    });

    it("setItem does nothing", () => {
      expect(() => safeStorage.setItem("key", "value")).not.toThrow();
    });

    it("removeItem does nothing", () => {
      expect(() => safeStorage.removeItem("key")).not.toThrow();
    });
  });

  describe("Client-side (window exists)", () => {
    beforeEach(() => {
      global.window = {
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      } as any;
    });

    it("getItem returns value from localStorage", () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue("value");
      expect(safeStorage.getItem("key")).toBe("value");
      expect(window.localStorage.getItem).toHaveBeenCalledWith("key");
    });

    it("getItem catches errors and returns null", () => {
      vi.mocked(window.localStorage.getItem).mockImplementation(() => {
        throw new Error("Quota Exceeded");
      });
      expect(safeStorage.getItem("key")).toBeNull();
    });

    it("setItem calls localStorage.setItem", () => {
      safeStorage.setItem("key", "value");
      expect(window.localStorage.setItem).toHaveBeenCalledWith("key", "value");
    });

    it("setItem catches errors", () => {
      vi.mocked(window.localStorage.setItem).mockImplementation(() => {
        throw new Error("Quota Exceeded");
      });
      expect(() => safeStorage.setItem("key", "value")).not.toThrow();
    });

    it("removeItem calls localStorage.removeItem", () => {
      safeStorage.removeItem("key");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("key");
    });

    it("removeItem catches errors", () => {
      vi.mocked(window.localStorage.removeItem).mockImplementation(() => {
        throw new Error("Access Denied");
      });
      expect(() => safeStorage.removeItem("key")).not.toThrow();
    });
  });
});
