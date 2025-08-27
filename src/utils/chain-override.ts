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
 * Priority: 1. Forced chain (env var), 2. Current chain if supported, 3. Default to Appchain
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
  
  // Supported chains: Appchain Testnet and Arbitrum Sepolia
  const SUPPORTED_CHAINS = [
    AVAILABLE_CHAINS.APPCHAIN_TESTNET,  // 4661
    421614  // Arbitrum Sepolia
  ];
  
  // If current chain is supported, use it
  if (SUPPORTED_CHAINS.includes(currentChainId)) {
    return currentChainId;
  }
  
  // If current chain is not supported, default to Appchain
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CHAIN_OVERRIDE] Current chain ${currentChainId} not supported, defaulting to Appchain ${AVAILABLE_CHAINS.APPCHAIN_TESTNET}`);
  }
  
  return AVAILABLE_CHAINS.APPCHAIN_TESTNET;
}

/**
 * Check if chain forcing is enabled (only via env var, not crosschain feature flag)
 */
export function isChainForcingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_CHAIN_ID !== undefined;
}

/**
 * Check if current chain needs to be forced to a supported chain
 */
export function needsChainForcing(currentChainId: number): boolean {
  // If env var forcing is enabled, always force
  if (process.env.NEXT_PUBLIC_FORCE_CHAIN_ID !== undefined) {
    return true;
  }
  
  // Otherwise, only force if current chain is not supported
  const SUPPORTED_CHAINS = [4661, 421614]; // Appchain, Arbitrum Sepolia
  return !SUPPORTED_CHAINS.includes(currentChainId);
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