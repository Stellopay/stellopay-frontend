import { describe, it, expect } from "vitest";
import { duration, easing, transition, variants, resolveVariants } from "./motion";

describe("motion duration tokens", () => {
  it("defines fast as 0.2", () => {
    expect(duration.fast).toBe(0.2);
  });

  it("defines base as 0.3", () => {
    expect(duration.base).toBe(0.3);
  });

  it("defines slow as 0.5", () => {
    expect(duration.slow).toBe(0.5);
  });

  it("defines xslow as 0.6", () => {
    expect(duration.xslow).toBe(0.6);
  });

  it("lists four duration tokens", () => {
    expect(Object.keys(duration)).toHaveLength(4);
  });
});

describe("motion easing tokens", () => {
  it("defines easeOut as a 4-element cubic bezier array", () => {
    expect(easing.easeOut).toHaveLength(4);
    expect(easing.easeOut[0]).toBe(0.16);
  });

  it("defines easeInOut as a 4-element cubic bezier array", () => {
    expect(easing.easeInOut).toHaveLength(4);
    expect(easing.easeInOut[0]).toBe(0.65);
  });
});

describe("transition presets", () => {
  it("fast uses duration.fast with easeOut", () => {
    expect(transition.fast.duration).toBe(duration.fast);
    expect(transition.fast.ease).toBe(easing.easeOut);
  });

  it("base uses duration.base with easeInOut", () => {
    expect(transition.base.duration).toBe(duration.base);
    expect(transition.base.ease).toBe(easing.easeInOut);
  });

  it("slow uses duration.slow with easeOut", () => {
    expect(transition.slow.duration).toBe(duration.slow);
    expect(transition.slow.ease).toBe(easing.easeOut);
  });

  it("spring has type spring with bounce 0.2 and duration xslow", () => {
    expect(transition.spring.type).toBe("spring");
    expect(transition.spring.bounce).toBe(0.2);
    expect(transition.spring.duration).toBe(duration.xslow);
  });
});

describe("variants", () => {
  describe("fadeOnly", () => {
    it("fades from opacity 0 to 1 without y-transform", () => {
      expect(variants.fadeOnly.hidden).toEqual({ opacity: 0 });
      expect(variants.fadeOnly.visible).toEqual({ opacity: 1 });
    });
  });

  describe("fadeSlideUp", () => {
    it("slides up from y=20 with opacity 0 to y=0 with opacity 1", () => {
      expect(variants.fadeSlideUp.hidden).toEqual({ opacity: 0, y: 20 });
      expect(variants.fadeSlideUp.visible).toEqual({ opacity: 1, y: 0 });
    });
  });

  describe("fadeSlideDown", () => {
    it("animates from height 0 to auto with opacity", () => {
      expect(variants.fadeSlideDown.hidden).toEqual({ height: 0, opacity: 0 });
      expect(variants.fadeSlideDown.visible).toEqual({ height: "auto", opacity: 1 });
    });
  });
});

describe("resolveVariants", () => {
  it("returns fade-only variants when prefersReduced is true", () => {
    const v = resolveVariants(true);
    expect(v.hidden).toEqual({ opacity: 0 });
    expect(v.visible.opacity).toBe(1);
    expect(v.visible.transition).toEqual({ duration: 0 });
  });

  it("returns animated fadeSlideUp variants when prefersReduced is false", () => {
    const v = resolveVariants(false);
    expect(v.hidden).toEqual({ opacity: 0, y: 20 });
    expect(v.visible.opacity).toBe(1);
    expect(v.visible.y).toBe(0);
    expect(v.visible.transition.duration).toBe(duration.slow);
  });

  it("applies the provided delay to the visible transition", () => {
    const v = resolveVariants(false, 0.3);
    expect(v.visible.transition.delay).toBe(0.3);
  });
});