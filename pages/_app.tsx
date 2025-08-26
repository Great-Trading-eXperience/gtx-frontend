import { ClientOnly } from "@/components/client-only";
import ToastContainer from "@/components/clob-dex/place-order/toastContainer";
import { ToastProvider } from "@/components/clob-dex/place-order/toastContext";
import Footer from "@/components/footer/footer";
import EmbededPanel from "@/components/header/embeded-panel";
import Header from "@/components/header/header";
import LandingHeader from "@/components/header/landing-header";
import MobileWarningModal from "@/components/header/mobile-warning-modal";
import VeGTXHeader from "@/components/header/vegtx-header";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/providers/privy-provider";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import { ReactNode, useEffect, useState } from "react";
import "../styles/globals.css";

// RPC Request logging and rate limiting for debugging 429 errors
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  let requestCount = 0;
  let rateLimitedUntil = 0;
  const MAX_REQUESTS_PER_SECOND = 10; // Conservative limit
  const RATE_LIMIT_WINDOW = 1000; // 1 second
  
  // Request counter reset
  setInterval(() => {
    requestCount = 0;
  }, RATE_LIMIT_WINDOW);
  
  window.fetch = function(...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url || 'unknown';
    const now = Date.now();
    
    // Check if we're currently rate limited
    if (now < rateLimitedUntil) {
      console.warn('[RPC-DEBUG] 🚫 Request blocked - in rate limit cooldown period');
      return Promise.reject(new Error('Rate limited - too many requests'));
    }
    
    // Client-side rate limiting for RPC calls
    if (url.includes('appchain.caff.testnet.espresso.network') || 
        url.includes('testnet.rpc.rarichain.org') || 
        url.includes('rpc')) {
      
      requestCount++;
      
      console.log('[RPC-DEBUG] 🌐 RPC Request:', {
        url,
        method: init?.method || 'GET',
        timestamp: new Date().toISOString(),
        requestCount,
        stack: new Error().stack?.split('\n')[2]?.trim() || 'Unknown caller'
      });
      
      // If too many requests, add a delay
      if (requestCount > MAX_REQUESTS_PER_SECOND) {
        console.warn(`[RPC-DEBUG] ⚠️ Too many requests (${requestCount}/${MAX_REQUESTS_PER_SECOND}), adding delay`);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(originalFetch.apply(this, args));
          }, 1000); // 1 second delay
        });
      }
    }
    
    return originalFetch.apply(this, args).then(response => {
      // Handle 429 errors with backoff
      if (response.status === 429 && url.includes('appchain.caff.testnet.espresso.network')) {
        rateLimitedUntil = now + 30000; // 30 second cooldown
        console.error('[RPC-DEBUG] 🚫 429 Rate Limited - entering 30s cooldown:', {
          url,
          status: response.status,
          timestamp: new Date().toISOString(),
          cooldownUntil: new Date(rateLimitedUntil).toISOString(),
          stack: new Error().stack?.split('\n')[2]?.trim() || 'Unknown caller'
        });
      }
      return response;
    });
  };
}

// Monad Testnet chain ID
const MONAD_TESTNET_CHAIN_ID = 10143;
const RISE_SEPOLIA_CHAIN_ID = 11155931;
const RARI_TESTNET_CHAIN_ID = 1918988905;
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
          initialChain={RARI_TESTNET_CHAIN_ID}
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >
          <Head>
            <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
            <meta name="description" content="The Most Capital Efficient Crosschain Decentralized CLOB" />
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