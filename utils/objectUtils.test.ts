import { describe, expect, it } from "vitest";
import { isShallowEqual } from "./objectUtils";

describe("isShallowEqual", () => {
  it("returns true for the same object reference", () => {
    const obj = { a: 1 };
    expect(isShallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for two objects with identical flat values", () => {
    expect(isShallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("returns false when a value differs", () => {
    expect(isShallowEqual({ a: 1, b: "x" }, { a: 1, b: "y" })).toBe(false);
  });

  it("returns false when key counts differ", () => {
    expect(isShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false when a key is missing on one side", () => {
    expect(
      isShallowEqual(
        { a: 1, b: 2 } as Record<string, number>,
        { a: 1, c: 2 } as Record<string, number>,
      ),
    ).toBe(false);
  });

  it("treats boolean values correctly", () => {
    expect(isShallowEqual({ flag: true }, { flag: true })).toBe(true);
    expect(isShallowEqual({ flag: true }, { flag: false })).toBe(false);
  });

  it("distinguishes NaN correctly via Object.is semantics", () => {
    expect(isShallowEqual({ n: NaN }, { n: NaN })).toBe(true);
  });

  it("distinguishes +0 and -0 via Object.is semantics", () => {
    expect(isShallowEqual({ n: 0 }, { n: -0 })).toBe(false);
  });
});
