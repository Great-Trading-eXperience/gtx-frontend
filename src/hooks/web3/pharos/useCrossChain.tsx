// CrossChainProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/configs/wagmi';
import type { HexAddress } from '@/types/general/address';
import HyperlaneABI from "@/abis/pharos/HyperlaneABI";
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';

/**
 * Network and domain configuration
 */
const NETWORK = {
  NAME: process.env.NEXT_PUBLIC_NETWORK || 'arbitrum-sepolia',
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '421614'
};

/**
 * Hyperlane configuration with router addresses
 */
const HYPERLANE = {
  MAILBOX: process.env.NEXT_PUBLIC_MAILBOX as HexAddress,
  ROUTER: {
    ARBITRUM_SEPOLIA: process.env.NEXT_PUBLIC_ROUTER_ARBITRUM_ADDRESS as HexAddress,
    GTXPRESSO: process.env.NEXT_PUBLIC_ROUTER_GTX_ADDRESS as HexAddress,
    PHAROS: process.env.NEXT_PUBLIC_ROUTER_PHAROS_ADDRESS as HexAddress,
  },
  DOMAIN: {
    ARBITRUM_SEPOLIA: Number(process.env.NEXT_PUBLIC_DESTINATION_DOMAIN) || 421614,
    GTXPRESSO: Number(process.env.NEXT_PUBLIC_TARGET_DOMAIN) || 1020201,
    PHAROS: Number(process.env.NEXT_PUBLIC_PHAROS_DOMAIN) || 11155931,
  },
};

// Helper function to get token addresses from contract-address.json
function getTokenAddress(chainId: string, tokenName: ContractName): HexAddress {
  try {
    return getContractAddress(chainId, tokenName) as HexAddress;
  } catch (error) {
    console.warn(`Failed to get address for ${tokenName} on chain ${chainId}:`, error);
    return '0x0000000000000000000000000000000000000000' as HexAddress;
  }
}

/**
 * Token addresses
 */
const TOKENS = {
  ARBITRUM_SEPOLIA: {
    WETH: getTokenAddress('421614', ContractName.weth),
    WBTC: getTokenAddress('421614', ContractName.wbtc),
    USDC: getTokenAddress('421614', ContractName.usdc),
    TRUMP: process.env.NEXT_PUBLIC_TRUMP_ADDRESS as HexAddress,
    PEPE: process.env.NEXT_PUBLIC_PEPE_ADDRESS as HexAddress,
    LINK: process.env.NEXT_PUBLIC_LINK_ADDRESS as HexAddress,
    DOGE: process.env.NEXT_PUBLIC_DOGE_ADDRESS as HexAddress,
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  },
  GTXPRESSO: {
    WETH: getTokenAddress('11155931', ContractName.weth),
    WBTC: getTokenAddress('11155931', ContractName.wbtc),
    USDC: getTokenAddress('11155931', ContractName.usdc),
    TRUMP: process.env.NEXT_PUBLIC_TRUMP_GTX_ADDRESS as HexAddress,
    LINK: process.env.NEXT_PUBLIC_LINK_GTX_ADDRESS as HexAddress,
    DOGE: process.env.NEXT_PUBLIC_DOGE_GTX_ADDRESS as HexAddress,
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  },
  PHAROS: {
    WETH: getTokenAddress('50002', ContractName.weth),
    WBTC: getTokenAddress('50002', ContractName.wbtc),
    USDC: getTokenAddress('50002', ContractName.usdc)
  }
};

// Get current domain ID
const getCurrentDomainId = async (router: HexAddress): Promise<number> => {
  try {
    // First try to get GTX host chain ID if available
    try {
      const gtxChainId = await readContract(
        wagmiConfig,
        {
          address: router,
          abi: HyperlaneABI,
          functionName: 'GTX_HOST_CHAIN_ID',
        }
      );
      if (gtxChainId) {
        return Number(gtxChainId);
      }
    } catch (gtxError) {
      console.warn('Failed to read GTX_HOST_CHAIN_ID:', gtxError);
    }

    // Fallback to localDomain
    const domain = await readContract(
      wagmiConfig,
      {
        address: router,
        abi: HyperlaneABI,
        functionName: 'localDomain',
      }
    );
    return Number(domain);
  } catch (err) {
    console.warn('Failed to read localDomain from contract:', err);
    // Fallback based on router address
    const isGtx = router.toLowerCase() === HYPERLANE.ROUTER.GTXPRESSO.toLowerCase();
    return isGtx ? HYPERLANE.DOMAIN.GTXPRESSO : HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

// Add new helper function to get GTX host chain ID
const getGtxHostChainId = async (router: HexAddress): Promise<number | null> => {
  try {
    const gtxChainId = await readContract(
      wagmiConfig,
      {
        address: router,
        abi: HyperlaneABI,
        functionName: 'GTX_HOST_CHAIN_ID',
      }
    );
    return gtxChainId ? Number(gtxChainId) : null;
  } catch (error) {
    console.warn('Failed to read GTX_HOST_CHAIN_ID:', error);
    return null;
  }
};

// Get domain ID for network
const getDomainId = (network: string): number => {
  switch (network) {
    case 'arbitrum-sepolia':
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
    case 'pharos':
      return HYPERLANE.DOMAIN.PHAROS;
    default:
      return HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

// Get router address for network
const getRouterAddressForNetwork = (network: string): HexAddress => {
  switch (network) {
    case 'arbitrum-sepolia':
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
    case 'pharos':
      return HYPERLANE.ROUTER.PHAROS;
    default:
      return HYPERLANE.ROUTER.ARBITRUM_SEPOLIA;
  }
};

// Get current router address
const getCurrentRouterAddress = (): HexAddress => {
  return getRouterAddressForNetwork(NETWORK.NAME);
};

// Get network tokens
const getNetworkTokens = (network: string): Record<string, HexAddress> => {
  switch (network) {
    case 'arbitrum-sepolia':
      return TOKENS.ARBITRUM_SEPOLIA;
    case 'pharos':
      return TOKENS.PHAROS;
    default:
      return TOKENS.ARBITRUM_SEPOLIA;
  }
};

// Get remote network based on current network
const getRemoteNetwork = (currentNetwork: string = NETWORK.NAME): string => {
  switch (currentNetwork) {
    case 'arbitrum-sepolia':
      return 'pharos';
    case 'pharos':
      return 'arbitrum-sepolia';
    default:
      return 'pharos';
  }
};

// Get remote router address based on current network
const getRemoteRouterAddress = (currentNetwork: string = NETWORK.NAME): HexAddress => {
  return getRouterAddressForNetwork(getRemoteNetwork(currentNetwork));
};

// Get remote domain ID based on current network
const getRemoteDomainId = (currentNetwork: string = NETWORK.NAME): number => {
  return getDomainId(getRemoteNetwork(currentNetwork));
};

// Check if a token is supported on a network
const isTokenSupportedOnNetwork = (token: HexAddress, network: string): boolean => {
  const networkTokens = getNetworkTokens(network);
  return Object.values(networkTokens).some(addr => addr.toLowerCase() === token.toLowerCase());
};

// Get equivalent token on remote network
const getEquivalentTokenOnNetwork = (
  token: HexAddress, 
  sourceNetwork: string, 
  targetNetwork: string
): HexAddress | null => {
  // Find the token symbol in source network
  const sourceTokens = getNetworkTokens(sourceNetwork);
  const tokenSymbol = Object.keys(sourceTokens).find(
    symbol => sourceTokens[symbol].toLowerCase() === token.toLowerCase()
  );
  
  if (!tokenSymbol) return null;
  
  // Get the equivalent token on target network
  const targetTokens = getNetworkTokens(targetNetwork);
  return targetTokens[tokenSymbol] || null;
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
  gtxHostChainId: number | null;
  // Helper functions
  getTokens: (network?: string) => Record<string, HexAddress>;
  getRemoteTokens: () => Record<string, HexAddress>;
  getDomainId: (network: string) => number;
  getRouterAddressForNetwork: (network: string) => HexAddress;
  isTokenSupportedOnNetwork: (token: HexAddress, network: string) => boolean;
  getEquivalentTokenOnNetwork: (token: HexAddress, sourceNetwork: string, targetNetwork: string) => HexAddress | null;
  // New helper functions for gas estimation
  estimateGasPayment: (sourceNetwork: string, destinationNetwork: string) => Promise<string>;
  getNetworkGasToken: (network: string) => { symbol: string, address: HexAddress };
  getGtxHostChainId: (router: HexAddress) => Promise<number | null>;
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
  gtxHostChainId: null,
  getTokens: (network?: string) => getNetworkTokens(network || NETWORK.NAME),
  getRemoteTokens: () => getNetworkTokens(getRemoteNetwork()),
  getDomainId,
  getRouterAddressForNetwork,
  isTokenSupportedOnNetwork,
  getEquivalentTokenOnNetwork,
  estimateGasPayment: async () => '0.0005',
  getNetworkGasToken: () => ({ symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' }),
  getGtxHostChainId,
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
  const [gtxHostChainId, setGtxHostChainId] = useState<number | null>(null);
  
  // Get static values
  const currentRouter = getCurrentRouterAddress();
  const remoteRouter = getRemoteRouterAddress();
  const currentNetwork = NETWORK.NAME;
  
  // Initialize provider
  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to read current domain from contract
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
          console.warn('Failed to read localDomain from contract:', domainError);
          domain = getDomainId(currentNetwork);
        }
        
        setCurrentDomain(Number(domain));
        setRemoteDomain(getRemoteDomainId(currentNetwork));
        
        // Read owner from contract
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
          console.warn('Failed to read owner from contract:', ownerError);
          owner = process.env.NEXT_PUBLIC_ROUTER_OWNER as HexAddress || 
                 '0x0000000000000000000000000000000000000000' as HexAddress;
        }
        
        setRouterOwner(owner);
        
        // Check if remote router is enrolled
        let isEnrolled = false;
        try {
          const remoteRouterBytes32 = await readContract(
            wagmiConfig,
            {
              address: currentRouter,
              abi: HyperlaneABI,
              functionName: 'routers',
              args: [getRemoteDomainId(currentNetwork)],
            }
          );
          
          // If remote router bytes32 is not all zeros, it's enrolled
          isEnrolled = remoteRouterBytes32 !== '0x0000000000000000000000000000000000000000000000000000000000000000';
        } catch (routerError) {
          console.warn('Failed to check remote router enrollment:', routerError);
          isEnrolled = false;
        }
        
        setIsRouterEnabled(isEnrolled);
        
        // Check if connected wallet is owner
        setIsReadOnly(isConnected ? owner.toLowerCase() !== address?.toLowerCase() : true);
        
        // Get GTX host chain ID
        const gtxId = await getGtxHostChainId(currentRouter);
        setGtxHostChainId(gtxId);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize CrossChainProvider:', error);
        // Set default values on error
        setCurrentDomain(getDomainId(currentNetwork));
        setRemoteDomain(getRemoteDomainId(currentNetwork));
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
          args: [getRemoteDomainId(currentNetwork)],
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
  
  // Get gas payment estimate for cross-chain transfer
  const estimateGasPayment = async (sourceNetwork: string, destinationNetwork: string): Promise<string> => {
    try {
      const sourceRouter = getRouterAddressForNetwork(sourceNetwork);
      const destinationDomain = getDomainId(destinationNetwork);
      
      const gasPayment = await readContract(
        wagmiConfig,
        {
          address: sourceRouter,
          abi: HyperlaneABI,
          functionName: 'quoteGasPayment',
          args: [destinationDomain],
        }
      );
      
      // Convert to ETH string (assuming 18 decimals)
      return (Number(gasPayment) / 10**18).toFixed(6);
    } catch (error) {
      console.warn('Failed to estimate gas payment:', error);
      // Return default estimate
      return '0.0005';
    }
  };
  
  // Get gas token for a network
  const getNetworkGasToken = (network: string) => {
    // Currently all networks use ETH as gas token
    return { 
      symbol: 'ETH', 
      address: '0x0000000000000000000000000000000000000000' as HexAddress 
    };
  };
  
  // Helper functions
  const getTokens = (network?: string) => getNetworkTokens(network || currentNetwork);
  const getRemoteTokens = () => getNetworkTokens(getRemoteNetwork(currentNetwork));
  
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
    gtxHostChainId,
    getTokens,
    getRemoteTokens,
    getDomainId,
    getRouterAddressForNetwork,
    isTokenSupportedOnNetwork,
    getEquivalentTokenOnNetwork,
    estimateGasPayment,
    getNetworkGasToken,
    getGtxHostChainId,
  };
  
  return (
    <CrossChainContext.Provider value={contextValue}>
      {children}
    </CrossChainContext.Provider>
  );
};

// Custom hook to use the context
export const useCrossChain = () => useContext(CrossChainContext);

// Export utility functions for standalone use
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
  getRemoteDomainId,
  getRouterAddressForNetwork,
  isTokenSupportedOnNetwork,
  getEquivalentTokenOnNetwork
};

export default CrossChainProvider;