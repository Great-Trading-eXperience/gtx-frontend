import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useChainId, useDisconnect } from 'wagmi';

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
        // Embedded wallets must be on Rari Testnet only
        if (currentChainId !== RARI_TESTNET_CHAIN_ID) {
          console.log(`[CHAIN_VALIDATOR] Embedded wallet on wrong chain: ${chainName} (${currentChainId}), switching to Rari`);
          
          try {
            await embeddedWallet.switchChain(RARI_TESTNET_CHAIN_ID);
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

            // Disconnect if switching fails
            setTimeout(() => {
              console.log(`[CHAIN_VALIDATOR] Auto-disconnecting embedded wallet due to chain switch failure`);
              disconnect();
            }, 3000);
          }
        } else {
          console.log(`[CHAIN_VALIDATOR] Embedded wallet correctly on Rari Testnet`);
        }
      } else {
        // External wallet validation
        const isSupported = SUPPORTED_EXTERNAL_CHAINS.includes(currentChainId);

        console.log(`[CHAIN_VALIDATOR] Validating external wallet chain: ${chainName} (${currentChainId}), supported: ${isSupported}`);

        if (!isSupported) {
          console.log(`[CHAIN_VALIDATOR] Unsupported chain detected for external wallet: ${chainName} (${currentChainId})`);
          
          // Show error message
          toast.error(
            `${chainName} is not supported with crosschain features. Please switch to Appchain Testnet or Arbitrum Sepolia.`,
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
            
            toast.info('Disconnected from unsupported network. Please reconnect with Appchain Testnet or Arbitrum Sepolia.', {
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