import { describe, it, expect } from "vitest";
import {
  IMAGE_BUDGETS,
  IMAGE_OPTIMIZATION_CONFIG,
  validateImageAccessibility,
  getAccessibleImageProps,
  resolveImageLoadingProps,
  ImageCategory,
} from "./image-budget";

describe("IMAGE_BUDGETS", () => {
  const categories: ImageCategory[] = [
    "icon",
    "avatar",
    "thumbnail",
    "card",
    "hero",
    "og",
  ];

  it.each(categories)("defines budget and dimensions for category: %s", (category) => {
    const budget = IMAGE_BUDGETS[category];
    expect(budget).toBeDefined();
    expect(budget.maxPayloadBytes).toBeGreaterThan(0);
    expect(budget.defaultWidth).toBeGreaterThan(0);
    expect(budget.defaultHeight).toBeGreaterThan(0);
    expect(budget.approvedFormats.length).toBeGreaterThan(0);
  });

  it("enforces approved optimization formats in config", () => {
    expect(IMAGE_OPTIMIZATION_CONFIG.formats).toContain("image/webp");
    expect(IMAGE_OPTIMIZATION_CONFIG.formats).toContain("image/avif");
    expect(IMAGE_OPTIMIZATION_CONFIG.deviceSizes.length).toBeGreaterThan(0);
    expect(IMAGE_OPTIMIZATION_CONFIG.imageSizes.length).toBeGreaterThan(0);
  });
});

describe("validateImageAccessibility", () => {
  it("accepts decorative image with empty alt and aria-hidden", () => {
    const result = validateImageAccessibility({
      alt: "",
      isDecorative: true,
      ariaHidden: true,
    });
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("decorative");
  });

  it("rejects decorative image if non-empty alt is provided", () => {
    const result = validateImageAccessibility({
      alt: "Meaningful description",
      isDecorative: true,
    });
    expect(result.isValid).toBe(false);
    expect(result.type).toBe("decorative");
    expect(result.error).toContain("Decorative image should have empty alt text");
  });

  it("accepts informative image with meaningful alt text", () => {
    const result = validateImageAccessibility({
      alt: "StelloPay platform dashboard overview",
    });
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("informative");
  });

  it("rejects informative image with empty or whitespace alt text", () => {
    const result = validateImageAccessibility({
      alt: "   ",
    });
    expect(result.isValid).toBe(false);
    expect(result.type).toBe("informative");
    expect(result.error).toContain("Informative images require meaningful alt text");
  });
});

describe("getAccessibleImageProps", () => {
  it("returns empty alt and aria-hidden for decorative image", () => {
    const props = getAccessibleImageProps({ isDecorative: true, alt: "ignored" });
    expect(props).toEqual({
      alt: "",
      "aria-hidden": true,
    });
  });

  it("returns trimmed alt for informative image", () => {
    const props = getAccessibleImageProps({ alt: "  Stellar XLM logo  " });
    expect(props).toEqual({
      alt: "Stellar XLM logo",
    });
  });

  it("falls back to empty alt and aria-hidden when no alt is available", () => {
    const props = getAccessibleImageProps({});
    expect(props).toEqual({
      alt: "",
      "aria-hidden": true,
    });
  });
});

describe("resolveImageLoadingProps", () => {
  it("sets priority to true and high fetch priority for above-the-fold images", () => {
    const props = resolveImageLoadingProps("above-the-fold");
    expect(props.priority).toBe(true);
    expect(props.fetchPriority).toBe("high");
    expect(props.loading).toBeUndefined();
  });

  it("sets priority to true for lcp images", () => {
    const props = resolveImageLoadingProps("lcp");
    expect(props.priority).toBe(true);
    expect(props.fetchPriority).toBe("high");
  });

  it("sets lazy loading and priority false for below-the-fold images", () => {
    const props = resolveImageLoadingProps("below-the-fold");
    expect(props.priority).toBe(false);
    expect(props.loading).toBe("lazy");
    expect(props.fetchPriority).toBe("low");
  });
});
