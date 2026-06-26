import Image from "next/image";
import { TokenIconProps } from "@/types/transaction";

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

  // Fallback for any unsupported/unknown token symbol.
  return (
    <div
      className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-[#1A1A1A] border border-[#2D2D2D]"
      aria-label={`Unknown token icon: ${token}`}
      title={token}
    >
      <span className="text-[10px] text-white/80">{token?.slice(0, 2) ?? "?"}</span>
    </div>
  );
}

