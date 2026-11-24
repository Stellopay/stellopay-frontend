const { describe, expect, it } = require("vitest");
const { isNodeVersionSatisfied } = require("./check-package-manager");

describe("isNodeVersionSatisfied", () => {
  it("accepts Node 20.9.0 and newer", () => {
    expect(isNodeVersionSatisfied("20.9.0", ">=20.9.0")).toBe(true);
    expect(isNodeVersionSatisfied("22.1.0", ">=20.9.0")).toBe(true);
  });

  it("rejects Node older than 20.9.0", () => {
    expect(isNodeVersionSatisfied("20.8.1", ">=20.9.0")).toBe(false);
    expect(isNodeVersionSatisfied("18.20.8", ">=20.9.0")).toBe(false);
  });

  it("rejects malformed versions and ranges", () => {
    expect(isNodeVersionSatisfied("not-a-version", ">=20.9.0")).toBe(false);
    expect(isNodeVersionSatisfied("20.9.0", "20.9.0")).toBe(false);
  });
});
