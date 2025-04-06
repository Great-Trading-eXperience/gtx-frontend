"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ArrowUpDown, ChevronRight, ExternalLink, Wallet, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatUnits, parseUnits } from 'viem';

// import TokenNetworkSelector from './TokenNetworkSelector';
import type { HexAddress } from '@/types/web3/general/address';
import { useCrossChain } from '@/hooks/web3/espresso/useCrossChain';
import { useCrossChainOrder } from '@/hooks/web3/espresso/useCrossChainOrder';
import TokenNetworkSelector from './token-network-selector';

// Types for token and network selection
export interface Network {
  id: string;
  name: string;
  icon: string;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  address: HexAddress;
  description?: string;
}

const CrossChainOrderForm: React.FC = () => {
  const { address, isConnected } = useAccount();
  const {
    currentNetwork,
    currentDomain,
    remoteDomain,
    currentRouter,
    remoteRouter,
    getTokens,
    getDomainId,
    getRouterAddressForNetwork,
    estimateGasPayment,
    isTokenSupportedOnNetwork,
    getEquivalentTokenOnNetwork
  } = useCrossChain();

  // State for networks
  const [sourceNetworkId, setSourceNetworkId] = useState<string>(currentNetwork);
  const [destNetworkId, setDestNetworkId] = useState<string>(
    currentNetwork === 'arbitrum-sepolia' ? 'gtxpresso' : 'arbitrum-sepolia'
  );
  const [sourceNetworkRouter, setSourceNetworkRouter] = useState<HexAddress>(currentRouter);
  
  // State for tokens and amounts
  const [sourceTokensList, setSourceTokensList] = useState<Record<string, HexAddress>>(getTokens(sourceNetworkId));
  const [destTokensList, setDestTokensList] = useState<Record<string, HexAddress>>(getTokens(destNetworkId));
  const [amount, setAmount] = useState<string>('');
  const [estimatedReceived, setEstimatedReceived] = useState<string>('0');
  const [minReceived, setMinReceived] = useState<string>('0');
  const [gasFeesEth, setGasFeesEth] = useState<string>('0.0005');
  
  // Transaction status
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Token selector state
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const [isSellSelector, setIsSellSelector] = useState<boolean>(true);
  
  // Client-side rendering state
  const [isClient, setIsClient] = useState(false);
  
  // Initialize cross-chain order hook
  const { 
    createOrder, 
    getOrderStatus, 
    isProcessing, 
    txHash, 
    error 
  } = useCrossChainOrder(sourceNetworkRouter);

  // Networks for the selector
  const sourceNetworks: Network[] = [
    {
      id: 'arbitrum-sepolia',
      name: 'Arbitrum Sepolia',
      icon: '/network/arbitrum-spolia.png'
    }
  ];
  
  const destNetworks: Network[] = [
    {
      id: 'arbitrum-sepolia',
      name: 'Arbitrum Sepolia',
      icon: '/network/arbitrum-spolia.png'
    },
    {
      id: 'gtxpresso',
      name: 'GTXpresso',
      icon: '/network/gtx-update-dark.png'
    }
  ];

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
    return () => {
      // Clear any intervals on unmount
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Update source network router when source network changes
  useEffect(() => {
    if (sourceNetworkId) {
      const router = getRouterAddressForNetwork(sourceNetworkId);
      setSourceNetworkRouter(router);
      setSourceTokensList(getTokens(sourceNetworkId));
      console.log(`Updated source network router to: ${router} for network ${sourceNetworkId}`);
    }
  }, [sourceNetworkId, getRouterAddressForNetwork, getTokens]);

  // Update destination tokens when dest network changes
  useEffect(() => {
    if (destNetworkId) {
      setDestTokensList(getTokens(destNetworkId));
      console.log(`Updated destination network to: ${destNetworkId}`);
    }
  }, [destNetworkId, getTokens]);

  // Update gas fees when networks change
  useEffect(() => {
    const updateGasFees = async () => {
      if (sourceNetworkId && destNetworkId) {
        const gasEstimate = await estimateGasPayment(sourceNetworkId, destNetworkId);
        setGasFeesEth(gasEstimate);
      }
    };
    updateGasFees();
  }, [sourceNetworkId, destNetworkId, estimateGasPayment]);

  // Convert token addresses to Token objects for selector
  const convertTokensForSelector = (tokenAddresses: Record<string, HexAddress>, networkId: string): Token[] => {
    return Object.entries(tokenAddresses)
      .map(([symbol, address]) => {
        // Map token symbols to icon filenames
        const iconMap: Record<string, string> = {
          'WETH': 'eth.png',
          'ETH': 'eth.png',
          'BTC': 'bitcoin.png',
          'WBTC': 'bitcoin.png',
          'DOGE': 'doge.png',
          'LINK': 'link.png',
          'PEPE': 'pepe.png',
          'TRUMP': 'trump.png',
          'USDC': 'usdc.png',
          'SHIB': 'shiba.png',
          'FLOKI': 'floki.png',
          'NATIVE': 'eth.png'
        };
        
        const iconFilename = iconMap[symbol] || `${symbol.toLowerCase()}.png`;
        
        return {
          id: symbol.toLowerCase(),
          name: getTokenFullName(symbol),
          symbol: symbol,
          icon: `/tokens/${iconFilename}`,
          address: address,
          description: address.slice(0, 6) + '...' + address.slice(-4)
        };
      });
  };

  // Helper to get full token names
  const getTokenFullName = (symbol: string): string => {
    const nameMap: Record<string, string> = {
      'WETH': 'Wrapped Ethereum',
      'ETH': 'Ethereum',
      'USDC': 'USD Coin',
      'WBTC': 'Wrapped Bitcoin',
      'TRUMP': 'Trump Token',
      'PEPE': 'Pepe Token',
      'LINK': 'Chainlink',
      'DOGE': 'Dogecoin',
      'NATIVE': 'Ethereum'
    };
    return nameMap[symbol] || symbol;
  };

  // Prepare tokens for selector
  const tokensByNetwork: Record<string, Token[]> = {
    'arbitrum-sepolia': convertTokensForSelector(getTokens('arbitrum-sepolia'), 'arbitrum-sepolia'),
    'gtxpresso': convertTokensForSelector(getTokens('gtxpresso'), 'gtxpresso')
  };
  
  // Initialize with Arbitrum Sepolia as the source network
  useEffect(() => {
    setSourceNetworkId('arbitrum-sepolia');
    setSourceNetworkRouter(getRouterAddressForNetwork('arbitrum-sepolia'));
  }, []);

  // Default network selections
  const [sourceNetwork, setSourceNetwork] = useState<Network>(
    sourceNetworks.find(n => n.id === sourceNetworkId) || sourceNetworks[0]
  );
  const [destNetwork, setDestNetwork] = useState<Network>(
    destNetworks.find(n => n.id === destNetworkId) || destNetworks[1]
  );
  
  // Token selections
  const [sourceToken, setSourceToken] = useState<Token | null>(null);
  const [destToken, setDestToken] = useState<Token | null>(null);

  // Initialize default tokens
  useEffect(() => {
    if (tokensByNetwork[sourceNetworkId]?.length > 0 && !sourceToken) {
      // Always use WETH on Arbitrum as source token
      const defaultToken = tokensByNetwork[sourceNetworkId].find(t => t.symbol === 'WETH');
      if (defaultToken) {
        setSourceToken(defaultToken);
        console.log('Set default source token to WETH:', defaultToken);
      } else {
        setSourceToken(tokensByNetwork[sourceNetworkId][0]);
      }
    }

    if (tokensByNetwork[destNetworkId]?.length > 0 && !destToken) {
      // Default destination token to USDC
      const defaultToken = tokensByNetwork[destNetworkId].find(t => t.symbol === 'USDC');
      if (defaultToken) {
        setDestToken(defaultToken);
        console.log('Set default destination token to USDC:', defaultToken);
      } else {
        setDestToken(tokensByNetwork[destNetworkId][0]);
      }
    }
  }, [tokensByNetwork, sourceNetworkId, destNetworkId, sourceToken, destToken]);

  // Update estimated receive amount when inputs change
  useEffect(() => {
    if (amount && sourceToken && destToken) {
      // Calculate with a 0.25% fee
      const calculatedAmount = parseFloat(amount) * 0.9975;
      setEstimatedReceived(calculatedAmount.toFixed(6));
      setMinReceived((calculatedAmount * 0.995).toFixed(6)); // 0.5% slippage
    } else {
      setEstimatedReceived('0');
      setMinReceived('0');
    }
  }, [amount, sourceToken, destToken]);

  // Mock wallet balances for each token
  const getMockTokenBalance = (address: HexAddress | undefined, symbol: string): string => {
    if (!address) return "0";
    
    const balanceMap: Record<string, string> = {
      'WETH': '2.45',
      'ETH': '3.21',
      'NATIVE': '3.21',
      'BTC': '0.12',
      'WBTC': '0.09',
      'DOGE': '4200',
      'LINK': '156.78',
      'PEPE': '1250000',
      'TRUMP': '350.6',
      'USDC': '1240.50',
      'SHIB': '25000000',
      'FLOKI': '890000'
    };
    
    return balanceMap[symbol] || '0';
  };

  // Calculate USD values 
  const getTokenUsdPrice = (symbol: string): number => {
    const priceMap: Record<string, number> = {
      'WETH': 1800,
      'ETH': 1800,
      'NATIVE': 1800,
      'USDC': 1,
      'WBTC': 50000,
      'BTC': 50000,
      'TRUMP': 20,
      'PEPE': 0.000001,
      'LINK': 15,
      'DOGE': 0.1,
      'SHIB': 0.00001,
      'FLOKI': 0.0001
    };
    return priceMap[symbol] || 1;
  };
  
  // Calculate exchange ratio between tokens
  const calculateExchangeRatio = (sourceSymbol: string, destSymbol: string): string => {
    const sourcePrice = getTokenUsdPrice(sourceSymbol);
    const destPrice = getTokenUsdPrice(destSymbol);
    
    if (!sourcePrice || !destPrice) return '1';
    return (sourcePrice / destPrice).toFixed(6);
  };

  // USD values for display
  const sourceUsdPrice = sourceToken ? getTokenUsdPrice(sourceToken.symbol) : 0;
  const destUsdPrice = destToken ? getTokenUsdPrice(destToken.symbol) : 0;
  const sourceUsdValue = amount && sourceToken ? Number.parseFloat(amount || '0') * sourceUsdPrice : 0;
  const destUsdValue = estimatedReceived && destToken ? Number.parseFloat(estimatedReceived || '0') * destUsdPrice : 0;

  // Calculate fees
  const swapFee = amount && sourceToken ? (Number.parseFloat(amount || '0') * 0.0025).toFixed(6) : '0';

  // Handle amount change with validation
  const handleAmountChange = (value: string) => {
    // Only allow numbers and one decimal point
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');
    
    if (parts.length > 2) {
      // More than one decimal point, keep only the first one
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(filteredValue);
    }
  };

  // Open token selector
  const openTokenSelector = (isSell: boolean) => {
    setIsSellSelector(isSell);
    setSelectorOpen(true);
  };

  // Handle token/network selection
  const handleTokenNetworkSelect = (network: Network, token: Token) => {
    if (isSellSelector) {
      // Update source token only (network is fixed to Arbitrum Sepolia)
      setSourceToken(token);
      
      // Update destination token if needed for compatibility
      if (destToken && !isTokenSupportedOnNetwork(destToken.address, destNetworkId)) {
        const equivalentToken = getEquivalentTokenOnNetwork(token.address, sourceNetworkId, destNetworkId);
        if (equivalentToken) {
          const newDestToken = tokensByNetwork[destNetworkId].find(t => 
            t.address.toLowerCase() === equivalentToken.toLowerCase()
          );
          if (newDestToken) {
            setDestToken(newDestToken);
            toast.info(`Automatically selected ${newDestToken.symbol} as destination token`);
          }
        }
      }
    } else {
      // Update destination network and token
      setDestNetwork(network);
      setDestToken(token);
      setDestNetworkId(network.id);
      
      // Check if source token is compatible with new destination
      if (sourceToken && !isTokenSupportedOnNetwork(sourceToken.address, network.id)) {
        toast.info('Note: The selected token may not be directly supported on the destination chain');
      }
    }
  };

  // Swap source and destination tokens
  const handleSwap = () => {
    // Only allow swap if tokens exist on both chains
    if (sourceToken && destToken) {
      // Since we're restricting the source network to Arbitrum Sepolia,
      // we can only swap tokens if the destination is also Arbitrum Sepolia
      if (destNetworkId !== 'arbitrum-sepolia') {
        toast.warning('Cannot swap - source must be Arbitrum Sepolia');
        return;
      }
      
      const sourceTokenSupported = isTokenSupportedOnNetwork(sourceToken.address, destNetworkId);
      const destTokenSupported = isTokenSupportedOnNetwork(destToken.address, sourceNetworkId);
      
      if (!sourceTokenSupported || !destTokenSupported) {
        toast.warning('Cannot swap - tokens are not compatible across chains');
        return;
      }

      // Swap tokens only
      const tempToken = sourceToken;
      setSourceToken(destToken);
      setDestToken(tempToken);
    }
  };

  // Check order status periodically
  const startStatusChecking = (txHashToCheck: HexAddress) => {
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    // Set up status checking interval
    const interval = setInterval(async () => {
      try {
        const status = await getOrderStatus(txHashToCheck);
        setTxStatus(`Order status: ${status}`);
        
        if (status === 'SETTLED' || status === 'REFUNDED') {
          clearInterval(interval);
          setStatusCheckInterval(null);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }, 10000); // Check every 10 seconds
    
    setStatusCheckInterval(interval);
    
    // Auto-stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setStatusCheckInterval(null);
    }, 300000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || !sourceToken || !destToken) {
      toast.error('Please enter an amount and select tokens');
      return;
    }

    try {
      setTxStatus('Creating order...');

      const inputTokenAddress = sourceToken.address;
      const outputTokenAddress = destToken.address;
      const recipientAddress = address as HexAddress;
      
      // Get destination router and domain
      const destinationRouterAddress = getRouterAddressForNetwork(destNetwork.id);
      const destinationDomainId = getDomainId(destNetwork.id);
      const targetDomainId = destinationDomainId;
      
      // Always use specific target tokens based on the successful example
      let targetInputTokenAddress: HexAddress;
      let targetOutputTokenAddress: HexAddress;
      
      // If destination is GTXpresso from Arbitrum, use the pattern from successful example
      if (destNetworkId === 'gtxpresso' && sourceNetworkId === 'arbitrum-sepolia') {
        // Get the GTXpresso WETH token address for target input
        targetInputTokenAddress = getTokens('gtxpresso').WETH;
        // Use the Arbitrum WETH for target output
        targetOutputTokenAddress = getTokens('arbitrum-sepolia').WETH;
        console.log('Using cross-chain GTX pattern with WETH targets');
      } else {
        // Default values if not the specific Arbitrum->GTX case
        targetInputTokenAddress = outputTokenAddress;
        targetOutputTokenAddress = outputTokenAddress;
      }
      
      // Always use action 1 (Swap) for cross-chain transactions
      const action = sourceNetworkId !== destNetworkId ? 1 : 0;
      
      console.log(`Creating order with parameters:`, {
        router: sourceNetworkRouter,
        destinationRouter: destinationRouterAddress,
        destinationDomain: destinationDomainId,
        targetDomain: targetDomainId,
        inputToken: inputTokenAddress,
        outputToken: outputTokenAddress,
        targetInputToken: targetInputTokenAddress,
        targetOutputToken: targetOutputTokenAddress,
        amount,
        action
      });

      const result = await createOrder({
        recipient: recipientAddress,
        inputToken: inputTokenAddress,
        outputToken: outputTokenAddress,
        targetInputToken: targetInputTokenAddress,
        targetOutputToken: targetOutputTokenAddress,
        amountIn: amount,
        amountOut: minReceived, // Use min received amount with slippage
        destinationDomain: destinationDomainId,
        targetDomain: targetDomainId,
        destinationRouter: destinationRouterAddress,
        action: action, // Use action instead of orderAction
      });

      if (result?.success) {
  setTxStatus('Order created successfully!');
  
  if (result.txHash) {
    // No need to set txHash as it's already managed by the hook
    startStatusChecking(result.txHash);
  }
} else {
  const errorMessage = result?.error instanceof Error
    ? result.error.message
    : 'Unknown error';

  setTxStatus(`Order creation failed: ${errorMessage}`);
}
    } catch (err) {
      console.error('Error submitting order:', err);
      setTxStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Exchange rate for display
  const exchangeRate = sourceToken && destToken 
    ? calculateExchangeRatio(sourceToken.symbol, destToken.symbol)
    : '0';

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <Card className="border-white/20 bg-[#121212] p-4">
          <div className="mb-2 text-3xl font-bold text-white">Cross-Chain Bridge</div>
          {sourceToken && destToken && (
            <div className="mb-6 text-blue-500">
              <span>
                {`1 ${sourceToken.symbol} = ${exchangeRate} ${destToken.symbol}`}
              </span>
              <span className="ml-2 text-xs text-gray-400">
                (${getTokenUsdPrice(sourceToken.symbol)} → ${getTokenUsdPrice(destToken.symbol)})
              </span>
            </div>
          )}

          {/* Source Section */}
          <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="mb-2 text-sm text-gray-400">From {sourceNetwork?.name}</div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
              />
              <Button
                variant="outline"
                onClick={() => openTokenSelector(true)}
                className="flex h-12 items-center gap-2 rounded-full border-blue-500/20 bg-blue-500/10 px-4 text-white hover:bg-blue-500/20"
              >
                <div className="relative">
                  {sourceToken ? (
                    <img
                      src={sourceToken.icon}
                      alt={sourceToken.symbol}
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "/tokens/default-token.png";
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      ?
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#121212]">
                    <img
                      src={sourceNetwork?.icon}
                      alt={sourceNetwork?.name}
                      className="h-4 w-4 rounded-full"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "/network/default-network.png";
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{sourceToken?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{sourceNetwork?.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-400">${sourceUsdValue.toFixed(2)}</div>
              <div className="flex items-center text-sm text-blue-400">
                <Wallet className="mr-1 h-4 w-4" />
                <span>
                  {isClient
                    ? (isConnected 
                        ? `${getMockTokenBalance(address, sourceToken?.symbol || '')} ${sourceToken?.symbol || ''}`
                        : "Connect wallet")
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="relative flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="absolute -top-4 z-10 h-8 w-8 rounded-full border-white/10 bg-[#121212] text-gray-400 hover:bg-blue-600/20 hover:text-white transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination Section */}
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="mb-2 text-sm text-gray-400">To {destNetwork?.name}</div>
            <div className="flex items-center justify-between">
              {isProcessing ? (
                <Skeleton className="h-10 w-1/2 bg-gray-700/30" />
              ) : (
                <input
                  type="text"
                  value={estimatedReceived}
                  readOnly
                  placeholder="0.0"
                  className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
                />
              )}
              <Button
                variant="outline"
                onClick={() => openTokenSelector(false)}
                className="flex h-12 items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
              >
                <div className="relative">
                  {destToken ? (
                    <img
                      src={destToken.icon}
                      alt={destToken.symbol}
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "/tokens/default-token.png";
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      ?
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#121212]">
                    <img
                      src={destNetwork?.icon}
                      alt={destNetwork?.name}
                      className="h-4 w-4 rounded-full"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "/network/default-network.png";
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{destToken?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{destNetwork?.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-400">${destUsdValue.toFixed(2)}</div>
              <div className="flex items-center text-sm text-gray-400">
                <Wallet className="mr-1 h-4 w-4" />
                <span>
                  {isClient
                    ? (isConnected 
                        ? `${getMockTokenBalance(address, destToken?.symbol || '')} ${destToken?.symbol || ''}`
                        : "Connect wallet")
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mb-6 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Exchange rate</span>
                <span className="text-white">
                  1 {sourceToken?.symbol || '?'} = {exchangeRate} {destToken?.symbol || '?'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. received</span>
                <span className="text-white">{estimatedReceived} {destToken?.symbol || ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min. received</span>
                <span className="text-white">{minReceived} {destToken?.symbol || ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee (0.25%)</span>
                <span className="text-white">{swapFee} {sourceToken?.symbol || ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network fee</span>
                <span className="text-white">{gasFeesEth} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Source Router</span>
                <span className="text-white text-xs">{sourceNetworkRouter.slice(0, 6)}...{sourceNetworkRouter.slice(-4)}</span>
              </div>
            </div>
          </div>

          {/* Status display */}
          {txStatus && (
            <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-200">{txStatus}</div>
                {isProcessing && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
              </div>
              {txHash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"
                >
                  View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-blue-600 py-6 text-lg font-medium text-white hover:bg-blue-700 disabled:bg-blue-600/50"
            onClick={handleSubmit}
            disabled={isProcessing || !amount || !sourceToken || !destToken || !isConnected}
          >
            {isClient
              ? (!isConnected
                  ? 'Connect Wallet'
                  : isProcessing
                    ? 'Processing...'
                    : `Bridge to ${destNetwork?.name}`)
              : 'Loading...'}
          </Button>
        </Card>
      </div>

      {/* Only render the selector component client-side */}
      {isClient && (
        <TokenNetworkSelector
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          networks={isSellSelector ? sourceNetworks : destNetworks}
          tokens={tokensByNetwork}
          initialNetwork={isSellSelector ? sourceNetwork : destNetwork}
          onSelect={handleTokenNetworkSelect}
          title={isSellSelector ? "Select source token" : "Select destination token"}
        />
      )}
    </div>
  );
};

export default CrossChainOrderForm;