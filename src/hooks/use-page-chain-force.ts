import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { toast } from 'sonner';
import { getEffectiveChainId, getChainName, needsChainForcing } from '@/utils/chain-override';

interface UsePageChainForceResult {
  isChainCorrect: boolean;
  isCheckingChain: boolean;
  isSwitchingChain: boolean;
  targetChainId: number;
  currentChainId: number;
  effectiveChainId: number;
  forceChainSwitch: () => Promise<boolean>;
}

/**
 * Hook to handle page-level chain forcing
 * Forces users to Appchain if they're on unsupported chains
 * Allows free choice between Appchain and Arbitrum Sepolia
 */
export function usePageChainForce(): UsePageChainForceResult {
  const { wallets } = useWallets();
  const currentChainId = useChainId();
  const effectiveChainId = getEffectiveChainId(currentChainId);
  const [isCheckingChain, setIsCheckingChain] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  
  // Get embedded wallet for chain switching
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  
  const needsChainSwitch = needsChainForcing(currentChainId);
  const isChainCorrect = !needsChainSwitch;
  
  /**
   * Force switch to Appchain Testnet
   */
  const forceChainSwitch = async (): Promise<boolean> => {
    if (!needsChainSwitch) {
      return true; // No forcing needed
    }
    
    if (!embeddedWallet) {
      toast.error('Embedded wallet not found. Please reconnect your wallet.');
      return false;
    }
    
    setIsSwitchingChain(true);
    const APPCHAIN_TESTNET_ID = 4661;
    
    try {
      toast.info('Switching to Appchain Testnet for crosschain features...');
      
      await embeddedWallet.switchChain(APPCHAIN_TESTNET_ID);
      
      toast.success('Successfully switched to Appchain Testnet');
      return true;
      
    } catch (error: any) {
      console.error('Chain switch failed:', error);
      
      let errorMessage = 'Failed to switch to Appchain Testnet';
      if (error.message?.includes('not configured')) {
        errorMessage = 'Appchain Testnet is not configured';
      } else if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        errorMessage = 'Network switch cancelled by user';
      }
      
      toast.error(errorMessage);
      return false;
      
    } finally {
      setIsSwitchingChain(false);
    }
  };
  
  /**
   * Auto-check and switch chain on page load
   */
  useEffect(() => {
    const autoSwitchChain = async () => {
      if (!needsChainSwitch || !embeddedWallet) {
        return;
      }
      
      setIsCheckingChain(true);
      
      // Add a small delay to ensure wallet is fully connected
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show informational message about required chain
      const currentChain = getChainName(currentChainId);
      
      console.log(`[PAGE_CHAIN_FORCE] Current chain ${currentChain} not supported, switching to Appchain`);
      
      // Show informational message about required chain
      toast.info('This feature requires Appchain Testnet or Arbitrum Sepolia. Switching to Appchain...', {
        duration: 3000,
      });
      
      // Automatically switch chain
      const success = await forceChainSwitch();
      
      if (!success) {
        toast.error('Please switch to Appchain Testnet or Arbitrum Sepolia manually to use this feature.', {
          duration: 5000,
        });
      }
      
      setIsCheckingChain(false);
    };
    
    autoSwitchChain();
  }, [needsChainSwitch, embeddedWallet?.address]); // Only run when wallet or chain force requirement changes
  
  return {
    isChainCorrect,
    isCheckingChain,
    isSwitchingChain,
    targetChainId: 4661, // Always target Appchain when forcing
    currentChainId,
    effectiveChainId,
    forceChainSwitch,
  };
}