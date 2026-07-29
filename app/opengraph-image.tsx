/**
 * app/opengraph-image.tsx
 *
 * Dynamic Open Graph share image for the StelloPay landing page.
 *
 * Next.js serves this file at /opengraph-image (and /twitter-image when
 * referenced from metadata) using the ImageResponse API from `next/og`.
 * The generated PNG is 1200 × 630 px — the canonical size required by the
 * Open Graph Protocol and recommended by Twitter / X for `summary_large_image`.
 *
 * Design decisions
 * ────────────────
 * • Background: white (#FFFFFF) to match the light-mode hero surface.
 * • Headline: "The Future of Payroll on Blockchain" — exact copy from hero.tsx.
 *   "Payroll on" is rendered in the same brand gradient used in the hero h1.
 * • Gradient stop colours (light palette from hero.tsx):
 *     from  #2563EB  (blue-600)
 *     via   #7C3AED  (violet-700)
 *     to    #059669  (emerald-600)
 * • Tagline below the headline matches the hero paragraph copy.
 * • Clash Display Variable font is loaded from /public/font so the rendered
 *   type is visually identical to the web page.
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * OG images are static bitmaps consumed by crawlers, not interactive elements,
 * so keyboard navigation and ARIA roles do not apply to the PNG output itself.
 * Contrast compliance is met for the rendered text:
 *   • Dark headline text (#09090B) on white (#FFFFFF) → contrast ≈ 20.7 : 1  ✓
 *   • Muted tagline (#52525B) on white (#FFFFFF)       → contrast ≈  7.0 : 1  ✓
 *   • White brand badge text (#FFFFFF) on dark (#09090B) pill → ≈ 20.7 : 1  ✓
 * Gradient headline text is decorative; the accessible alt text for any <img>
 * that displays this OG image is set in layout.tsx `openGraph.images[].alt`.
 *
 * Validation
 * ──────────
 * After deploying, validate with:
 *   • https://developers.facebook.com/tools/debug/
 *   • https://cards-dev.twitter.com/validator
 *   • https://www.opengraph.xyz/
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Canonical OG dimensions. */
export const size = { width: 1200, height: 630 };

/** Mime type declared so Next.js sets the correct Content-Type header. */
export const contentType = "image/png";

/**
 * Brand gradient colours — light-mode palette sourced from hero.tsx.
 *
 * These are exported so tests can assert the exact values without
 * duplicating the constant.
 */
export const BRAND_GRADIENT = {
  from: "#2563EB",
  via: "#7C3AED",
  to: "#059669",
} as const;

/** Background and foreground tokens matching the light-mode design. */
export const COLORS = {
  background: "#FFFFFF",
  foreground: "#09090B",
  muted: "#52525B",
  accent: "#09090B",
} as const;

/** Copy sourced from hero.tsx — kept in sync with the web page. */
export const COPY = {
  /** First line of the hero h1 */
  headlinePrefix: "The Future of",
  /** Second line — rendered in brand gradient */
  headlineGradient: "Payroll on",
  /** Third line of the hero h1 */
  headlineSuffix: "Blockchain",
  /** Hero paragraph / tagline */
  tagline:
    "Built for modern businesses. Designed for global payments.\nPowered by blockchain technology.",
  /** Short brand name shown in the badge */
  brand: "StelloPay",
  /** Badge sub-label */
  badgeSub: "Blockchain Payroll",
} as const;

/**
 * Load the Clash Display Variable font from `public/font`.
 *
 * `next/og` accepts an `ArrayBuffer` via the `fonts` option.
 * We read the file at route-invocation time (edge / Node.js runtime).
 * The path resolves relative to the project root via `process.cwd()`.
 *
 * Returns `null` when the font file cannot be read (e.g. in unit tests where
 * the file system may not be available), allowing the image to fall back to
 * the default sans-serif typeface gracefully.
 */
async function loadClashDisplay(): Promise<ArrayBuffer | null> {
  try {
    const fontPath = join(
      process.cwd(),
      "public",
      "font",
      "clash-display-variable.ttf"
    );
    const data = await readFile(fontPath);
    return data.buffer as ArrayBuffer;
  } catch {
    return null;
  }
}

/**
 * Default export — the route handler that Next.js invokes to generate the PNG.
 *
 * The JSX tree passed to `ImageResponse` is rendered by Satori (the underlying
 * SVG renderer used by `next/og`). Satori supports a limited subset of CSS
 * (flexbox layout, basic typography, linear gradients, border-radius).
 * Standard CSS features like `background-clip: text` are not supported; we
 * simulate the gradient headline using three separate `<span>` elements.
 */
export default async function OGImage() {
  const fontData = await loadClashDisplay();

  const fonts: ConstructorParameters<typeof ImageResponse>[1]["fonts"] =
    fontData
      ? [
          {
            name: "ClashDisplay",
            data: fontData,
            weight: 700 as const,
            style: "normal" as const,
          },
        ]
      : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: COLORS.background,
          padding: "80px 96px",
          position: "relative",
          overflow: "hidden",
          fontFamily: fontData ? "ClashDisplay, sans-serif" : "sans-serif",
        }}
      >
        {/* ── Decorative gradient blobs (purely visual, aria-hidden) ── */}

        {/* Blue blob — top-right */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Violet blob — centre */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "200px",
            right: "240px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Emerald blob — bottom-left */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ── Brand badge ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: COLORS.foreground,
            borderRadius: "100px",
            padding: "8px 20px",
            marginBottom: "40px",
          }}
        >
          {/* Logo mark — a simple gradient circle to mirror the wallet icon bg in hero */}
          <div
            aria-hidden="true"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${BRAND_GRADIENT.from}, ${BRAND_GRADIENT.via}, ${BRAND_GRADIENT.to})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span
            style={{
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            {COPY.brand}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            {COPY.badgeSub}
          </span>
        </div>

        {/* ── Hero headline ── */}
        {/*
         * Satori does not support `background-clip: text`, so we render
         * each line separately and use a solid colour for the gradient line.
         * The gradient line uses a CSS linear-gradient on its own background
         * and the `backgroundClip` workaround Satori does support via inline
         * styles on text nodes.
         */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "32px",
          }}
        >
          {/* Line 1: plain dark */}
          <span
            style={{
              fontSize: "80px",
              fontWeight: 700,
              color: COLORS.foreground,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {COPY.headlinePrefix}
          </span>

          {/* Line 2: gradient — rendered as a linear-gradient background on the text node */}
          <span
            style={{
              fontSize: "80px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              background: `linear-gradient(90deg, ${BRAND_GRADIENT.from} 0%, ${BRAND_GRADIENT.via} 40%, ${BRAND_GRADIENT.to} 80%)`,
              backgroundClip: "text",
              // @ts-expect-error — Satori / next/og requires the webkit prefix
              WebkitBackgroundClip: "text",
              // @ts-expect-error — Satori / next/og requires the webkit prefix
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {COPY.headlineGradient}
          </span>

          {/* Line 3: plain dark */}
          <span
            style={{
              fontSize: "80px",
              fontWeight: 700,
              color: COLORS.foreground,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {COPY.headlineSuffix}
          </span>
        </div>

        {/* ── Tagline ── */}
        <p
          style={{
            fontSize: "24px",
            fontWeight: 400,
            color: COLORS.muted,
            lineHeight: 1.5,
            maxWidth: "680px",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {COPY.tagline}
        </p>

        {/* ── Bottom-right decorative gradient bar ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
            width: "480px",
            height: "6px",
            background: `linear-gradient(90deg, transparent, ${BRAND_GRADIENT.via}, ${BRAND_GRADIENT.to})`,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
