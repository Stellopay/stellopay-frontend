import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

const KNOWN_TOKENS: Record<string, { src: string; label: string }> = {
  USDC: { src: "/usdc-logo.png", label: "USDC" },
  XLM: { src: "/stellar-xlm-logo.png", label: "XLM" },
};

function getInitials(token: string): string {
  return token.slice(0, 2).toUpperCase();
}

export default function TokenIcon({ token }: TokenIconProps) {
  const known = KNOWN_TOKENS[token];

  if (known) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center">
        <Image
          src={known.src}
          alt={known.label}
          width={20}
          height={20}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback: circular badge with the first two characters of the token code
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 text-[10px] font-semibold text-gray-600"
      title={token}
    >
      {getInitials(token)}
    </div>
  );
}
