// useCrossChain.ts - Improved Pharos version
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { wagmiConfig } from '@/configs/wagmi';
import type { HexAddress } from '@/types/general/address';
import HyperlaneABI from "@/abis/pharos/HyperlaneABI";
import { ContractName, 
  DESTINATION_DOMAIN, 
  NETWORK as CONFIG_NETWORK,
  DEFAULT_CHAIN, MAILBOX_ADDRESS, getContractAddress } from '@/constants/contract/contract-address';

/**
 * Network and domain configuration
 */
const NETWORK = {
  NAME: CONFIG_NETWORK || 'arbitrum-sepolia',
  CHAIN_ID: DEFAULT_CHAIN || '421614'
};

/**
 * Hyperlane configuration with router addresses
 */
const HYPERLANE = {
  MAILBOX: MAILBOX_ADDRESS as HexAddress,
  ROUTER: {
    ARBITRUM_SEPOLIA: getContractAddress('421614', ContractName.router) as HexAddress,
    PHAROS: getContractAddress('50002', ContractName.openIntentRouter) as HexAddress, // Using openIntentRouter for Pharos
  },
  DOMAIN: {
    ARBITRUM_SEPOLIA: Number(DESTINATION_DOMAIN) || 421614,
    PHAROS: 50002, // Using Pharos chain ID from your contract-address.json
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
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  },
  PHAROS: {
    WETH: getTokenAddress('50002', ContractName.weth),
    WBTC: getTokenAddress('50002', ContractName.wbtc),
    USDC: getTokenAddress('50002', ContractName.usdc),
    NATIVE: '0x0000000000000000000000000000000000000000' as HexAddress,
  }
};

// Get current domain ID with improved GTX chain ID handling
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
        console.log('Using GTX_HOST_CHAIN_ID:', gtxChainId);
        return Number(gtxChainId);
      }
    } catch (gtxError) {
      console.warn('Failed to read GTX_HOST_CHAIN_ID, falling back to localDomain:', gtxError);
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
    console.warn('Failed to read domain from contract, using fallback:', err);
    // Fallback based on router address
    const isPharos = router.toLowerCase() === HYPERLANE.ROUTER.PHAROS.toLowerCase();
    return isPharos ? HYPERLANE.DOMAIN.PHAROS : HYPERLANE.DOMAIN.ARBITRUM_SEPOLIA;
  }
};

// Get GTX router address
const getGtxRouterAddress = async (router: HexAddress): Promise<HexAddress | null> => {
  try {
    const gtxRouter = await readContract(
      wagmiConfig,
      {
        address: router,
        abi: HyperlaneABI,
        functionName: 'GTX_ROUTER_ADDRESS',
      }
    ) as HexAddress;
    
    return gtxRouter;
  } catch (error) {
    console.warn('Failed to read GTX_ROUTER_ADDRESS:', error);
    return null;
  }
};

// Get GTX balance manager
const getGtxBalanceManager = async (router: HexAddress): Promise<HexAddress | null> => {
  try {
    const balanceManager = await readContract(
      wagmiConfig,
      {
        address: router,
        abi: HyperlaneABI,
        functionName: 'GTX_BALANCE_MANAGER_ADDRESS',
      }
    ) as HexAddress;
    
    return balanceManager;
  } catch (error) {
    console.warn('Failed to read GTX_BALANCE_MANAGER_ADDRESS:', error);
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

// Enhanced type definition that includes GTX-specific properties
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
  // GTX-specific properties
  gtxHostChainId: number | null;
  gtxRouterAddress: HexAddress | null;
  gtxBalanceManager: HexAddress | null;
  // Helper functions
  getTokens: (network?: string) => Record<string, HexAddress>;
  getRemoteTokens: () => Record<string, HexAddress>;
  getDomainId: (network: string) => number;
  getRouterAddressForNetwork: (network: string) => HexAddress;
  isTokenSupportedOnNetwork: (token: HexAddress, network: string) => boolean;
  getEquivalentTokenOnNetwork: (token: HexAddress, sourceNetwork: string, targetNetwork: string) => HexAddress | null;
  // Gas estimation functions
  estimateGasPayment: (sourceNetwork: string, destinationNetwork: string) => Promise<string>;
  getNetworkGasToken: (network: string) => { symbol: string, address: HexAddress };
  // Contract status checks
  getContractStatus: (orderId: string) => Promise<string>;
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
  gtxRouterAddress: null,
  gtxBalanceManager: null,
  getTokens: (network?: string) => getNetworkTokens(network || NETWORK.NAME),
  getRemoteTokens: () => getNetworkTokens(getRemoteNetwork()),
  getDomainId,
  getRouterAddressForNetwork,
  isTokenSupportedOnNetwork,
  getEquivalentTokenOnNetwork,
  estimateGasPayment: async () => '0.0005',
  getNetworkGasToken: () => ({ symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' }),
  getContractStatus: async () => 'UNKNOWN',
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
  const [gtxRouterAddress, setGtxRouterAddress] = useState<HexAddress | null>(null);
  const [gtxBalanceManager, setGtxBalanceManager] = useState<HexAddress | null>(null);
  
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
          // First check for GTX_HOST_CHAIN_ID
          try {
            const gtxChainId = await readContract(
              wagmiConfig,
              {
                address: currentRouter,
                abi: HyperlaneABI,
                functionName: 'GTX_HOST_CHAIN_ID',
              }
            );
            
            if (gtxChainId) {
              setGtxHostChainId(Number(gtxChainId));
              domain = gtxChainId;
            }
          } catch (gtxError) {
            console.warn('No GTX_HOST_CHAIN_ID available:', gtxError);
          }
          
          // If no GTX chain ID, try localDomain
          if (!domain) {
            domain = await readContract(
              wagmiConfig,
              {
                address: currentRouter,
                abi: HyperlaneABI,
                functionName: 'localDomain',
              }
            );
          }
        } catch (domainError) {
          console.warn('Failed to read domain from contract:', domainError);
          domain = getDomainId(currentNetwork);
        }
        
        setCurrentDomain(Number(domain));
        setRemoteDomain(getRemoteDomainId(currentNetwork));
        
        // Get GTX-specific configuration
        try {
          const gtxRouter = await getGtxRouterAddress(currentRouter);
          if (gtxRouter) setGtxRouterAddress(gtxRouter);
          
          const balanceManager = await getGtxBalanceManager(currentRouter);
          if (balanceManager) setGtxBalanceManager(balanceManager);
        } catch (gtxConfigError) {
          console.warn('Failed to get GTX configuration:', gtxConfigError);
        }
        
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
  
  // Get gas payment estimate for cross-chain transfer using contract methods
  const estimateGasPayment = async (sourceNetwork: string, destinationNetwork: string): Promise<string> => {
    try {
      const sourceRouter = getRouterAddressForNetwork(sourceNetwork);
      const destinationDomain = getDomainId(destinationNetwork);
      
      // First try quoteGasPayment
      try {
        const gasPayment = await readContract(
          wagmiConfig,
          {
            address: sourceRouter,
            abi: HyperlaneABI,
            functionName: 'quoteGasPayment',
            args: [destinationDomain],
          }
        );
        
        return (Number(gasPayment) / 10**18).toFixed(6);
      } catch (quoteError) {
        console.warn('Failed to use quoteGasPayment, trying destinationGas:', quoteError);
        
        // Try destinationGas as fallback
        const destinationGas = await readContract(
          wagmiConfig,
          {
            address: sourceRouter,
            abi: HyperlaneABI,
            functionName: 'destinationGas',
            args: [destinationDomain],
          }
        );
        
        return (Number(destinationGas) / 10**18).toFixed(6);
      }
    } catch (error) {
      console.warn('All gas estimation methods failed:', error);
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
  
  // Check order status directly from contract
  const getContractStatus = async (orderId: string): Promise<string> => {
    try {
      // Try to get status constants
      const OPENED = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'OPENED',
      });
      
      const FILLED = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'FILLED',
      });
      
      const SETTLED = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'SETTLED',
      });
      
      const REFUNDED = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'REFUNDED',
      });
      
      const UNKNOWN = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'UNKNOWN',
      });
      
      // Get actual status
      const status = await readContract(wagmiConfig, {
        address: currentRouter,
        abi: HyperlaneABI,
        functionName: 'orderStatus',
        args: [orderId],
      });
      
      // Map to status strings
      if (status === OPENED) return 'OPENED';
      if (status === FILLED) return 'FILLED';
      if (status === SETTLED) return 'SETTLED';
      if (status === REFUNDED) return 'REFUNDED';
      if (status === UNKNOWN) return 'UNKNOWN';
      
      return 'PROCESSING';
    } catch (error) {
      console.warn('Failed to get order status:', error);
      return 'UNKNOWN';
    }
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
    gtxRouterAddress,
    gtxBalanceManager,
    getTokens,
    getRemoteTokens,
    getDomainId,
    getRouterAddressForNetwork,
    isTokenSupportedOnNetwork,
    getEquivalentTokenOnNetwork,
    estimateGasPayment,
    getNetworkGasToken,
    getContractStatus,
  };
  
  return (
    <CrossChainContext.Provider value={contextValue}>
      {children}
    </CrossChainContext.Provider>
  );
};

// Custom hook to use the context
export const useCrossChainPharos = () => useContext(CrossChainContext);

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