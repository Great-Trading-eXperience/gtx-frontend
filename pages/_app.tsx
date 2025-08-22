import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import { NextPage } from "next/types";
import { Toaster } from "@/components/ui/toaster";
import LandingHeader from "@/components/header/landing-header";
import { useRouter } from "next/router";
import VeGTXHeader from "@/components/header/vegtx-header";
import MobileWarningModal from "@/components/header/mobile-warning-modal";
import Providers from "@/providers/privy-provider";
import { ClientOnly } from "@/components/client-only";
import EmbededPanel from "@/components/header/embeded-panel";
import { ToastProvider } from "@/components/clob-dex/place-order/toastContext";
import ToastContainer from "@/components/clob-dex/place-order/toastContainer";

// Monad Testnet chain ID
const MONAD_TESTNET_CHAIN_ID = 10143;
const RISE_SEPOLIA_CHAIN_ID = 11155931;
const CONDUIT_CHAIN_ID = 911867;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// Add type to support getLayout
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Mobile detection helper
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isHomePage = router.pathname === "/" && !router.pathname.includes("/vegtx");
  const isVeGTXPage = router.pathname.includes("/vegtx");
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';
  
  // Mobile warning state
  const [mobileWarningOpen, setMobileWarningOpen] = useState(false);

  // Detect mobile device on client-side
  useEffect(() => {
    // Only check on client
    if (typeof window === 'undefined') return;
    
    // Define trading pathnames that should trigger the warning
    const tradingPathnames = ['/markets', '/spot', '/perp', '/trade', '/exchange'];
    
    // Check if current path includes any trading paths
    const isOnTradingPage = tradingPathnames.some(path => 
      router.pathname.startsWith(path) || router.pathname === path
    );
    
    // If on a trading page and using a mobile device
    if (isOnTradingPage && isMobileDevice()) {
      // Redirect to home page - not allowing trading on mobile at all
      router.push('/');
    }
  }, [router.pathname, router]);
  
  // Listen for custom events from the LandingHeader
  useEffect(() => {
    const handleMobileTrigger = () => {
      setMobileWarningOpen(true);
    };
    
    // Add event listener for custom mobile trigger event
    window.addEventListener('gtx:mobileTrigger', handleMobileTrigger);
    
    // Cleanup 
    return () => {
      window.removeEventListener('gtx:mobileTrigger', handleMobileTrigger);
    };
  }, []);

  // Handle close of mobile warning
  const handleCloseMobileWarning = () => {
    setMobileWarningOpen(false);
  };

  // Add handle to open and close right panel
  const [isPanelOpen, setIsPanelOpen] = useState(false); // State to control panel visibility

  // Function to toggle the panel's open/close state
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // Effect to handle body scroll when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when panel is open
    } else {
      document.body.style.overflow = 'unset'; // Restore scrolling when panel is closed
    }
    // Cleanup function to ensure scroll is restored on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPanelOpen]);

  console.log(isPanelOpen);

  return (
    <>
      {isHomePage ? <LandingHeader /> : isVeGTXPage ? <VeGTXHeader /> : <Header onTogglePanel={togglePanel} />}
      {children}
      {(isHomePage || isWaitlistMode) && <Footer />}
      <Toaster />
      
      {/* Mobile Warning Modal */}
      <MobileWarningModal 
        isOpen={mobileWarningOpen}
        onClose={handleCloseMobileWarning}
      />

      <EmbededPanel isOpen={isPanelOpen} onClose={togglePanel} />
    </>
  );
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Get getLayout from component, fallback to Main Layout
  const getLayout = Component.getLayout || ((page: ReactNode) => (
    <ClientOnly fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <Providers>
        <RainbowKitProvider
          initialChain={RISE_SEPOLIA_CHAIN_ID}
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >
          <Head>
            <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
            <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
            <link rel="icon" type="image/png" href="/logo/gtx.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
                <ToastContainer />
              </AppLayout>
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </Providers>
    </ClientOnly>
  ));

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;