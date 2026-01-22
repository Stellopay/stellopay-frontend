"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";

function shortHex(addr: string) {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUnits(raw: string | null, decimals: number | null) {
  if (!raw) return "0";
  if (decimals === null) return formatAmount(raw);
  try {
    const v = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = v / base;
    const frac = v % base;
    if (decimals === 0) return whole.toLocaleString();
    // show up to 2 decimals (trim trailing zeros)
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2).replace(/0+$/, "");
    return fracStr.length ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
  } catch {
    return raw;
  }
}

function formatAmount(raw: string | null) {
  if (!raw) return "0";
  try {
    return BigInt(raw).toLocaleString();
  } catch {
    return raw;
  }
}

export default function AccountSummary() {
  const { address, isVerified, sessionToken } = useWallet();
  const [copied, setCopied] = useState(false);

  const [agreementAddress, setAgreementAddress] = useState<string>("");
  const [escrowAddress, setEscrowAddress] = useState<string>("");

  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string>("USDC");
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!address || !isVerified || !sessionToken) {
      setAgreementAddress("");
      setEscrowAddress("");
      setWalletBalance(null);
      setPaidAmount(null);
      setTotalAmount(null);
      return;
    }

    (async () => {
      try {
        const [escrowDefaults, agreementDefaults] = await Promise.all([
          apiGet<{ address: string }>("/escrow/defaults"),
          apiGet<{ address: string }>("/agreement/defaults"),
        ]);
        if (cancelled) return;

        setEscrowAddress(escrowDefaults.address);
        setAgreementAddress(agreementDefaults.address);

        const agreementSummary = await apiGet<{
          token: string;
          total_amount: string;
          paid_amount: string;
        }>(`/agreement/${agreementDefaults.address}/summary`);
        if (cancelled) return;

        setTotalAmount(agreementSummary.total_amount);
        setPaidAmount(agreementSummary.paid_amount);

        const token = String(agreementSummary.token);
        if (token && token !== "0x0") {
          const [metaSymbol, metaDecimals] = await Promise.all([
            apiGet<{ symbol: string }>(`/token/${token}/symbol`).catch(() => ({ symbol: "USDC" })),
            apiGet<{ decimals: number }>(`/token/${token}/decimals`).catch(() => ({ decimals: 6 })),
          ]);
          if (cancelled) return;
          setTokenSymbol(metaSymbol.symbol || "USDC");
          setTokenDecimals(
            typeof metaDecimals.decimals === "number" ? metaDecimals.decimals : 6,
          );

          const bal = await apiGet<{ balance: string }>(
            `/token/${token}/balance/${address}`,
          );
          if (cancelled) return;
          setWalletBalance(bal.balance);
        }
      } catch {
        // keep UI stable; values will remain as "—"
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isVerified, sessionToken]);

  const toBePaid = useMemo(() => {
    try {
      if (!totalAmount || !paidAmount) return null;
      const v = BigInt(totalAmount) - BigInt(paidAmount);
      return v < BigInt(0) ? "0" : v.toString();
    } catch {
      return null;
    }
  }, [paidAmount, totalAmount]);

  const summary = useMemo(
    () => [
      {
        accountInfo: "Your Account Balance",
        amount: `$ ${formatUnits(walletBalance, tokenDecimals)} ${tokenSymbol}`,
        image: "/copy-01.png",
        item: "Copy Address",
        address: shortHex(address ?? ""),
        copyValue: address ?? "",
        accountImage: "/piggy-bank.png",
      },
      {
        accountInfo: "Paid This Month",
        amount: `$ ${formatUnits(paidAmount, tokenDecimals)} ${tokenSymbol}`,
        item: "Agreement",
        address: shortHex(agreementAddress),
        accountImage: "/dollar-02.png",
      },
      {
        accountInfo: "To be Paid",
        amount: `$ ${formatUnits(toBePaid, tokenDecimals)} ${tokenSymbol}`,
        item: "Escrow",
        address: shortHex(escrowAddress),
        accountImage: "/dollar-01.png",
      },
    ],
    [
      address,
      agreementAddress,
      escrowAddress,
      paidAmount,
      toBePaid,
      walletBalance,
      tokenDecimals,
      tokenSymbol,
    ],
  );

  return (
    <div className="max-w-full p-4 rounded-xl h-[12.75rem] my-6 border-[1px] border-[#2D2D2D] bg-[#0D0D0D80]">
      <div className="w-full h-8 gap-3 mb-4 flex items-center">
        <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
          <Image
            src="/bank.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>
        <h1 className="font-[Inter] text-base leading-[145%] align-middle">
          Account Summary
        </h1>
      </div>

      <div className="max-w-full h-[7.5rem] gap-4 justify-between flex overflow-hidden">
        {summary.map((info, index) => (
          <div className="w-full" key={`${info.accountInfo}-${index}`}>
            <div className="h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
              <div className="w-full flex items-center gap-2 mb-2">
                <div className="text-sm align-middle font-[Inter]">
                  {info.accountInfo}
                </div>
                <Image
                  src={info.accountImage}
                  alt={info.accountInfo}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div className="font-semibold text-2xl align-middle font-[Inter] mb-1">
                {info.amount}
              </div>
              <p className="max-w-[16.4375rem] h-[17px] flex items-center font-medium text-xs align-middle font-[Inter] text-[#3B3B3B]">
                {info.item} :
                <span className="text-[#D8D8D8] cursor-pointer">
                  {info.address}
                </span>
                {info.image ? (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboardWithTimeout(
                        (info as any).copyValue ?? info.address,
                        setCopied,
                        1200,
                      )
                    }
                    className="ml-1 inline-flex items-center"
                    aria-label="Copy address"
                  >
                    <Image
                      src={info.image}
                      alt="copy"
                      width={14}
                      height={14}
                      className="object-contain w-3.5 h-3.5 cursor-pointer"
                    />
                  </button>
                ) : null}
                {copied && info.item === "Copy Address" ? (
                  <span className="ml-2 text-[#E5E5E5]">Copied</span>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


