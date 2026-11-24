import { describe, expect, it } from "vitest";
import robots, { DISALLOWED_PATHS } from "@/app/robots";

describe("robots route", () => {
  it.each(["/dashboard", "/transactions", "/settings", "/account-summary"])(
    "disallows the private route %s for all crawlers",
    (path) => {
      const result = robots();
      expect(DISALLOWED_PATHS).toContain(path);
      expect(result.rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userAgent: "*", disallow: expect.arrayContaining([path]) }),
        ]),
      );
    },
  );

  it("publishes the canonical sitemap URL", () => {
    expect(robots().sitemap).toBe("https://stellopay.com/sitemap.xml");
  });
});
