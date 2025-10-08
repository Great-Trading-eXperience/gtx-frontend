"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ChevronRight, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useAccount } from 'wagmi';

import type { HexAddress } from '@/types/general/address';

// Type for token selection
export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  address: HexAddress;
  description?: string;
}

const SwapForm: React.FC = () => {
  const { address, isConnected } = useAccount();

  // Processing state for swap
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<HexAddress | null>(null);

  // State for tokens and amounts - simplified for single network swap
  const availableTokens: Record<string, HexAddress> = {
    'WETH': '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as HexAddress,
    'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as HexAddress,
    'NATIVE': '0x0000000000000000000000000000000000000000' as HexAddress
  };
  const [amount, setAmount] = useState<string>('');
  const [estimatedReceived, setEstimatedReceived] = useState<string>('0');
  const [minReceived, setMinReceived] = useState<string>('0');
  const [gasFeesEth] = useState<string>('0.0005');

  // Transaction status
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Token selector state
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const [isSellSelector, setIsSellSelector] = useState<boolean>(true);

  // Client-side rendering state
  const [isClient, setIsClient] = useState(false);

  // Network info - fixed to Arbitrum Sepolia
  const networkInfo = {
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

  // Prepare tokens for selector - single network
  const availableTokensList: Token[] = convertTokensForSelector(availableTokens);

  // Token selections
  const [sourceToken, setSourceToken] = useState<Token | null>(null);
  const [destToken, setDestToken] = useState<Token | null>(null);

  // Initialize default tokens
  useEffect(() => {
    if (availableTokensList.length > 0 && !sourceToken) {
      // Always use WETH as source token
      const defaultToken = availableTokensList.find(t => t.symbol === 'WETH');
      if (defaultToken) {
        setSourceToken(defaultToken);
        console.log('Set default source token to WETH:', defaultToken);
      } else {
        setSourceToken(availableTokensList[0]);
      }
    }

    if (availableTokensList.length > 0 && !destToken) {
      // Default destination token to USDC
      const defaultToken = availableTokensList.find(t => t.symbol === 'USDC');
      if (defaultToken) {
        setDestToken(defaultToken);
        console.log('Set default destination token to USDC:', defaultToken);
      } else {
        setDestToken(availableTokensList[0]);
      }
    }
  }, [availableTokensList, sourceToken, destToken]);

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
  // TODO
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

  // Handle token selection
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

  // Simple swap function - calls GTXRouter.swap
  const executeSwap = async (
    _srcTokenAddress: HexAddress,
    _dstTokenAddress: HexAddress,
    _srcAmount: string,
    _minDstAmount: string
  ) => {
    try {
      setIsProcessing(true);
      setTxStatus('Executing swap...');
      
      // This would call the GTXRouter contract's swap function
      // gtxRouter.swap(Currency.wrap(srcTokenAddress), Currency.wrap(dstTokenAddress), srcAmount, minDstAmount, maxHops, user)
      
      // For now, simulate a successful swap
      const mockTxHash = '0x1234567890abcdef1234567890abcdef12345678' as HexAddress;
      setTxHash(mockTxHash);
      setTxStatus('Swap completed successfully!');
      
      return { success: true, txHash: mockTxHash };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTxStatus(`Swap failed: ${errorMessage}`);
      throw err;
    } finally {
      setIsProcessing(false);
    }
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

    if (sourceToken.address === destToken.address) {
      toast.error('Cannot swap identical tokens');
      return;
    }

    try {
      const result = await executeSwap(
        sourceToken.address,
        destToken.address,
        amount,
        minReceived
      );

      if (result?.success) {
        toast.success('Swap completed successfully!');
      }
    } catch (err) {
      console.error('Error executing swap:', err);
      toast.error('Swap failed');
    }
  };

  // Exchange rate for display
  const exchangeRate = sourceToken && destToken
    ? calculateExchangeRatio(sourceToken.symbol, destToken.symbol)
    : '0';

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md relative z-10">
        <Card className="border-white/20 bg-[#121212] p-4">
          <div className="mb-2 text-3xl font-bold text-white">Swap</div>
          {/* Source Section */}
          <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="mb-2 text-sm text-gray-400">You pay</div>
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
                        target.src = "/tokens/eth.png";
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
            <div className="mb-2 text-sm text-gray-400">You receive</div>
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
                        target.src = "/tokens/eth.png";
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      ?
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{destToken?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{networkInfo.name}</span>
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
                <span className="text-gray-400">Est. received</span>
                <span className="text-white">{estimatedReceived} {destToken?.symbol || ''}</span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min. received</span>
                <span className="text-white">{minReceived} {destToken?.symbol || ''}</span>
              </div> */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee (0.2%)</span>
                <span className="text-white">{swapFee} {sourceToken?.symbol || ''}</span>
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
                  : `Swap`)
              : 'Loading...'}
          </Button>
        </Card>
      </div>

      {/* Simple Token Selector Modal */}
      {isClient && selectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#121212] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {isSellSelector ? "Select source token" : "Select destination token"}
              </h3>
              <button
                onClick={() => setSelectorOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {availableTokensList.map((token) => (
                <button
                  key={token.id}
                  onClick={() => {
                    handleTokenSelect(token);
                    setSelectorOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-left"
                >
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="h-8 w-8 rounded-full"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = "/tokens/eth.png";
                    }}
                  />
                  <div>
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-gray-400 text-sm">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapForm;