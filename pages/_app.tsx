import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/context/theme-context';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}