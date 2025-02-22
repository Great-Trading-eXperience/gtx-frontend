import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { wagmiConfig } from "@/configs/wagmi";
import { Chain, darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { WagmiProvider } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import "../styles/globals.css";
import Head from "next/head";
import { ReactNode } from "react";
import { NextPage } from "next/types";

const queryClient = new QueryClient();

// Tambahkan tipe untuk mendukung getLayout
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Ambil getLayout dari komponen, fallback ke Main Layout
  const getLayout = Component.getLayout || ((page: ReactNode) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={arbitrumSepolia}
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >
          <Head>
            <link rel="icon" type="image/webp" href="/logo/gtx-gradient.png" />
          </Head>
          <ThemeProvider
            disableTransitionOnChange
            attribute="class"
            defaultTheme="dark"
            value={{ light: "light", dark: "dark" }}
            // defaultTheme="system"
          >
            <Header />
            <div className="">
              {page}
            </div>
            <Footer />
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ));

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;

// Update theme