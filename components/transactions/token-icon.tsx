import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

const getTokenIconPath = (token: string): string | null => {
  const tokenUpper = token?.toUpperCase();
  switch (tokenUpper) {
    case "USDC":
      return "/usdc-logo.png";
    case "XLM":
      return "/stellar-xlm-logo.png";
    case "STRK":
      return "/starknet.png";
    case "USDT":
      return "/usdt.svg";
    default:
      return "/usd.png"; // Default fallback
  }
};

export default function TokenIcon({ token }: TokenIconProps) {
  const iconPath = getTokenIconPath(token);
  
  if (!iconPath) {
    return null;
  }

  return (
    <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
      <Image
        src={iconPath}
        alt={token || "Token"}
        width={20}
        height={20}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to a default icon if image fails to load
          e.currentTarget.src = "/usd.png";
        }}
      />
    </div>
  );
}
