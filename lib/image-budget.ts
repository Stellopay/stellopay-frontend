/**
 * Image loading budgets, optimization rules, and accessibility utilities.
 *
 * Implements Issue #1175:
 * - Layout shift prevention (CLS): explicit dimensions, aspect ratios, skeletons.
 * - Meaningful alt-text coverage: distinction between informative & decorative images.
 * - Loading priority & budget enforcement: LCP/above-the-fold prioritization, below-the-fold lazy loading.
 */

export type ImageCategory = "icon" | "avatar" | "thumbnail" | "card" | "hero" | "og";

export interface ImageBudgetConfig {
  /** Maximum recommended payload budget in bytes */
  maxPayloadBytes: number;
  /** Default width in px */
  defaultWidth: number;
  /** Default height in px */
  defaultHeight: number;
  /** Responsive sizes attribute string for layout reservation */
  sizes?: string;
  /** Approved formats */
  approvedFormats: readonly string[];
}

export const IMAGE_BUDGETS: Record<ImageCategory, ImageBudgetConfig> = {
  icon: {
    maxPayloadBytes: 15 * 1024, // 15 KB
    defaultWidth: 24,
    defaultHeight: 24,
    sizes: "24px",
    approvedFormats: ["image/svg+xml", "image/png", "image/webp"],
  },
  avatar: {
    maxPayloadBytes: 50 * 1024, // 50 KB
    defaultWidth: 40,
    defaultHeight: 40,
    sizes: "40px",
    approvedFormats: ["image/avif", "image/webp", "image/png", "image/jpeg"],
  },
  thumbnail: {
    maxPayloadBytes: 80 * 1024, // 80 KB
    defaultWidth: 140,
    defaultHeight: 140,
    sizes: "(max-width: 640px) 120px, 140px",
    approvedFormats: ["image/avif", "image/webp", "image/png", "image/svg+xml"],
  },
  card: {
    maxPayloadBytes: 150 * 1024, // 150 KB
    defaultWidth: 400,
    defaultHeight: 200,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px",
    approvedFormats: ["image/avif", "image/webp", "image/png", "image/jpeg", "image/svg+xml"],
  },
  hero: {
    maxPayloadBytes: 300 * 1024, // 300 KB
    defaultWidth: 1200,
    defaultHeight: 630,
    sizes: "100vw",
    approvedFormats: ["image/avif", "image/webp", "image/png", "image/jpeg"],
  },
  og: {
    maxPayloadBytes: 400 * 1024, // 400 KB
    defaultWidth: 1200,
    defaultHeight: 630,
    sizes: "1200px",
    approvedFormats: ["image/png", "image/jpeg"],
  },
} as const;

export const IMAGE_OPTIMIZATION_CONFIG = {
  formats: ["image/avif", "image/webp"] as const,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048] as const,
  imageSizes: [16, 20, 24, 32, 40, 48, 64, 96, 128, 256, 384] as const,
  minimumCacheTTL: 60,
} as const;

/**
 * Validates whether an image conforms to decorative vs informative accessibility rules.
 *
 * Rules:
 * - Decorative images must have `alt=""` and `aria-hidden="true"`.
 * - Informative images must have a descriptive, non-empty `alt` attribute and must not be hidden.
 */
export function validateImageAccessibility(props: {
  alt?: string;
  isDecorative?: boolean;
  ariaHidden?: boolean | "true" | "false";
}): {
  isValid: boolean;
  type: "decorative" | "informative";
  error?: string;
} {
  const isDec = props.isDecorative === true || props.alt === "" || props.ariaHidden === true || props.ariaHidden === "true";

  if (isDec) {
    // Decorative image must not have non-empty alt that communicates meaningful content
    if (props.alt && props.alt.trim().length > 0 && props.isDecorative) {
      return {
        isValid: false,
        type: "decorative",
        error: "Decorative image should have empty alt text (alt=\"\") to avoid confusing assistive tech.",
      };
    }
    return {
      isValid: true,
      type: "decorative",
    };
  }

  // Informative image must have meaningful alt
  if (!props.alt || props.alt.trim().length === 0) {
    return {
      isValid: false,
      type: "informative",
      error: "Informative images require meaningful alt text for screen reader users.",
    };
  }

  return {
    isValid: true,
    type: "informative",
  };
}

/**
 * Returns accessible image props ensuring decorative images are properly hidden
 * and informative images provide alt text.
 */
export function getAccessibleImageProps(options: {
  alt?: string;
  isDecorative?: boolean;
  fallbackAlt?: string;
}): {
  alt: string;
  "aria-hidden"?: true;
} {
  if (options.isDecorative) {
    return {
      alt: "",
      "aria-hidden": true,
    };
  }

  const alt = (options.alt ?? options.fallbackAlt ?? "").trim();
  if (!alt) {
    return {
      alt: "",
      "aria-hidden": true,
    };
  }

  return {
    alt,
  };
}

/**
 * Resolves loading priority and layout shift avoidance props based on placement.
 */
export function resolveImageLoadingProps(placement: "above-the-fold" | "below-the-fold" | "lcp" | "lazy" = "below-the-fold"): {
  priority: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
} {
  if (placement === "above-the-fold" || placement === "lcp") {
    return {
      priority: true,
      fetchPriority: "high",
    };
  }

  return {
    priority: false,
    loading: "lazy",
    fetchPriority: "low",
  };
}
