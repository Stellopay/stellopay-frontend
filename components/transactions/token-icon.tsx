import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

const ICON_CLASS =
  "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center";

function getFallbackTokenLabel(token: string) {
  const cleanedLabel = token
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return cleanedLabel.slice(0, 3) || "?";
}

/**
 * Renders known token logos and a compact text fallback for unsupported symbols.
 */
export default function TokenIcon({ token }: TokenIconProps) {
  if (token === "USDC") {
    return (
      <div className={ICON_CLASS}>
        <Image
          src="/usdc-logo.png"
          alt="USDC"
          width={20}
          height={20}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  if (token === "XLM") {
    return (
      <div className={ICON_CLASS}>
        <Image
          src="/stellar-xlm-logo.png"
          alt="XLM"
          width={20}
          height={20}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const fallbackToken = token.trim();
  const fallbackDescription = fallbackToken
    ? `${fallbackToken} token`
    : "Unknown token";
  const fallbackLabel = getFallbackTokenLabel(token);

  return (
    <span
      aria-label={fallbackDescription}
      className={`${ICON_CLASS} bg-slate-200 text-[9px] font-semibold leading-none text-slate-700`}
      title={fallbackDescription}
    >
      {fallbackLabel}
    </span>
  );
}
