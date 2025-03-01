import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { Chain, darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import "../styles/globals.css";
import Head from "next/head";
import { ReactNode } from "react";
import { NextPage } from "next/types";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

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
          initialChain={11155931}
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >

          <Head>
            <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
            <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
            <link rel="icon" type="image/png" href="/logo/gtx-gradient.png" />
          </Head>
          <ThemeProvider
            disableTransitionOnChange
            attribute="class"
            defaultTheme="dark"
            value={{ light: "light", dark: "dark" }}
          // defaultTheme="system"
          >
            <ToastProvider>
              <Header />
              <div className="">
                {page}
              </div>
              <Footer />
              <Toaster />
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ));

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;

// Update theme