import { describe, expect, it } from "vitest";
import {
  JSONLD_PAYLOAD,
  SITE_DESCRIPTION,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_SAME_AS,
  SITE_URL,
} from "@/lib/seo-constants";

describe("SEO constants", () => {
  it("defines consistent canonical brand constants", () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
    expect(SITE_NAME).toBeTruthy();
    expect(SITE_DESCRIPTION).toBeTruthy();
    expect(SITE_LOGO_URL).toBe(`${SITE_URL}/logo.png`);
    expect(SITE_SAME_AS.length).toBeGreaterThan(0);
    expect(SITE_SAME_AS.every((url) => url.startsWith("https://"))).toBe(true);
  });

  it("includes required JSON-LD context and typed graph entities", () => {
    expect(JSONLD_PAYLOAD["@context"]).toBe("https://schema.org");
    expect(JSONLD_PAYLOAD["@graph"].length).toBeGreaterThan(0);
    for (const entity of JSONLD_PAYLOAD["@graph"]) {
      expect(entity["@type"]).toBeDefined();
    }
  });

  it("is JSON-serialisable", () => {
    expect(() => JSON.stringify(JSONLD_PAYLOAD)).not.toThrow();
    expect(JSON.parse(JSON.stringify(JSONLD_PAYLOAD))).toEqual(JSONLD_PAYLOAD);
  });
});
