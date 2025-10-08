'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Footer from '@/_components/footer/footer';
import EmbededPanel from '@/_components/header/embeded-panel';
import Header from '@/_components/header/header';
import LandingHeader from '@/_components/header/landing-header';
import MobileWarningModal from '@/_components/header/mobile-warning-modal';
import VeGTXHeader from '@/_components/header/vegtx-header';
import ConnectWalletModal from '@/_components/modals/connect-wallet';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { useAccount } from 'wagmi';
import BottomNavbar from './bottom-navbar';

interface PageLayoutProps {
  children: ReactNode;
}

// Mobile detection helper
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
};

export function PageLayout({ children }: PageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/';
  const isVeGTXPage = pathname.includes('/vegtx');
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

  // Mobile warning state
  const [mobileWarningOpen, setMobileWarningOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  /*
  // Mobile device detection and redirection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tradingPathnames = ['/markets', '/spot', '/perp', '/trade', '/exchange'];
    const isOnTradingPage = tradingPathnames.some(
      path => pathname.startsWith(path) || pathname === path
    );

    if (isOnTradingPage && isMobileDevice()) {
      router.push('/');
    }
  }, [pathname, router]);
  */

  /*
  // Listen for custom events from the LandingHeader
  useEffect(() => {
    const handleMobileTrigger = () => {
      setMobileWarningOpen(true);
    };

    window.addEventListener('gtx:mobileTrigger', handleMobileTrigger);

    return () => {
      window.removeEventListener('gtx:mobileTrigger', handleMobileTrigger);
    };
  }, []);
  */

  // Handle body scroll when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPanelOpen]);

  // Connection state management
  const { ready, authenticated: isConnectedEmbeddedWallet } = usePrivyAuth();
  const { isConnected: isConnectedExternalWallet } = useAccount();

  const [delayedReady, setDelayedReady] = useState(false);

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        setDelayedReady(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setDelayedReady(false);
    }
  }, [ready]);

  const isConnected = isConnectedEmbeddedWallet && isConnectedExternalWallet;

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleCloseMobileWarning = () => {
    setMobileWarningOpen(false);
  };

  // Determine which header to render
  const renderHeader = () => {
    if (isHomePage) return <LandingHeader />;
    if (isVeGTXPage) return <VeGTXHeader />;
    return <Header onTogglePanel={togglePanel} />;
  };

  return (
    <>
      {renderHeader()}
      {children}
      {delayedReady && !isConnected && !isHomePage && !isVeGTXPage && (
        <ConnectWalletModal />
      )}
      {(isHomePage || isWaitlistMode) && <Footer />}

      {!isMobileDevice() && <EmbededPanel isOpen={isPanelOpen} onClose={togglePanel} />}

      {isMobileDevice() && <BottomNavbar />}
    </>
  );
}
