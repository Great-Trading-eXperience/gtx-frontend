import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useChainId, useDisconnect } from 'wagmi';

// Allowed chain IDs when crosschain is enabled
const ALLOWED_CROSSCHAIN_CHAINS = [
  1918988905, // Rari Testnet
  4661,       // Appchain Testnet
];

// Map chain IDs to readable names
const CHAIN_NAMES: Record<number, string> = {
  1918988905: 'Rari Testnet',
  4661: 'Appchain Testnet',
  11155931: 'Rise Sepolia', // This should not be allowed when crosschain is enabled
  1: 'Ethereum Mainnet',
  5: 'Goerli',
  11155111: 'Sepolia',
};

/**
 * Hook to validate and enforce allowed chains when crosschain features are enabled
 * Automatically disconnects users if they're on unsupported chains
 */
export function useChainValidator() {
  const currentChainId = useChainId();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const validateChain = async () => {
      // Only enforce restrictions when crosschain is enabled
      if (!FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
        console.log(`[CHAIN_VALIDATOR] Crosschain disabled - allowing all chains`);
        return;
      }

      const chainName = CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`;
      const isAllowed = ALLOWED_CROSSCHAIN_CHAINS.includes(currentChainId);

      console.log(`[CHAIN_VALIDATOR] Validating chain: ${chainName} (${currentChainId}), allowed: ${isAllowed}`);

      if (!isAllowed) {
        console.log(`[CHAIN_VALIDATOR] Unsupported chain detected: ${chainName} (${currentChainId})`);
        
        // Show error message
        toast.error(
          `${chainName} is not supported with crosschain features. Please switch to Rari Testnet or Appchain Testnet.`,
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
          
          toast.info('Disconnected from unsupported network. Please reconnect with Rari Testnet or Appchain Testnet.', {
            duration: 5000,
          });
        }, 3000);
      } else {
        console.log(`[CHAIN_VALIDATOR] Chain validated successfully: ${chainName} (${currentChainId})`);
      }
    };

    // Small delay to ensure wallet is fully connected
    const timeout = setTimeout(validateChain, 1000);
    
    return () => clearTimeout(timeout);
  }, [currentChainId, disconnect]);

  return {
    isValidChain: true
      ? ALLOWED_CROSSCHAIN_CHAINS.includes(currentChainId)
      : true,
    allowedChains: ALLOWED_CROSSCHAIN_CHAINS,
    chainName: CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`,
  };
}