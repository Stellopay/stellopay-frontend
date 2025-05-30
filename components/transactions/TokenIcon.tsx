import Image from "next/image";

interface TokenIconProps {
  token: string;
}

export default function TokenIcon({ token }: TokenIconProps) {
  if (token === "USDC") {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-white">
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
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-white">
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
  return (
    <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
      ?
    </div>
  );
}
