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
import LandingHeader from "@/components/header/landing-header";
import { useRouter } from "next/router";
import { arbitrumSepolia } from "wagmi/chains"
import VeGTXHeader from "@/components/header/vegtx-header";

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

function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState("");
  const isHomePage = router.pathname === "/" && !router.pathname.includes("/vegtx");
  const isVeGTXPage = router.pathname.includes("/vegtx");
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true'

  return (
    <>
      {loading && <CustomLoader />}
      {isHomePage ? <LandingHeader /> : isVeGTXPage ? <VeGTXHeader /> : <Header />}
      {children}
      {isHomePage || isWaitlistMode && <Footer />}
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
          initialChain={RISE_SEPOLIA_CHAIN_ID} // Updated to use Rise Sepolia as default
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >
          <Head>
            <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
            <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
            <link rel="icon" type="image/png" href="/logo/gtx.png" />
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