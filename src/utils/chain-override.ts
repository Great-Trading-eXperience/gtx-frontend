/**
 * Simple Chain Override Utility
 * 
 * This utility provides a simple way to override the chainId used for contract interactions
 * via environment variables, without needing to modify individual hooks.
 */

// import { riseTestnet, rariTestnet, appchainTestnet } from '@/configs/wagmi';
import { rariTestnet, appchainTestnet } from '@/configs/wagmi';
import { isFeatureEnabled, getCoreChain } from '@/constants/features/features-config';

// Available chains for override
const AVAILABLE_CHAINS = {
  // RISE_TESTNET: riseTestnet.id,      // 11155931
  RARI_TESTNET: rariTestnet.id,      // 1918988905  
  APPCHAIN_TESTNET: appchainTestnet.id, // 4661
} as const;

/**
 * Get the forced chain ID from environment variables
 * Returns null if no forcing is configured
 */
function getForcedChainId(): number | null {
  // Get the forced chain ID from environment
  const forcedChainIdEnv = process.env.NEXT_PUBLIC_FORCE_CHAIN_ID;
  
  if (!forcedChainIdEnv) {
    return null; // No forcing configured
  }
  
  const forcedChainId = parseInt(forcedChainIdEnv);
  
  if (isNaN(forcedChainId)) {
    console.warn('[CHAIN_OVERRIDE] Invalid NEXT_PUBLIC_FORCE_CHAIN_ID:', forcedChainIdEnv);
    return null;
  }
  
  return forcedChainId;
}

/**
 * Get the chain ID to use for contract interactions
 * Priority: 1. Forced chain (env var), 2. Core chain (if crosschain enabled), 3. Current chain
 */
export function getEffectiveChainId(currentChainId: number): number {
  const forcedChainId = getForcedChainId();
  
  // First priority: Environment variable chain forcing
  if (forcedChainId !== null) {
    // Log chain override for debugging
    if (process.env.NODE_ENV === 'development' && forcedChainId !== currentChainId) {
      console.log(`[CHAIN_OVERRIDE] Using forced chain ${forcedChainId} instead of current chain ${currentChainId}`);
    }
    
    return forcedChainId;
  }
  
  // Second priority: Crosschain feature flag
  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  if (crosschainEnabled) {
    const coreChainId = getCoreChain();
    if (process.env.NODE_ENV === 'development' && coreChainId !== currentChainId) {
      console.log(`[CHAIN_OVERRIDE] Using core chain ${coreChainId} (crosschain enabled) instead of current chain ${currentChainId}`);
    }
    return coreChainId;
  }
  
  // Default: Use current chain
  return currentChainId;
}

/**
 * Check if chain forcing is enabled (either via env var or crosschain feature flag)
 */
export function isChainForcingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_CHAIN_ID !== undefined || isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
}

/**
 * Get the name of a chain for display purposes
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    // case AVAILABLE_CHAINS.RISE_TESTNET:
    //   return 'Rise Testnet';
    case AVAILABLE_CHAINS.RARI_TESTNET:
      return 'Rari Testnet';
    case AVAILABLE_CHAINS.APPCHAIN_TESTNET:
      return 'Appchain Testnet';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Hook to get the effective chain ID for contract interactions
 */
export function useEffectiveChainId(currentChainId: number): number {
  return getEffectiveChainId(currentChainId);
}

// Export available chains for reference
export { AVAILABLE_CHAINS };