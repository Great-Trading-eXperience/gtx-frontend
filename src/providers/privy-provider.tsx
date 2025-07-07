'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { arbitrumSepolia } from 'viem/chains';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'], // Temporarily use only email and wallet
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: '/logo/gtx.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
        // Add custom chains if needed
        // customChains: [
        //   {
        //     id: 11155931,
        //     name: 'Rise Sepolia',
        //     nativeCurrency: { name: 'Rise', symbol: 'RISE', decimals: 18 },
        //     rpcUrls: {
        //       default: { http: ['https://sepolia-rpc.rise.art'] },
        //     },
        //     blockExplorers: {
        //       default: { name: 'Rise Explorer', url: 'https://sepolia-explorer.rise.art' },
        //     },
        //   },
        // ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}