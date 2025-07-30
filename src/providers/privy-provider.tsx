'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PrivyClientConfig } from '@privy-io/react-auth';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { riseTestnet, wagmiConfig } from '@/configs/wagmi';
import { defineChain } from 'viem';

const queryClient = new QueryClient();

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'all-users',
    showWalletUIs: false,
  },
  loginMethods: ['google', 'twitter', 'email','wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#676FFF',
    logo: '/logo/gtx.png',
  },
  defaultChain: defineChain(riseTestnet),
  supportedChains: [
    defineChain(riseTestnet),
  ],
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}