import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

/**
 * Render a known token image or a stable fallback badge for unsupported
 * symbols. Fallback text is escaped by React and never injected as HTML.
 */
export default function TokenIcon({ token }: TokenIconProps) {
  if (token === "USDC") {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center ">
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
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center ">
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

  const normalizedToken = token.trim();
  const fallbackLabel = normalizedToken || "Unknown token";
  const initials = (normalizedToken.match(/[a-z0-9]/gi)?.join("") || "?")
    .slice(0, 3)
    .toUpperCase();

  return (
    <span
      aria-label={`${fallbackLabel} token icon`}
      className="w-5 h-5 rounded-full bg-[#2D2D2D] text-[8px] font-semibold text-[#D7E0EF] flex items-center justify-center uppercase shrink-0"
      title={`${fallbackLabel} token`}
    >
      {initials}
    </span>
  );
}
