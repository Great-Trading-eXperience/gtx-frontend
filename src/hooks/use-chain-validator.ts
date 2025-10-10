import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useChainId, useDisconnect } from 'wagmi';

// Supported chain IDs for external wallets
const SUPPORTED_EXTERNAL_CHAINS = [
  31337,      // Core Devnet
  31338,      // Side Devnet
];

// Required chain for embedded wallets (now Core Devnet)
const CORE_ANVIL_CHAIN_ID = 31337;

// Map chain IDs to readable names
const CHAIN_NAMES: Record<number, string> = {
  31337: 'Core Devnet',
  31338: 'Side Devnet',
  1: 'Ethereum Mainnet',
  5: 'Goerli',
  11155111: 'Sepolia',
};

/**
 * Hook to validate supported chains
 * - For external wallets: Restricts to Core Devnet and Side Devnet only
 * - For embedded wallets: Must stay on Core Devnet only
 * Automatically switches embedded wallets to Core Devnet or disconnects if switching fails
 * Automatically disconnects external wallets if they're on unsupported chains when crosschain is enabled
 */
export function useChainValidator() {
  const currentChainId = useChainId();
  const { disconnect } = useDisconnect();
  const { wallets } = useWallets();

  useEffect(() => {
    const validateChain = async () => {
      // Only enforce restrictions when crosschain is enabled
      if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        console.log(`[CHAIN_VALIDATOR] Crosschain disabled - allowing all chains`);
        return;
      }

      // Check if user is using embedded wallet (Privy wallet)
      const embeddedWallet = wallets.find(wallet => 
        wallet.walletClientType === 'privy' || 
        wallet.walletClientType === 'embedded' ||
        wallet.connectorType === 'embedded'
      );

      const chainName = CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`;

      if (embeddedWallet) {
        // Embedded wallets must be on Core Devnet only
        if (currentChainId !== CORE_ANVIL_CHAIN_ID) {
          console.log(`[CHAIN_VALIDATOR] Embedded wallet on wrong chain: ${chainName} (${currentChainId}), switching to Core Devnet`);
          
          try {
            await embeddedWallet.switchChain(CORE_ANVIL_CHAIN_ID);
            console.log(`[CHAIN_VALIDATOR] Successfully switched embedded wallet to Core Devnet`);
          } catch (error) {
            console.error(`[CHAIN_VALIDATOR] Failed to switch embedded wallet to Core Devnet:`, error);
            
            toast.error(
              `Failed to switch to Core Devnet. Please try reconnecting your wallet.`,
              {
                duration: 8000,
                action: {
                  label: 'Disconnect',
                  onClick: () => disconnect(),
                },
              }
            );

            // Disconnect if switching fails
            setTimeout(() => {
              console.log(`[CHAIN_VALIDATOR] Auto-disconnecting embedded wallet due to chain switch failure`);
              disconnect();
            }, 3000);
          }
        } else {
          console.log(`[CHAIN_VALIDATOR] Embedded wallet correctly on Core Devnet`);
        }
      } else {
        // External wallet validation
        const isSupported = SUPPORTED_EXTERNAL_CHAINS.includes(currentChainId);

        console.log(`[CHAIN_VALIDATOR] Validating external wallet chain: ${chainName} (${currentChainId}), supported: ${isSupported}`);

        if (!isSupported) {
          console.log(`[CHAIN_VALIDATOR] Unsupported chain detected for external wallet: ${chainName} (${currentChainId})`);
          
          // Show error message
          toast.error(
            `${chainName} is not supported with crosschain features. Please switch to Core Devnet or Side Devnet.`,
            {
              duration: 8000,
              action: {
                label: 'Disconnect',
                onClick: () => disconnect(),
              },
            }
          );

          // Auto-disconnect after a delay to give user time to read the message
          setTimeout(() => {
            console.log(`[CHAIN_VALIDATOR] Auto-disconnecting from unsupported chain: ${chainName}`);
            disconnect();
            
            toast.info('Disconnected from unsupported network. Please reconnect with Core Devnet or Side Devnet.', {
              duration: 5000,
            });
          }, 3000);
        } else {
          console.log(`[CHAIN_VALIDATOR] Chain validated successfully: ${chainName} (${currentChainId})`);
        }
      }
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
      // Embedded wallets must be on Core Devnet only
      return currentChainId === CORE_ANVIL_CHAIN_ID;
    } else {
      // External wallets must be on supported external chains
      return SUPPORTED_EXTERNAL_CHAINS.includes(currentChainId);
    }
  };

  return {
    isValidChain: isValidChain(),
    allowedChains: isUsingEmbeddedWallet ? [CORE_ANVIL_CHAIN_ID] : SUPPORTED_EXTERNAL_CHAINS,
    chainName: CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`,
    isUsingEmbeddedWallet,
  };
}