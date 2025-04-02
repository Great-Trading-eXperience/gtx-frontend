import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/configs/wagmi';
import type { HexAddress } from '@/types/web3/general/address';
import HyperlaneABI from "@/abis/espresso/HyperlaneABI";

/**
 * Network and domain configuration
 */
const NETWORK = {
  NAME: process.env.NEXT_PUBLIC_NETWORK || 'arbitrum-sepolia',
};

/**
 * Hyperlane configuration
 */
const HYPERLANE = {
  MAILBOX: process.env.NEXT_PUBLIC_MAILBOX as HexAddress,
  ROUTER: {
    ARBITRUM_SEPOLIA: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as HexAddress,
    GTXPRESSO: process.env.NEXT_PUBLIC_ROUTER_GTX_ADDRESS as HexAddress,
  },
  DOMAIN: {
    ARBITRUM_SEPOLIA: Number(process.env.NEXT_PUBLIC_DESTINATION_DOMAIN) || 421614,
    GTXPRESSO: Number(process.env.NEXT_PUBLIC_TARGET_DOMAIN) || 1020201,
  },
};

/**
 * Token addresses
 */
const TOKENS = {
  ARBITRUM_SEPOLIA: {
    WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS as HexAddress,
    WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS as HexAddress,
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as HexAddress,
    TRUMP: process.env.NEXT_PUBLIC_TRUMP_ADDRESS as HexAddress,
    PEPE: process.env.NEXT_PUBLIC_PEPE_ADDRESS as HexAddress,
    LINK: process.env.NEXT_PUBLIC_LINK_ADDRESS as HexAddress,
    DOGE: process.env.NEXT_PUBLIC_DOGE_ADDRESS as HexAddress,
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  },
  GTXPRESSO: {
    WETH: process.env.NEXT_PUBLIC_WETH_GTX_ADDRESS as HexAddress,
    WBTC: process.env.NEXT_PUBLIC_WBTC_GTX_ADDRESS as HexAddress,
    USDC: process.env.NEXT_PUBLIC_USDC_GTX_ADDRESS as HexAddress,
    TRUMP: process.env.NEXT_PUBLIC_TRUMP_GTX_ADDRESS as HexAddress,
    LINK: process.env.NEXT_PUBLIC_LINK_GTX_ADDRESS as HexAddress,
    DOGE: process.env.NEXT_PUBLIC_DOGE_GTX_ADDRESS as HexAddress,
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  }
};

/**
 * Get current domain ID
 */
const getCurrentDomainId = (): number => {
  switch (NETWORK.NAME) {
    case 'arbitrum-sepolia':
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return HYPERLANE.DOMAIN.GTXPRESSO;
    default:
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

/**
 * Get domain ID for a specific network
 */
const getDomainId = (network: string): number => {
  switch (network) {
    case 'arbitrum-sepolia':
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return HYPERLANE.DOMAIN.GTXPRESSO;
    default:
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

/**
 * Get current router address
 */
const getCurrentRouterAddress = (): HexAddress => {
  switch (NETWORK.NAME) {
    case 'arbitrum-sepolia':
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return HYPERLANE.ROUTER.GTXPRESSO;
    default:
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
  }
};

/**
 * Get network tokens
 */
const getNetworkTokens = (network: string): Record<string, HexAddress> => {
  switch (network) {
    case 'arbitrum-sepolia':
      return TOKENS.ARBITRUM_SEPOLIA;
    case 'gtxpresso':
      return TOKENS.GTXPRESSO;
    default:
      return TOKENS.ARBITRUM_SEPOLIA;
  }
};

/**
 * Get remote network based on current network
 */
const getRemoteNetwork = (): string => {
  switch (NETWORK.NAME) {
    case 'arbitrum-sepolia':
      return 'gtxpresso';
    case 'gtxpresso':
      return 'arbitrum-sepolia';
    default:
      return 'gtxpresso';
  }
};

/**
 * Get remote router address
 */
const getRemoteRouterAddress = (): HexAddress => {
  switch (NETWORK.NAME) {
    case 'arbitrum-sepolia':
      return HYPERLANE.ROUTER.GTXPRESSO;
    case 'gtxpresso':
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
    default:
      return HYPERLANE.ROUTER.GTXPRESSO;
  }
};

/**
 * Get remote domain ID
 */
const getRemoteDomainId = (): number => {
  switch (NETWORK.NAME) {
    case 'arbitrum-sepolia':
      return HYPERLANE.DOMAIN.GTXPRESSO;
    case 'gtxpresso':
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
    default:
      return HYPERLANE.DOMAIN.GTXPRESSO;
  }
};

// Context type definition
interface CrossChainContextType {
  isInitialized: boolean;
  currentNetwork: string;
  currentDomain: number | null;
  remoteDomain: number | null;
  currentRouter: HexAddress;
  remoteRouter: HexAddress;
  routerOwner: HexAddress | null;
  isRouterEnabled: boolean;
  checkRemoteRouter: () => Promise<boolean>;
  isReadOnly: boolean;
  // Add helper functions for easier access
  getTokens: (network?: string) => Record<string, HexAddress>;
  getRemoteTokens: () => Record<string, HexAddress>;
  getDomainId: (network: string) => number;
}

// Default context values
const defaultContextValue: CrossChainContextType = {
  isInitialized: false,
  currentNetwork: NETWORK.NAME,
  currentDomain: null,
  remoteDomain: null,
  currentRouter: getCurrentRouterAddress(),
  remoteRouter: getRemoteRouterAddress(),
  routerOwner: null,
  isRouterEnabled: false,
  checkRemoteRouter: async () => false,
  isReadOnly: true,
  getTokens: (network?: string) => getNetworkTokens(network || NETWORK.NAME),
  getRemoteTokens: () => getNetworkTokens(getRemoteNetwork()),
  getDomainId: getDomainId,
};

// Create context
const CrossChainContext = createContext<CrossChainContextType>(defaultContextValue);

// Provider component
export const CrossChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  
  // Context state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<number | null>(null);
  const [remoteDomain, setRemoteDomain] = useState<number | null>(null);
  const [routerOwner, setRouterOwner] = useState<HexAddress | null>(null);
  const [isRouterEnabled, setIsRouterEnabled] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  
  // Get static values
  const currentRouter = getCurrentRouterAddress();
  const remoteRouter = getRemoteRouterAddress();
  const currentNetwork = NETWORK.NAME;
  
  // Initialize provider
  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to read current domain from contract with fallback to hardcoded value
        let domain;
        try {
          domain = await readContract(
            wagmiConfig,
            {
              address: currentRouter,
              abi: HyperlaneABI,
              functionName: 'localDomain',
            }
          );
        } catch (domainError) {
          console.warn('Failed to read localDomain from contract, using fallback value:', domainError);
          domain = getCurrentDomainId();
        }
        
        setCurrentDomain(Number(domain));
        setRemoteDomain(getRemoteDomainId());
        
        // Read owner from contract with fallback
        let owner;
        try {
          owner = await readContract(
            wagmiConfig,
            {
              address: currentRouter,
              abi: HyperlaneABI,
              functionName: 'owner',
            }
          ) as HexAddress;
        } catch (ownerError) {
          console.warn('Failed to read owner from contract, using default value:', ownerError);
          owner = process.env.NEXT_PUBLIC_ROUTER_OWNER as HexAddress || 
                 '0x0000000000000000000000000000000000000000' as HexAddress;
        }
        
        setRouterOwner(owner);
        
        // Check if remote router is enrolled with fallback
        let isEnrolled = false;
        try {
          const remoteRouterBytes32 = await readContract(
            wagmiConfig,
            {
              address: currentRouter,
              abi: HyperlaneABI,
              functionName: 'routers',
              args: [getRemoteDomainId()],
            }
          );
          
          // If remote router bytes32 is not all zeros, it's enrolled
          isEnrolled = remoteRouterBytes32 !== '0x0000000000000000000000000000000000000000000000000000000000000000';
        } catch (routerError) {
          console.warn('Failed to check remote router enrollment, assuming not enrolled:', routerError);
          isEnrolled = false;
        }
        
        setIsRouterEnabled(isEnrolled);
        
        // Check if connected wallet is owner or read-only
        setIsReadOnly(isConnected ? owner.toLowerCase() !== address?.toLowerCase() : true);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize CrossChainProvider:', error);
        // Set default values on error
        setCurrentDomain(getCurrentDomainId());
        setRemoteDomain(getRemoteDomainId());
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, [currentRouter, address, isConnected, currentNetwork]);
  
  // Check if remote router is enrolled
  const checkRemoteRouter = async (): Promise<boolean> => {
    try {
      const remoteRouterBytes32 = await readContract(
        wagmiConfig,
        {
          address: currentRouter,
          abi: HyperlaneABI,
          functionName: 'routers',
          args: [getRemoteDomainId()],
        }
      );
      
      const isEnabled = remoteRouterBytes32 !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      setIsRouterEnabled(isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('Failed to check remote router:', error);
      return false;
    }
  };
  
  // Helper functions
  const getTokens = (network?: string) => getNetworkTokens(network || currentNetwork);
  const getRemoteTokens = () => getNetworkTokens(getRemoteNetwork());
  
  // Context value
  const contextValue: CrossChainContextType = {
    isInitialized,
    currentNetwork,
    currentDomain,
    remoteDomain,
    currentRouter,
    remoteRouter,
    routerOwner,
    isRouterEnabled,
    checkRemoteRouter,
    isReadOnly,
    getTokens,
    getRemoteTokens,
    getDomainId,
  };
  
  return (
    <CrossChainContext.Provider value={contextValue}>
      {children}
    </CrossChainContext.Provider>
  );
};

// Custom hook to use the context
export const useCrossChain = () => useContext(CrossChainContext);

// Export all helper functions for potential standalone use
export {
  NETWORK,
  HYPERLANE,
  TOKENS,
  getCurrentDomainId,
  getDomainId,
  getCurrentRouterAddress,
  getNetworkTokens,
  getRemoteNetwork,
  getRemoteRouterAddress,
  getRemoteDomainId
};

export default CrossChainProvider;