'use client';

import React from 'react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/configs/wagmi';
import { Toaster } from 'sonner';
import CrossChainOrderForm from '@/components/swap/swap';
import CrossChainProvider from '@/hooks/web3/espresso/useCrossChain';

/**
 * Main application component that sets up providers and layout
 */
export default function CrossChainAppExample() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <CrossChainProvider>
        <CrossChainOrderForm />
      </CrossChainProvider>
    </WagmiConfig>
  );
}