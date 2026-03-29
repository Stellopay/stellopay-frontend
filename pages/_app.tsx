import type { AppProps } from "next/app";
import { ThemeProvider } from "@/context/theme-context";
import "@/app/globals.css";

export default function PagesApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
