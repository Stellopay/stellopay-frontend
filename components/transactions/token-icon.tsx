import * as React from "react";
import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

/** Known token symbols mapped to their logo assets. */
const TOKEN_LOGOS: Record<string, string> = {
  USDC: "/usdc-logo.png",
  XLM: "/stellar-xlm-logo.png",
};

/** Shown for any symbol without a dedicated logo, so a row never renders a gap. */
export const FALLBACK_TOKEN_LOGO = "/usd.png";

/**
 * Resolves a token symbol to its logo path.
 *
 * Matching is case-insensitive so `"usdc"` and `"USDC"` share an icon.
 */
export function resolveTokenLogo(token: string): string {
  return TOKEN_LOGOS[token?.toUpperCase?.() ?? ""] ?? FALLBACK_TOKEN_LOGO;
}

function TokenIconComponent({ token, src, size = 20 }: TokenIconProps) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={src ?? resolveTokenLogo(token)}
        alt={`${token} token icon`}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

TokenIconComponent.displayName = "TokenIcon";

/**
 * Token logo for a transaction row.
 *
 * Memoized because it renders once per row and its props are stable per row.
 * Without this, every unrelated re-render of `transactions-table.tsx` — a
 * sort-icon hover, a density change, a tag popover opening — re-rendered every
 * icon on screen. All three props are primitives, so React's default shallow
 * comparison is the correct equality check and no custom comparator is needed.
 *
 * Accessibility: the `alt` is the token symbol plus "token icon", so the symbol
 * is never conveyed by the image alone (WCAG 2.1 AA, SC 1.1.1). The adjacent
 * text label in each row keeps the symbol available without images.
 */
const TokenIcon = React.memo(TokenIconComponent);

export default TokenIcon;
