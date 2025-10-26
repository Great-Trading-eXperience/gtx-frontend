'use client';

import Footer from '@/components/footer/footer';
import EmbededPanel from '@/components/header/embeded-panel';
import Header from '@/components/header/header';
import LandingHeader from '@/components/header/landing-header';
import VeGTXHeader from '@/components/header/vegtx-header';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import ConnectWalletModal from './modals/connect-wallet';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();

  const isHomePage = pathname === '/';
  const isVeGTXPage = pathname.includes('/vegtx');
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  const isConnected = isConnectedEmbeddedWallet;

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
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

      <EmbededPanel isOpen={isPanelOpen} onClose={togglePanel} />
    </>
  );
}
