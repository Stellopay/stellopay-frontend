import { describe, expect, it } from "vitest";
import { landingStructuredData } from "@/app/structured-data";

describe("landing structured data", () => {
  it("has the schema context and typed graph entities", () => {
    expect(landingStructuredData["@context"]).toBe("https://schema.org");
    expect(landingStructuredData["@graph"].length).toBeGreaterThan(0);
    for (const entity of landingStructuredData["@graph"]) {
      expect(entity["@type"]).toBeDefined();
    }
  });

  it("is JSON-serialisable", () => {
    expect(() => JSON.stringify(landingStructuredData)).not.toThrow();
    expect(JSON.parse(JSON.stringify(landingStructuredData))).toEqual(landingStructuredData);
  });
});
