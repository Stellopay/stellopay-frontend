/**
 * app/opengraph-image.test.ts
 *
 * Unit tests for the dynamic Open Graph image route.
 *
 * Strategy
 * ────────
 * `next/og`'s `ImageResponse` calls Canvas/Satori APIs that are unavailable in
 * jsdom.  We mock the entire module and capture the JSX tree passed to the
 * constructor so we can assert on content, colours, and structure without
 * starting a full Next.js server.
 *
 * What IS tested
 *   ✓  Exported metadata (size, contentType) match the OG spec
 *   ✓  Exported constants (BRAND_GRADIENT, COLORS, COPY) are correct
 *   ✓  OGImage() resolves and calls ImageResponse with correct dimensions
 *   ✓  ImageResponse receives the headline prefix, gradient word, suffix
 *   ✓  ImageResponse receives the tagline copy
 *   ✓  ImageResponse receives the brand badge text
 *   ✓  Brand gradient colours are applied to the gradient headline span
 *   ✓  Background colour matches COLORS.background
 *   ✓  Muted colour is used on the tagline
 *   ✓  Font is loaded from the expected file path when fs.readFile succeeds
 *   ✓  Falls back to no font when fs.readFile rejects (edge case)
 *   ✓  ImageResponse receives fonts array with ClashDisplay entry when font loads
 *   ✓  ImageResponse receives empty fonts array when font fails to load
 *
 * What is NOT tested here
 *   ✗  Actual pixel output (requires a running Satori renderer)
 *   ✗  Network delivery / Content-Type header (integration / E2E concern)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ─── Mock next/font (hoisted to top level to satisfy vitest) ───── */
// These are required for the layout.tsx import in the "metadata wiring" suite.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-local" }),
}));

/* ─── Mock next/og ─────────────────────────────────────────────── */

// Capture every call to `new ImageResponse(element, options)` for inspection.
const imageResponseCalls: Array<{
  element: unknown;
  options: { width?: number; height?: number; fonts?: unknown[] };
}> = [];

vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    constructor(
      element: unknown,
      options: { width?: number; height?: number; fonts?: unknown[] }
    ) {
      imageResponseCalls.push({ element, options });
    }
  },
}));

/* ─── Mock node:fs/promises ────────────────────────────────────── */

// Default: successful font read returning a fake ArrayBuffer.
const fakeBuffer = new ArrayBuffer(8);

// Use a plain object so the factory can close over it and tests can mutate .impl
const fsMock = {
  readFile: vi.fn().mockResolvedValue({ buffer: fakeBuffer }),
};

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    default: {
      ...actual,
      readFile: (...args: Parameters<typeof actual["readFile"]>) =>
        fsMock.readFile(...args),
    },
    readFile: (...args: Parameters<typeof actual["readFile"]>) =>
      fsMock.readFile(...args),
  };
});

/* ─── Mock node:path ───────────────────────────────────────────── */

vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:path")>();
  return {
    ...actual,
    default: {
      ...actual,
      join: (...parts: string[]) => parts.join("/"),
    },
    join: (...parts: string[]) => parts.join("/"),
  };
});

/* ─── Imports (after mocks) ────────────────────────────────────── */

import OGImage, {
  size,
  contentType,
  BRAND_GRADIENT,
  COLORS,
  COPY,
} from "@/app/opengraph-image";

/* ─── Helpers ──────────────────────────────────────────────────── */

/**
 * Recursively flattens a Satori/React JSX element tree into a flat array of
 * nodes, making it easy to assert that a particular node exists anywhere in
 * the tree without knowing the exact nesting.
 */
function flattenJSX(node: unknown): unknown[] {
  if (node === null || node === undefined) return [];
  if (typeof node !== "object") return [node];

  const obj = node as Record<string, unknown>;

  // React element shape: { type, props: { children, style, ... } }
  const result: unknown[] = [node];
  const props = obj.props as Record<string, unknown> | undefined;
  if (props) {
    const children = props.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        result.push(...flattenJSX(child));
      }
    } else if (children !== undefined) {
      result.push(...flattenJSX(children));
    }
  }
  return result;
}

/**
 * Find all text content nodes (primitive strings / numbers) in the tree.
 */
function collectText(node: unknown): string[] {
  return flattenJSX(node)
    .filter((n) => typeof n === "string" || typeof n === "number")
    .map(String);
}

/**
 * Find all `style` objects in the tree.
 */
function collectStyles(node: unknown): Record<string, unknown>[] {
  return flattenJSX(node)
    .filter(
      (n) =>
        n !== null &&
        typeof n === "object" &&
        (n as Record<string, unknown>).props !== undefined &&
        typeof (n as Record<string, unknown>).props === "object" &&
        (
          (n as Record<string, unknown>).props as Record<string, unknown>
        ).style !== undefined
    )
    .map(
      (n) =>
        (
          (n as Record<string, unknown>).props as Record<string, unknown>
        ).style as Record<string, unknown>
    );
}

/* ─── Test suites ──────────────────────────────────────────────── */

describe("opengraph-image exports", () => {
  describe("size", () => {
    it("has width 1200", () => {
      expect(size.width).toBe(1200);
    });

    it("has height 630", () => {
      expect(size.height).toBe(630);
    });
  });

  describe("contentType", () => {
    it('is "image/png"', () => {
      expect(contentType).toBe("image/png");
    });
  });

  describe("BRAND_GRADIENT", () => {
    it("from is #2563EB (blue-600)", () => {
      expect(BRAND_GRADIENT.from).toBe("#2563EB");
    });

    it("via is #7C3AED (violet-700)", () => {
      expect(BRAND_GRADIENT.via).toBe("#7C3AED");
    });

    it("to is #059669 (emerald-600)", () => {
      expect(BRAND_GRADIENT.to).toBe("#059669");
    });
  });

  describe("COLORS", () => {
    it("background is white", () => {
      expect(COLORS.background).toBe("#FFFFFF");
    });

    it("foreground is near-black", () => {
      expect(COLORS.foreground).toBe("#09090B");
    });

    it("muted matches hero muted text colour", () => {
      expect(COLORS.muted).toBe("#52525B");
    });
  });

  describe("COPY", () => {
    it("headlinePrefix matches hero h1 first line", () => {
      expect(COPY.headlinePrefix).toBe("The Future of");
    });

    it("headlineGradient matches hero h1 gradient span", () => {
      expect(COPY.headlineGradient).toBe("Payroll on");
    });

    it("headlineSuffix matches hero h1 third line", () => {
      expect(COPY.headlineSuffix).toBe("Blockchain");
    });

    it("tagline matches hero paragraph copy", () => {
      expect(COPY.tagline).toContain("Built for modern businesses");
      expect(COPY.tagline).toContain("global payments");
      expect(COPY.tagline).toContain("blockchain technology");
    });

    it("brand is StelloPay", () => {
      expect(COPY.brand).toBe("StelloPay");
    });
  });
});

describe("OGImage route handler", () => {
  beforeEach(() => {
    imageResponseCalls.length = 0;
    fsMock.readFile.mockClear();
    fsMock.readFile.mockResolvedValue({ buffer: fakeBuffer });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves without throwing", async () => {
    await expect(OGImage()).resolves.toBeDefined();
  });

  it("calls ImageResponse exactly once", async () => {
    await OGImage();
    expect(imageResponseCalls).toHaveLength(1);
  });

  describe("dimensions", () => {
    it("passes width 1200 to ImageResponse options", async () => {
      await OGImage();
      expect(imageResponseCalls[0].options.width).toBe(1200);
    });

    it("passes height 630 to ImageResponse options", async () => {
      await OGImage();
      expect(imageResponseCalls[0].options.height).toBe(630);
    });

    it("options spread matches the exported size constant", async () => {
      await OGImage();
      expect(imageResponseCalls[0].options).toMatchObject(size);
    });
  });

  describe("headline content", () => {
    it("includes the headline prefix", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.headlinePrefix);
    });

    it("includes the gradient word", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.headlineGradient);
    });

    it("includes the headline suffix", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.headlineSuffix);
    });
  });

  describe("tagline content", () => {
    it("includes the full tagline string", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.tagline);
    });
  });

  describe("brand badge content", () => {
    it("includes the brand name", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.brand);
    });

    it("includes the badge sub-label", async () => {
      await OGImage();
      const texts = collectText(imageResponseCalls[0].element);
      expect(texts).toContain(COPY.badgeSub);
    });
  });

  describe("design tokens", () => {
    it("root container uses white background", async () => {
      await OGImage();
      const styles = collectStyles(imageResponseCalls[0].element);
      const rootStyle = styles.find(
        (s) => s.background === COLORS.background
      );
      expect(rootStyle).toBeDefined();
    });

    it("gradient span references all three brand gradient stops", async () => {
      await OGImage();
      const styles = collectStyles(imageResponseCalls[0].element);
      const gradientStyle = styles.find(
        (s) =>
          typeof s.background === "string" &&
          s.background.includes(BRAND_GRADIENT.from) &&
          s.background.includes(BRAND_GRADIENT.via) &&
          s.background.includes(BRAND_GRADIENT.to)
      );
      expect(gradientStyle).toBeDefined();
    });

    it("tagline uses the muted colour", async () => {
      await OGImage();
      const styles = collectStyles(imageResponseCalls[0].element);
      const mutedStyle = styles.find((s) => s.color === COLORS.muted);
      expect(mutedStyle).toBeDefined();
    });
  });

  describe("font loading", () => {
    it("reads the Clash Display font from public/font", async () => {
      await OGImage();
      expect(fsMock.readFile).toHaveBeenCalledOnce();
      const calledPath: string = fsMock.readFile.mock.calls[0][0] as string;
      expect(calledPath).toContain("clash-display-variable.ttf");
      expect(calledPath).toContain("font");
    });

    it("passes a fonts array with ClashDisplay when font loads", async () => {
      await OGImage();
      const { fonts } = imageResponseCalls[0].options;
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts).toHaveLength(1);
      const font = fonts![0] as {
        name: string;
        data: ArrayBuffer;
        weight: number;
        style: string;
      };
      expect(font.name).toBe("ClashDisplay");
      expect(font.weight).toBe(700);
      expect(font.style).toBe("normal");
      // The ArrayBuffer comes from the mock — compare by deep equality (same bytes)
      expect(font.data).toEqual(fakeBuffer);
    });

    it("passes an empty fonts array when font fails to load", async () => {
      fsMock.readFile.mockRejectedValueOnce(new Error("ENOENT"));
      await OGImage();
      const { fonts } = imageResponseCalls[0].options;
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts).toHaveLength(0);
    });

    it("still renders the image when the font file is missing", async () => {
      fsMock.readFile.mockRejectedValueOnce(new Error("ENOENT"));
      await expect(OGImage()).resolves.toBeDefined();
    });
  });
});

describe("metadata wiring (layout.tsx)", () => {
  /**
   * These tests import the layout metadata directly to assert that the OG
   * image URL has been updated to the dynamic route.  The font mocks at the
   * top of this file cover the `localFont` calls inside layout.tsx.
   */

  it("openGraph.images[0].url points to the dynamic /opengraph-image route", async () => {
    const { metadata } = await import("@/app/layout");
    const og = metadata.openGraph as {
      images?: Array<{ url: string }> | string[];
    };
    const images = og?.images as Array<{ url: string }> | undefined;
    expect(images).toBeDefined();
    expect(Array.isArray(images)).toBe(true);
    const firstImage = images![0];
    expect(firstImage.url).toBe("/opengraph-image");
  });

  it("openGraph.images[0] has WCAG-compliant alt text describing the image", async () => {
    const { metadata } = await import("@/app/layout");
    const og = metadata.openGraph as {
      images?: Array<{ alt?: string }>;
    };
    const images = og?.images as Array<{ alt?: string }> | undefined;
    const alt = images?.[0]?.alt ?? "";
    expect(alt.length).toBeGreaterThan(10);
    // Alt text should describe meaningful content, not be a generic placeholder
    expect(alt).not.toBe("StelloPay Preview Image");
  });

  it("openGraph title includes the hero headline", async () => {
    const { metadata } = await import("@/app/layout");
    const og = metadata.openGraph as { title?: string };
    expect(og?.title).toContain("Future of Payroll");
  });

  it("twitter card is summary_large_image", async () => {
    const { metadata } = await import("@/app/layout");
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("twitter images reference the dynamic /opengraph-image route", async () => {
    const { metadata } = await import("@/app/layout");
    const twitterImages = metadata.twitter?.images;
    // Images can be a string[], string, MetadataRoute.TwitterImage[], or TwitterImage
    const firstImage = Array.isArray(twitterImages)
      ? twitterImages[0]
      : twitterImages;
    if (typeof firstImage === "string") {
      expect(firstImage).toBe("/opengraph-image");
    } else if (firstImage && typeof firstImage === "object") {
      expect((firstImage as { url?: string }).url).toBe("/opengraph-image");
    } else {
      // If the shape is unexpected, fail with a descriptive message
      throw new Error(
        `Unexpected twitter.images shape: ${JSON.stringify(twitterImages)}`
      );
    }
  });
});
