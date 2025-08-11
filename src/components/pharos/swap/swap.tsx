"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ArrowUpDown, ChevronRight, ExternalLink, Wallet, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatUnits, parseUnits } from 'viem';

import type { HexAddress } from '@/types/general/address';
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

const LocalSwapForm: React.FC = () => {
  const { address, isConnected } = useAccount();


  const [amount, setAmount] = useState<string>('');
  const [estimatedReceived, setEstimatedReceived] = useState<string>('0');
  const [minReceived, setMinReceived] = useState<string>('0');

  // Transaction status - add local swap transaction state
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [swapTxHash, setSwapTxHash] = useState<HexAddress | null>(null);
  const [isSwapProcessing, setIsSwapProcessing] = useState<boolean>(false);

  // Token selector state
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const [isSellSelector, setIsSellSelector] = useState<boolean>(true);

  // Client-side rendering state
  const [isClient, setIsClient] = useState(false);

  // Token list for Arbitrum Sepolia
  const getTokens = () => ({
    'WETH': '0x567a076beef17758952b05b1bc639e6cdd1a31ec' as HexAddress,
    'USDC': '0x97668aec1d8deaf34d899c4f6683f9ba877485f6' as HexAddress,
    'WBTC': '0xc6b3109e45f7a479ac324e014b6a272e4a25bf0e' as HexAddress,
  });

  // Single network for local swaps
  const network: Network = {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    icon: '/network/arbitrum-spolia.png'
  };

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);


  // Convert token addresses to Token objects for selector
  const convertTokensForSelector = (tokenAddresses: Record<string, HexAddress>): Token[] => {
    return Object.entries(tokenAddresses)
      .filter(([_, address]) => !!address) // Only include tokens with a defined address
      .map(([symbol, address]) => {
        // Map token symbols to icon filenames
        const iconMap: Record<string, string> = {
          'WETH': 'eth.png',
          'USDC': 'usdc.png',
          'WBTC': 'bitcoin.png'
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
      'USDC': 'USD Coin',
      'WBTC': 'Wrapped Bitcoin'
    };
    return nameMap[symbol] || symbol;
  };

  // Prepare tokens for selector
  const availableTokens: Token[] = convertTokensForSelector(getTokens());

  // Network ID for local swaps (Arbitrum Sepolia)
  const networkId = 'arbitrum-sepolia';

  // Token selections
  const [sourceToken, setSourceToken] = useState<Token | null>(null);
  const [destToken, setDestToken] = useState<Token | null>(null);

  // Initialize default tokens
  useEffect(() => {
    if (availableTokens.length > 0) {
      if (!sourceToken) {
        const defaultSourceToken = availableTokens.find(t => t.symbol === 'WETH') || availableTokens[0];
        setSourceToken(defaultSourceToken);
      }
      if (!destToken) {
        const defaultDestToken = availableTokens.find(t => t.symbol === 'USDC') || availableTokens[1];
        setDestToken(defaultDestToken);
      }
    }
  }, [availableTokens, sourceToken, destToken]);

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
      'USDC': '1240.50',
      'WBTC': '0.09'
    };

    return balanceMap[symbol] || '0';
  };

  // Calculate USD values 
  const getTokenUsdPrice = (symbol: string): number => {
    const priceMap: Record<string, number> = {
      'WETH': 1800,
      'USDC': 1,
      'WBTC': 50000
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

  // Handle token selection (simplified for local swaps)
  const handleTokenSelect = (token: Token) => {
    if (isSellSelector) {
      setSourceToken(token);
    } else {
      setDestToken(token);
    }
  };

  // Swap source and destination tokens
  const handleSwap = () => {
    if (sourceToken && destToken) {
      const tempToken = sourceToken;
      setSourceToken(destToken);
      setDestToken(tempToken);
    }
  };


  // Handle form submission with swap implementation
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
      setIsSwapProcessing(true);
      setTxStatus('Preparing swap...');

      const srcAmount = parseUnits(amount, sourceToken.symbol === 'USDC' ? 6 : 18);
      const minDstAmount = parseUnits(minReceived, destToken.symbol === 'USDC' ? 6 : 18);

      // Import necessary utilities
      const { writeContract, waitForTransactionReceipt, readContract } = await import('wagmi/actions');
      const { erc20Abi } = await import('viem');
      const { wagmiConfig } = await import('@/configs/wagmi');
      const GTXRouterABI = (await import('@/abis/gtx/clob/GTXRouterABI')).default;
      const { getContractAddress, ContractName } = await import('@/constants/contract/contract-address');

      // Get router address - use chainId 421614 for Arbitrum Sepolia
      const routerAddress = getContractAddress(421614, ContractName.clobRouter) as HexAddress;
      
      // Check and approve source token if needed
      setTxStatus('Checking token approval...');
      
      const currentAllowance = await readContract(wagmiConfig, {
        address: sourceToken.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, routerAddress],
      }) as bigint;

      if (currentAllowance < srcAmount) {
        setTxStatus('Requesting token approval...');
        
        const approvalHash = await writeContract(wagmiConfig, {
          address: sourceToken.address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [routerAddress, srcAmount],
        });

        setTxStatus('Waiting for approval confirmation...');
        
        const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: approvalHash
        });

        if (approvalReceipt.status !== 'success') {
          throw new Error('Token approval failed');
        }
        
        toast.success('Token approval confirmed');
      }

      // Execute swap
      setTxStatus('Executing swap...');
      
      const swapHash = await writeContract(wagmiConfig, {
        address: routerAddress,
        abi: GTXRouterABI,
        functionName: 'swap',
        args: [
          sourceToken.address,
          destToken.address,
          srcAmount,
          minDstAmount,
          2, // maxHops
          address
        ],
      });

      setSwapTxHash(swapHash);
      setTxStatus('Waiting for swap confirmation...');
      
      const swapReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: swapHash
      });

      if (swapReceipt.status === 'success') {
        toast.success('Swap completed successfully!');
        setTxStatus('Swap completed successfully!');
        // Reset form
        setAmount('');
        setEstimatedReceived('0');
        setMinReceived('0');
      } else {
        throw new Error('Swap transaction failed');
      }

    } catch (err) {
      console.error('Error executing swap:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setTxStatus(`Error: ${errorMessage}`);
      toast.error(`Swap failed: ${errorMessage}`);
    } finally {
      setIsSwapProcessing(false);
    }
  };

  // Exchange rate for display
  const exchangeRate = sourceToken && destToken
    ? calculateExchangeRatio(sourceToken.symbol, destToken.symbol)
    : '0';

  // Helper to safely format token display
  const formatTokenDisplay = (token: Token | null) =>
    token && token.address
      ? `${token.name} (${token.symbol}) ${token.address.slice(0, 6)}...${token.address.slice(-4)}`
      : '';

  const getExplorerUrl = (networkId: string, txHash: string): string => {
    switch (networkId) {
      case 'arbitrum-sepolia':
        return `https://sepolia.arbiscan.io/tx/${txHash}`;
      case 'pharos':
        return `https://pharosscan.xyz/tx/${txHash}`;
      case 'gtxpresso':
        return `https://gtx-explorer.xyz/tx/${txHash}`;
      default:
        // Default fallback to Pharos explorer
        return `https://pharosscan.xyz/tx/${txHash}`;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      {/* <DotPattern /> */}
      <div className="w-full max-w-md relative z-10">
        <Card className="border-white/20 bg-[#121212] p-4">
          <div className="mb-2 text-3xl font-bold text-white">Swap</div>
          {/* Source Section */}
          <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
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
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{sourceToken?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{network.name}</span>
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
            <div className="flex items-center justify-between">
              {isSwapProcessing ? (
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
                      src={network.icon}
                      alt={network.name}
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
                  <span className="text-xs text-gray-400">{network.name}</span>
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
            </div>
          </div>

          {/* Status display */}
          {txStatus && (
            <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-200">{txStatus}</div>
                {isSwapProcessing && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
              </div>
              {swapTxHash && (
                <a
                  href={getExplorerUrl(networkId, swapTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"
                >
                  View on {network.name} Explorer <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
              {sourceToken && destToken && (
                <div className="mt-2 text-xs text-gray-400">
                  Swap from {sourceToken.symbol} to {destToken.symbol} on {network.name}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-blue-600 py-6 text-lg font-medium text-white hover:bg-blue-700 disabled:bg-blue-600/50"
            onClick={handleSubmit}
            disabled={isSwapProcessing || !amount || !sourceToken || !destToken || !isConnected}
          >
            {isClient
              ? (!isConnected
                ? 'Connect Wallet'
                : isSwapProcessing
                  ? 'Processing...'
                  : 'Swap')
              : 'Loading...'}
          </Button>

          {/* Native token warning */}
          {sourceToken && sourceToken.address === '0x0000000000000000000000000000000000000000' && (
            <div className="mt-2 text-xs text-amber-500">
              You&apos;re using a native token. Both the token amount and gas fees will be sent from your wallet.
            </div>
          )}
        </Card>
      </div>

      {/* Only render the selector component client-side */}
      {isClient && (
        <TokenNetworkSelector
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          networks={[network]}
          tokens={{[networkId]: availableTokens}}
          initialNetwork={network}
          onSelect={(network: Network, token: Token) => handleTokenSelect(token)}
          title={isSellSelector ? "Select source token" : "Select destination token"}
        />
      )}
    </div>
  );
};

export default LocalSwapForm;