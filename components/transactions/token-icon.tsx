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
}
