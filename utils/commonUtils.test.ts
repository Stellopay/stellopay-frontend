import { describe, expect, it } from "vitest";

import { cn } from "@/utils/commonUtils";

describe("cn", () => {
  it("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("concatenates multiple string inputs", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("includes classes when object values are true", () => {
    expect(cn({ "p-4": true, "p-8": false })).toBe("p-4");
  });

  it("resolves conflicting Tailwind utilities to the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges granularly without dropping non-conflicting utilities", () => {
    expect(cn("px-4 py-2", "px-8")).toBe("py-2 px-8");
  });

  it("flattens nested arrays", () => {
    expect(cn(["p-4", "m-2"], ["p-8"])).toBe("m-2 p-8");
  });

  it("filters out falsy values (false, undefined, null, 0, empty string)", () => {
    expect(cn("p-4", false, undefined, null, 0, "", "m-2")).toBe("p-4 m-2");
  });

  it("deduplicates identical classes", () => {
    expect(cn("p-4", "p-4")).toBe("p-4");
  });
});
