import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useChainId, useDisconnect } from 'wagmi';
import { useSwitchAndAddChain } from './useSwitchAndAddChain';
import { appchainTestnet } from '@/configs/wagmi';

// Supported chain IDs for external wallets
const SUPPORTED_EXTERNAL_CHAINS = [
  4661,       // Appchain Testnet
  421614,     // Arbitrum Sepolia
];

// Required chain for embedded wallets
const RARI_TESTNET_CHAIN_ID = 1918988905;

// Map chain IDs to readable names
const CHAIN_NAMES: Record<number, string> = {
  1918988905: 'Rari Testnet',
  4661: 'Appchain Testnet',
  421614: 'Arbitrum Sepolia',
  11155931: 'Rise Sepolia',
  1: 'Ethereum Mainnet',
  5: 'Goerli',
  11155111: 'Sepolia',
};

/**
 * Hook to validate supported chains
 * - For external wallets: Restricts to Appchain and Arbitrum Sepolia only
 * - For embedded wallets: Must stay on Rari Testnet only
 * Automatically switches embedded wallets to Rari or disconnects if switching fails
 * Automatically disconnects external wallets if they're on unsupported chains when crosschain is enabled
 */
export function useChainValidator() {
  const currentChainId = useChainId();
  const { disconnect } = useDisconnect();
  const { wallets } = useWallets();

  const { switchAndAddChain } = useSwitchAndAddChain();

  useEffect(() => {
    const validateChain = async () => {
      // Only enforce restrictions when crosschain is enabled
      if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        console.log(`[CHAIN_VALIDATOR] Crosschain disabled - allowing all chains`);
        return;
      }

      wallets.forEach(async wallet => {
        const isEmbedded = wallet.walletClientType === 'privy' || wallet.walletClientType === 'embedded' || wallet.connectorType === 'embedded';

        if (isEmbedded) {
          const chainIdStr = wallet.chainId;
          const chainId = Number(chainIdStr.replace("eip155:", ""));

          if (chainId !== RARI_TESTNET_CHAIN_ID) {
            console.log(`[CHAIN_VALIDATOR] Embedded wallet on wrong chain: ${CHAIN_NAMES[chainId] || chainId}} (${currentChainId}), switching to Rari`);
            try {
              await wallet.switchChain(RARI_TESTNET_CHAIN_ID);
              console.log(`[CHAIN_VALIDATOR] Successfully switched embedded wallet to Rari`);
            } catch (error) {
              console.error(`[CHAIN_VALIDATOR] Failed to switch embedded wallet to Rari:`, error);
              
              toast.error(
                `Failed to switch to Rari Testnet. Please try reconnecting your wallet.`,
                {
                  duration: 8000,
                  action: {
                    label: 'Disconnect',
                    onClick: () => disconnect(),
                  },
                }
              );

              setTimeout(() => {
                console.log(`[CHAIN_VALIDATOR] Auto-disconnecting embedded wallet due to chain switch failure`);
                disconnect();
              }, 3000);
            }
          } else {
            console.log(`[CHAIN_VALIDATOR] Embedded wallet correctly on Rari Testnet`);
          }
        } else {
          const chainIdStr = wallet.chainId;
          const chainId = Number(chainIdStr.replace("eip155:", ""));

          const isSupported = SUPPORTED_EXTERNAL_CHAINS.includes(chainId);

          if (!isSupported) {
            console.log(`[CHAIN_VALIDATOR] Unsupported chain detected for external wallet: ${CHAIN_NAMES[chainId] || chainId} (${chainId})`);
            try {
              await switchAndAddChain(appchainTestnet); // Attempt to switch to Appchain First
              toast.success(`Switched to Appchain Testnet.`, { duration: 5000 });
              console.log(`[CHAIN_VALIDATOR] Successfully switched external wallet to Appchain Testnet`);
            } catch (error) {
              if (error instanceof Error) {
                console.error(error.message);
              } else {
                console.error('An unknown error occurred.');
              }
            }
          } else {
            console.log(`[CHAIN_VALIDATOR] Chain validated successfully: ${CHAIN_NAMES[chainId] || chainId} (${chainId})`);
          };
        }
      })
    };

    // Small delay to ensure wallet is fully connected
    const timeout = setTimeout(validateChain, 1000);
    
    return () => clearTimeout(timeout);
  }, [currentChainId, disconnect, wallets]);

  // Check if user is using embedded wallet for return values
  const isUsingEmbeddedWallet = wallets.some(wallet => 
    wallet.walletClientType === 'privy' || 
    wallet.walletClientType === 'embedded' ||
    wallet.connectorType === 'embedded'
  );

  // Determine if current chain is valid based on wallet type
  const isValidChain = () => {
    if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) return true;
    
    if (isUsingEmbeddedWallet) {
      // Embedded wallets must be on Rari only
      return currentChainId === RARI_TESTNET_CHAIN_ID;
    } else {
      // External wallets must be on supported external chains
      return SUPPORTED_EXTERNAL_CHAINS.includes(currentChainId);
    }
  };

  return {
    isValidChain: isValidChain(),
    allowedChains: isUsingEmbeddedWallet ? [RARI_TESTNET_CHAIN_ID] : SUPPORTED_EXTERNAL_CHAINS,
    chainName: CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`,
    isUsingEmbeddedWallet,
  };
}