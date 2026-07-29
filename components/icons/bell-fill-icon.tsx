/**
 * IconBell — filled bell icon (bell-fill variant)
 *
 * Lucide React does not ship a filled bell, so this custom component is
 * required. It deliberately uses `fill="currentColor"` instead of
 * `stroke="currentColor"` because the design calls for a solid silhouette,
 * matching the visual weight of the notification-panel indicator it lives in.
 *
 * Convention alignment with lucide-react (v1.27+):
 *   - viewBox      : "0 0 24 24"  ✓
 *   - width/height : 24 px default, overridable via `size` or width/height  ✓
 *   - aria-hidden  : "true" by default; replaced with role="img" when the
 *                    caller provides aria-label / aria-labelledby / role  ✓
 *   - forwardRef   : exposes a ref to the underlying <svg>  ✓
 *   - All SVGSVGElement props forwarded  ✓
 *
 * Intentional deviations from the lucide stroke convention:
 *   - fill="currentColor"  (filled variant — no equivalent exists in lucide)
 *   - No stroke / strokeWidth / strokeLinecap / strokeLinejoin
 *
 * Path geometry
 *   The original artwork used a 10×14 coordinate space. Every coordinate has
 *   been uniformly re-mapped to 24×24 (scale x × 2.4, scale y × 24/14 ≈
 *   1.7143) so this icon sits flush next to lucide outline icons without
 *   appearing over- or under-sized.
 *
 * Accessibility (WCAG 2.1 AA)
 *   Decorative (default) → aria-hidden="true" hides the element from the
 *   accessibility tree. Callers must supply adjacent visible text or an
 *   accessible wrapper label.
 *   Meaningful use       → pass an aria-label (or aria-labelledby / role);
 *   the component promotes role="img" automatically, mirroring lucide's own
 *   a11y heuristic.
 *
 * @example Decorative (default — used next to a text label)
 *   <IconBell className="text-white" />
 *
 * @example Meaningful — standalone icon with no adjacent visible text
 *   <IconBell aria-label="New notification" />
 *
 * @example Custom size — mirrors the lucide `size` prop
 *   <IconBell size={16} className="text-orange-400" />
 */

import { forwardRef } from "react";
import { IconProps } from "@/types/icons";

export interface BellFillIconProps extends IconProps {
  /**
   * Uniform icon size in pixels. Mirrors the `size` prop on all lucide icons.
   * When both `size` and explicit `width`/`height` props are supplied,
   * `width`/`height` take precedence (standard SVG prop spread order).
   *
   * @default 24
   */
  size?: number | string;
}

/**
 * Filled solid bell icon conforming to the 24×24 lucide grid convention.
 *
 * The icon remains custom because lucide-react has no bell-fill equivalent.
 * All other lucide conventions (viewBox, default size, aria handling,
 * forwardRef, prop forwarding) are matched exactly.
 */
export const IconBell = forwardRef<SVGSVGElement, BellFillIconProps>(
  function IconBell(
    { className, size = 24, "aria-label": ariaLabel, role, ...props },
    ref,
  ) {
    // Mirror lucide's a11y heuristic:
    //   no accessible label → aria-hidden="true" (decorative)
    //   label present       → role="img" + aria-label exposed to AT
    const hasA11yLabel =
      ariaLabel !== undefined ||
      (props as { "aria-labelledby"?: string })["aria-labelledby"] !==
        undefined ||
      role !== undefined;

    const a11yProps = hasA11yLabel
      ? { "aria-label": ariaLabel, role: role ?? "img" }
      : { "aria-hidden": "true" as const };

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        {...a11yProps}
        {...props}
      >
        {/*
         * Bell body + badge arc
         *
         * Faithfully transformed from the original 10×14 coordinate space to
         * 24×24 (sx = 2.4, sy = 24/14 ≈ 1.7143). All cubic Bézier control
         * points are preserved. The body spans x 2.4–21.6 and y 0.57–21.71.
         */}
        <path d="M13.6003 1.7143C13.6003 1.0831 12.884 0.5714 12.0003 0.5714C11.1167 0.5714 10.4003 1.0831 10.4003 1.7143V3.4285C10.4003 3.4602 10.4021 3.4916 10.4057 3.5227C5.8627 4.065 2.4003 6.8854 2.4003 10.2844V14.8571C2.4003 15.4287 1.7441 16.4201 1.0261 17.3338C0.0156 18.6195 0.2007 20.1696 2.1298 20.6942C4.07 21.2218 7.1735 21.7142 12.0003 21.7142C16.8271 21.7142 19.9307 21.2218 21.8709 20.6942C23.8 20.1696 23.985 18.6195 22.9746 17.3338C22.2565 16.4201 21.6003 15.4287 21.6003 14.8571V10.285C21.6003 6.8859 18.138 4.0651 13.595 3.5227C13.5985 3.4916 13.6003 3.4602 13.6003 3.4285V1.7143Z" />
        {/*
         * Clapper / drip (the rounded bottom tip of the bell silhouette)
         *
         * Faithfully transformed from 10×14. The lowest point reaches y = 24
         * exactly (original y = 14.0), sitting flush on the bottom of the grid.
         */}
        <path d="M7.0725 22.6567C7.1322 22.6939 7.2043 22.7373 7.2883 22.7853C7.5288 22.9227 7.8723 23.1009 8.3065 23.2779C9.1682 23.6297 10.4423 24 12.0003 24C13.5584 24 14.8325 23.6297 15.6942 23.2779C16.1283 23.1009 16.4719 22.9227 16.7124 22.7853C16.7964 22.7373 16.8685 22.6939 16.9282 22.6567C15.5292 22.7811 13.898 22.8571 12.0003 22.8571C10.1027 22.8571 8.4714 22.7811 7.0725 22.6567Z" />
      </svg>
    );
  },
);

IconBell.displayName = "IconBell";
