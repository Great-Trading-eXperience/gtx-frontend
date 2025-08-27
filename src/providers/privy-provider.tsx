'use client';

import { appchainTestnet, arbitrumSepolia, rariTestnet, wagmiConfig } from '@/configs/wagmi';
import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useChainValidator } from '@/hooks/use-chain-validator';
import type { PrivyClientConfig } from '@privy-io/react-auth';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
          return false;
        }
        
        if (error?.message?.includes('timeout') || error?.message?.includes('ERR_TIMED_OUT')) {
          return false;
        }
        
        return failureCount < 1; 
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), 
      staleTime: 30000, 
      gcTime: 300000, 
      refetchOnWindowFocus: false, 
    },
  },
});

// Create conditional Privy configuration based on crosschain feature flag
const createPrivyConfig = (): PrivyClientConfig => {
  const isCrosschainEnabled = FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED;
  
  console.log(`[PRIVY_CONFIG] Crosschain enabled: ${isCrosschainEnabled}`);

  const baseConfig: PrivyClientConfig = {
    embeddedWallets: {
      createOnLogin: 'all-users',
      showWalletUIs: false,
      requireUserPasswordOnCreate: false,
      noPromptOnSignature: false,
    },
    loginMethods: [
      // 'google', 
      // 'twitter', 
      // 'email',
      'wallet'
    ],
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
      logo: '/logo/gtx.png',
    },
  };

  if (isCrosschainEnabled) {
    // When crosschain is enabled, include all chains (Rari for embedded, Appchain/Arbitrum for external)
    console.log(`[PRIVY_CONFIG] Including all chains - Rari for embedded wallets, Appchain/Arbitrum for external wallets`);
    
    return {
      ...baseConfig,
      defaultChain: defineChain(rariTestnet), // Default to Rari for embedded wallets
      supportedChains: [
        defineChain(rariTestnet),        // For embedded wallets
        defineChain(appchainTestnet),    // For external wallets
        defineChain(arbitrumSepolia),    // For external wallets
      ],
    };
  } else {
    // When crosschain is disabled, use default configuration with all available chains
    console.log(`[PRIVY_CONFIG] Using default configuration with all supported chains`);
    
    return {
      ...baseConfig,
      defaultChain: defineChain(rariTestnet),
      supportedChains: [
        defineChain(rariTestnet),
        defineChain(appchainTestnet),
        defineChain(arbitrumSepolia),
      ],
    };
  }
};

const privyConfig = createPrivyConfig();

// Chain validation wrapper component
function ChainValidatorWrapper({ children }: { children: React.ReactNode }) {
  useChainValidator();
  return <>{children}</>;
}

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
          <ChainValidatorWrapper>
            {children}
          </ChainValidatorWrapper>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}