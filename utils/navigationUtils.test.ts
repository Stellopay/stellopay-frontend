import { describe, expect, it } from "vitest";

import {
  getActiveLinkLayoutId,
  isLinkActive,
  shouldExpandSidebar,
} from "@/utils/navigationUtils";

describe("isLinkActive", () => {
  describe("root route", () => {
    it("matches when pathname is exactly the root", () => {
      expect(isLinkActive("/", "/")).toBe(true);
    });

    it("does not match a non-root pathname", () => {
      expect(isLinkActive("/", "/dashboard")).toBe(false);
    });
  });

  describe("exact match", () => {
    it("matches when pathname equals the route", () => {
      expect(isLinkActive("/dashboard", "/dashboard")).toBe(true);
      expect(isLinkActive("/settings/preferences", "/settings/preferences")).toBe(
        true,
      );
    });
  });

  describe("nested match", () => {
    it("matches a child route nested under the link's route", () => {
      expect(isLinkActive("/settings", "/settings/preferences")).toBe(true);
    });

    it("matches a deeply nested child route", () => {
      expect(
        isLinkActive("/settings/preferences", "/settings/preferences/theme"),
      ).toBe(true);
    });
  });

  describe("similar-but-unrelated paths", () => {
    it("does not match a route that merely shares a prefix", () => {
      expect(isLinkActive("/settings", "/settings-old")).toBe(false);
    });

    it("does not match a sibling route with a shared prefix", () => {
      expect(isLinkActive("/transactions", "/transactions-archive")).toBe(
        false,
      );
    });

    it("does not match an unrelated route", () => {
      expect(isLinkActive("/settings", "/help/support")).toBe(false);
    });
  });
});

describe("shouldExpandSidebar", () => {
  it("expands on mobile regardless of sidebar state", () => {
    expect(shouldExpandSidebar(true, false)).toBe(true);
    expect(shouldExpandSidebar(true, true)).toBe(true);
  });

  it("expands on desktop only when the sidebar is open", () => {
    expect(shouldExpandSidebar(false, true)).toBe(true);
    expect(shouldExpandSidebar(false, false)).toBe(false);
  });
});

describe("getActiveLinkLayoutId", () => {
  it("returns the mobile layout id on mobile", () => {
    expect(getActiveLinkLayoutId(true, true)).toBe("activeLink-mobile");
    expect(getActiveLinkLayoutId(true, false)).toBe("activeLink-mobile");
  });

  it("returns the desktop layout id when expanded", () => {
    expect(getActiveLinkLayoutId(false, true)).toBe("activeLink-desktop");
  });

  it("returns the collapsed layout id when not expanded", () => {
    expect(getActiveLinkLayoutId(false, false)).toBe("activeLink-collapsed");
  });
});
