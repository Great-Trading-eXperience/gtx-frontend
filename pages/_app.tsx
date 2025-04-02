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
import { ReactNode, useEffect, useState } from "react";
import { NextPage } from "next/types";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import LandingHeader from "@/components/header/landing-header";
import { useRouter } from "next/router";
import GradientLoader from "@/components/gradient-loader/gradient-loader";
import { arbitrumSepolia } from "wagmi/chains"

const queryClient = new QueryClient();

// Monad Testnet chain ID
const MONAD_TESTNET_CHAIN_ID = 10143;
const RISE_SEPOLIA_CHAIN_ID = 11155931;
const CONDUIT_CHAIN_ID = 911867;
const LOCAL_ANVIL_CHAIN_ID = 31337;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// Add type to support getLayout
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Custom loader component with black background
const CustomLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <GradientLoader />
    </div>
  );
};

function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState("");
  const isHomePage = router.pathname === "/";

  useEffect(() => {
    // Store the previous path when it changes
    if (router.pathname !== prevPath && prevPath !== "") {
      // Only trigger loading when navigating away from home
      if (prevPath === "/") {
        setLoading(true);
        // Set a timer to hide the loader after 3 seconds
        const timer = setTimeout(() => {
          setLoading(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
    
    setPrevPath(router.pathname);
  }, [router.pathname, prevPath]);

  // Listen for route changes to update the previous path
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      const newPath = url.split('?')[0]; // Remove query params
      
      // Only show loader when navigating from home
      if (router.pathname === "/") {
        setLoading(true);
      }
    };

    const handleRouteChangeComplete = () => {
      // For other route changes, we'll keep the loader state as is
      // It will be managed by the timeout above
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <>
      {loading && <CustomLoader />}
      {isHomePage ? <LandingHeader /> : <Header />}
      {children}
      {isHomePage && <Footer />}
      <Toaster />
    </>
  );
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Get getLayout from component, fallback to Main Layout
  const getLayout = Component.getLayout || ((page: ReactNode) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={ARBITRUM_SEPOLIA_CHAIN_ID} // Updated to use Arbitrum as default
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
          >
            <ToastProvider>
              <AppLayout>
                {page}
              </AppLayout>
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ));

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;