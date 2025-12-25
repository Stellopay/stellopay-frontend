import type { AppProps } from "next/app";
import { WalletProvider } from "@/context/wallet-context";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}




