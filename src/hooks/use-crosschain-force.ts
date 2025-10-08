import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { toast } from 'sonner';
import { needsChainForcing } from '@/utils/chain-override';

// Core Devnet ID - the default fallback chain
const CORE_ANVIL_ID = 31337;
// Supported chains
const SUPPORTED_CHAINS = [31337, 31338]; // Core Devnet, Side Devnet

interface UseCrosschainForceResult {
  isChainCorrect: boolean;
  isCheckingChain: boolean;
  isSwitchingChain: boolean;
  needsCrosschainForce: boolean;
  targetChainId: number;
  currentChainId: number;
  forceChainSwitch: () => Promise<boolean>;
}

/**
 * Hook to handle chain forcing
 * Forces users to Core Devnet if they're on unsupported chains
 * Allows free choice between Core Devnet and Side Devnet
 */
export function useCrosschainForce(): UseCrosschainForceResult {
  const { wallets } = useWallets();
  const currentChainId = useChainId();
  const [isCheckingChain, setIsCheckingChain] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [hasInitialCheck, setHasInitialCheck] = useState(false);
  
  // Get embedded wallet for chain switching - try multiple wallet types
  const embeddedWallet = wallets.find(wallet => 
    wallet.walletClientType === 'privy' || 
    wallet.walletClientType === 'embedded' ||
    wallet.walletClient?.transport?.type === 'custom' ||
    wallet.connectorType === 'embedded'
  ) || wallets[0]; // Fallback to first wallet if no specific embedded wallet found
  
  // Check if forcing is needed (only if not on supported chains)
  const needsCrosschainForce = needsChainForcing(currentChainId);
  const isChainCorrect = SUPPORTED_CHAINS.includes(currentChainId);
  
  /**
   * Force switch to Core Devnet
   */
  const forceChainSwitch = async (): Promise<boolean> => {
    if (!needsCrosschainForce) {
      return true; // No forcing needed
    }
    
    if (!embeddedWallet) {
      toast.error('Embedded wallet not found. Please reconnect your wallet.');
      return false;
    }
    
    setIsSwitchingChain(true);
    try {
      console.log(`[CROSSCHAIN_FORCE] Switching from chain ${currentChainId} to Core Devnet (${CORE_ANVIL_ID})`);
      
      toast.info('Switching to Core Devnet for crosschain features...');
      
      // First try to switch to the chain
      await embeddedWallet.switchChain(CORE_ANVIL_ID);
      
      toast.success('Successfully switched to Core Devnet');
      return true;
      
    } catch (error: any) {
      console.error('[CROSSCHAIN_FORCE] Chain switch failed:', error);
      
      // If the chain is unrecognized, try to add it first
      if (error.message?.includes('Unrecognized chain ID') || error.message?.includes('not configured')) {
        console.log(`[CROSSCHAIN_FORCE] Chain not recognized, attempting to add Core Devnet first...`);
        
        try {
          // Import the core anvil config
          const { coreDevnet } = await import('@/configs/wagmi');
          
          toast.info('Adding Core Devnet to your wallet...');
          
          // Try different methods to add the chain
          console.log(`[CROSSCHAIN_FORCE] Checking available wallet methods:`, {
            hasAddChain: !!embeddedWallet.addChain,
            hasRequest: !!embeddedWallet.request,
            hasWalletClient: !!embeddedWallet.walletClient,
            availableMethods: Object.keys(embeddedWallet).filter(key => typeof embeddedWallet[key] === 'function')
          });

          let chainAdded = false;

          // Method 1: Try embeddedWallet.addChain
          if (embeddedWallet.addChain) {
            try {
              await embeddedWallet.addChain({
                id: coreDevnet.id,
                name: coreDevnet.name,
                network: coreDevnet.name.toLowerCase().replace(/\s+/g, '-'),
                nativeCurrency: coreDevnet.nativeCurrency,
                rpcUrls: {
                  default: { http: coreDevnet.rpcUrls.default.http },
                  public: { http: coreDevnet.rpcUrls.public.http }
                },
                blockExplorers: coreDevnet.blockExplorers
              });
              chainAdded = true;
              console.log(`[CROSSCHAIN_FORCE] Successfully added chain using addChain method`);
            } catch (addError: any) {
              console.log(`[CROSSCHAIN_FORCE] addChain method failed:`, addError.message);
            }
          }

          // Method 2: Try wallet.request with wallet_addEthereumChain
          if (!chainAdded && embeddedWallet.request) {
            try {
              await embeddedWallet.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${coreDevnet.id.toString(16)}`,
                  chainName: coreDevnet.name,
                  nativeCurrency: coreDevnet.nativeCurrency,
                  rpcUrls: coreDevnet.rpcUrls.default.http,
                  blockExplorerUrls: coreDevnet.blockExplorers?.default ? [coreDevnet.blockExplorers.default.url] : []
                }]
              });
              chainAdded = true;
              console.log(`[CROSSCHAIN_FORCE] Successfully added chain using wallet_addEthereumChain`);
            } catch (requestError: any) {
              console.log(`[CROSSCHAIN_FORCE] wallet_addEthereumChain failed:`, requestError.message);
            }
          }

          // Method 3: Try walletClient.request
          if (!chainAdded && embeddedWallet.walletClient?.request) {
            try {
              await embeddedWallet.walletClient.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${coreDevnet.id.toString(16)}`,
                  chainName: coreDevnet.name,
                  nativeCurrency: coreDevnet.nativeCurrency,
                  rpcUrls: coreDevnet.rpcUrls.default.http,
                  blockExplorerUrls: coreDevnet.blockExplorers?.default ? [coreDevnet.blockExplorers.default.url] : []
                }]
              });
              chainAdded = true;
              console.log(`[CROSSCHAIN_FORCE] Successfully added chain using walletClient.request`);
            } catch (walletClientError: any) {
              console.log(`[CROSSCHAIN_FORCE] walletClient.request failed:`, walletClientError.message);
            }
          }

          if (!chainAdded) {
            console.log(`[CROSSCHAIN_FORCE] All chain addition methods failed`);
            throw new Error('Unable to add Core Devnet - wallet does not support any known chain addition methods');
          }

          console.log(`[CROSSCHAIN_FORCE] Chain added successfully, now attempting to switch...`);
          
          // Now try to switch to the newly added chain
          await embeddedWallet.switchChain(CORE_ANVIL_ID);
          
          toast.success('Successfully added and switched to Core Devnet');
          return true;
          
        } catch (addChainError: any) {
          console.error('[CROSSCHAIN_FORCE] Failed to add chain:', addChainError);
          
          let addErrorMessage = 'Failed to add Core Devnet to wallet';
          if (addChainError.message?.includes('rejected') || addChainError.message?.includes('denied')) {
            addErrorMessage = 'Adding network cancelled by user';
          }
          
          toast.error(addErrorMessage);
          return false;
        }
      }
      
      // Handle other types of errors
      let errorMessage = 'Failed to switch to Core Devnet';
      if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        errorMessage = 'Network switch cancelled by user';
      }
      
      toast.error(errorMessage);
      return false;
      
    } finally {
      setIsSwitchingChain(false);
    }
  };
  
  /**
   * Initial mount effect - runs once when hook is first mounted
   */
  useEffect(() => {
    console.log(`[CHAIN_FORCE] Hook initialized - current chain: ${currentChainId}, supported: ${SUPPORTED_CHAINS.includes(currentChainId)}`);
    setHasInitialCheck(true);
  }, []); // Empty dependency array - runs only on initial mount

  /**
   * Auto-check and switch chain immediately when page loads and whenever requirements change
   */
  useEffect(() => {
    // Don't run if we haven't done the initial setup yet
    if (!hasInitialCheck) {
      return;
    }

    const autoSwitchChain = async () => {
      // Debug wallet information
      console.log(`[CROSSCHAIN_FORCE] Available wallets:`, wallets.map(w => ({
        address: w.address,
        walletClientType: w.walletClientType,
        connectorType: w.connectorType,
        chainId: w.chainId
      })));

      console.log(`[CHAIN_FORCE] Checking chain force requirements:`, {
        currentChainId,
        supportedChains: SUPPORTED_CHAINS,
        isSupported: SUPPORTED_CHAINS.includes(currentChainId),
        targetChainId: CORE_ANVIL_ID,
        needsForce: needsCrosschainForce,
        hasWallet: !!embeddedWallet,
        walletAddress: embeddedWallet?.address,
        selectedWalletType: embeddedWallet?.walletClientType,
        selectedConnectorType: embeddedWallet?.connectorType,
        totalWallets: wallets.length
      });

      if (!needsCrosschainForce) {
        console.log(`[CHAIN_FORCE] Already on supported chain (${currentChainId}), no force needed`);
        return;
      }

      if (!embeddedWallet) {
        console.log(`[CHAIN_FORCE] No suitable wallet found for chain switching, waiting for wallet connection...`);
        console.log(`[CHAIN_FORCE] Consider connecting a wallet that supports programmatic chain switching`);
        return;
      }

      // Additional check to ensure wallet has switchChain capability
      if (!embeddedWallet.switchChain) {
        console.log(`[CHAIN_FORCE] Selected wallet does not support chain switching:`, {
          walletType: embeddedWallet.walletClientType,
          connectorType: embeddedWallet.connectorType,
          hasSwitchChain: !!embeddedWallet.switchChain
        });
        return;
      }
      
      setIsCheckingChain(true);
      
      console.log(`[CHAIN_FORCE] Starting automatic chain switch from ${currentChainId} to Core Devnet (${CORE_ANVIL_ID})`);
      
      // Add a small delay to ensure wallet is fully connected
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show informational message about required chain
      toast.info('This feature requires Core Devnet or Side Devnet. Switching to Core Devnet...', {
        duration: 3000,
      });
      
      // Automatically switch chain
      const success = await forceChainSwitch();
      
      if (!success) {
        toast.error('Please switch to Core Devnet or Side Devnet manually to use this feature.', {
          duration: 5000,
        });
      }
      
      setIsCheckingChain(false);
    };
    
    // Run the chain check
    autoSwitchChain();
  }, [hasInitialCheck, currentChainId, embeddedWallet?.address, needsCrosschainForce]); // Run when initialized and when chain/wallet changes
  
  return {
    isChainCorrect,
    isCheckingChain,
    isSwitchingChain,
    needsCrosschainForce,
    targetChainId: CORE_ANVIL_ID,
    currentChainId,
    forceChainSwitch,
  };
}