"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ChevronRight, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from "sonner";
import { useAccount, useChainId } from 'wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { useWallets } from '@privy-io/react-auth';

import type { HexAddress } from '@/types/general/address';
import { DotPattern } from '../magicui/dot-pattern';
import { useSwap } from '@/hooks/web3/gtx/clob-dex/gtx-router/useSwap';
import { useCalculateMinOutForSwap } from '@/hooks/web3/gtx/clob-dex/gtx-router/useCalculateMinOutForSwap';
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import { useTradingBalances } from '@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { useAvailableTokens } from '@/hooks/web3/gtx/clob-dex/gtx-router/useAvailableTokens';
import { formatUnits } from 'viem';

// Type for token selection
export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  address: HexAddress;
  description?: string;
  decimals?: number;
}

const SwapForm: React.FC = () => {
  const { isConnected, address: wagmiAddress } = useAccount();
  const { isFullyAuthenticated } = usePrivyAuth();
  const { wallets } = useWallets();
  const currentChainId = useChainId();
  
  const embedded = wallets.find(wallet => wallet.walletClientType === 'privy');
  
  const effectiveIsConnected = isConnected || isFullyAuthenticated;
  
  let walletType: 'external' | 'embedded' | 'none';
  let actualAddress: HexAddress | undefined;
  
  if (isFullyAuthenticated && embedded?.address) {
    walletType = 'embedded';
    actualAddress = embedded.address as HexAddress;
  } else if (isConnected && wagmiAddress) {
    walletType = 'external';
    actualAddress = wagmiAddress;
  } else {
    walletType = 'none';
    actualAddress = undefined;
  }

  const useEmbeddedWallet = walletType === 'embedded';

  const balanceManagerAddress = getContractAddress(
    currentChainId,
    ContractName.clobBalanceManager
  ) as HexAddress;

  const {
    handleSwap: executeSwapWithHook,
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
    swapHash,
    swapError,
    resetSwapState
  } = useSwap(actualAddress);

  const {
    getWalletBalance,
    loading: tradingBalanceLoading,
  } = useTradingBalances(balanceManagerAddress, actualAddress);

  // Processing state for swap
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<HexAddress | null>(null);

  // Update processing state based on hook state
  useEffect(() => {
    if (isSwapPending) {
      setIsProcessing(true);
      setTxStatus('Preparing swap transaction...');
    } else if (isSwapConfirming) {
      setTxStatus('Confirming transaction...');
    } else if (isSwapConfirmed && swapHash) {
      setTxHash(swapHash);
      setTxStatus('Swap completed successfully!');
      setIsProcessing(false);
    } else if (swapError) {
      setTxStatus(`Swap failed: ${swapError.message}`);
      setIsProcessing(false);
    }
  }, [isSwapPending, isSwapConfirming, isSwapConfirmed, swapHash, swapError]);

  // Fetch available tokens dynamically from pools
  const { tokens: availableTokensFromPools, isLoading: isTokensLoading, error: tokensError } = useAvailableTokens();
 
  const [amount, setAmount] = useState<string>('');
  const [estimatedReceived, setEstimatedReceived] = useState<string>('0');
  const [minReceived, setMinReceived] = useState<string>('0');

  // Transaction status
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Token selector state
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const [isSellSelector, setIsSellSelector] = useState<boolean>(true);

  // Client-side rendering state
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log token loading status
  useEffect(() => {
    if (isTokensLoading) {
      console.log('[SWAP] 🔄 Loading available tokens from pools...');
    } else if (tokensError) {
      console.error('[SWAP] ❌ Error loading tokens:', tokensError);
    } else if (availableTokensFromPools) {
      console.log('[SWAP] ✅ Loaded available tokens:', availableTokensFromPools.length, 'tokens');
      console.log('[SWAP] 📋 Available tokens details:', availableTokensFromPools.map(t => `${t.symbol} (${t.address})`));
    }
  }, [isTokensLoading, tokensError, availableTokensFromPools]);

  // Convert token addresses to Token objects for selector
  const convertTokensForSelector = (tokenAddresses: Record<string, HexAddress>): Token[] => {
    return Object.entries(tokenAddresses)
      .map(([symbol, address]) => {
        // Map token symbols to icon filenames
        const iconMap: Record<string, string> = {
          'WETH': 'eth.png',
          'mWETH': 'eth.png',
          'ETH': 'eth.png',
          'BTC': 'bitcoin.png',
          'WBTC': 'bitcoin.png',
          'mWBTC': 'bitcoin.png',
          'DOGE': 'doge.png',
          'LINK': 'link.png',
          'PEPE': 'pepe.png',
          'TRUMP': 'trump.png',
          'USDC': 'usdc.png',
          'MUSDC': 'usdc.png',
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
      'mWETH': 'Mock Wrapped Ethereum',
      'ETH': 'Ethereum',
      'USDC': 'USD Coin',
      'MUSDC': 'Mock USD Coin',
      'WBTC': 'Wrapped Bitcoin',
      'mWBTC': 'Mock Wrapped Bitcoin',
      'TRUMP': 'Trump Token',
      'PEPE': 'Pepe Token',
      'LINK': 'Chainlink',
      'DOGE': 'Dogecoin',
      'NATIVE': 'Ethereum'
    };
    return nameMap[symbol] || symbol;
  };

  // Prepare tokens for selector - dynamically from pools
  const availableTokensList: Token[] = useMemo(() => {
    if (!availableTokensFromPools || availableTokensFromPools.length === 0) {
      // Fallback tokens for Rise Sepolia (chain 11155931) when GraphQL doesn't return tokens
      if (currentChainId === 11155931) {
        console.log('[SWAP] 🔄 Using fallback token list for Rise Sepolia');
        const fallbackTokens: Token[] = [
          {
            id: 'musdc',
            name: 'Mock USD Coin',
            symbol: 'MUSDC',
            icon: '/tokens/usdc.png',
            address: '0xC004514803F58b09eee24471BC9EfF3D1087CffF' as HexAddress,
            description: '0xC004...CffF',
            decimals: 6
          },
          {
            id: 'mwbtc',
            name: 'Mock Wrapped Bitcoin',
            symbol: 'mWBTC',
            icon: '/tokens/bitcoin.png',
            address: '0xdDbe918dcA0F0B876c2Dff6ff3db4FA0C943A293' as HexAddress,
            description: '0xdDbe...A293',
            decimals: 8
          },
          {
            id: 'mweth',
            name: 'Mock Wrapped Ethereum',
            symbol: 'mWETH',
            icon: '/tokens/eth.png',
            address: '0xbb66130EED9BD4ea584cf283d34E49E8d4d69e99' as HexAddress,
            description: '0xbb66...e99',
            decimals: 18
          }
        ];
        return fallbackTokens;
      }
      return convertTokensForSelector({});
    }

    return availableTokensFromPools.map(token => ({
      id: token.symbol.toLowerCase(),
      name: token.name || token.symbol,
      symbol: token.symbol,
      icon: `/tokens/${token.icon}`,
      address: token.address as HexAddress,
      description: token.address.slice(0, 6) + '...' + token.address.slice(-4),
      decimals: token.decimals
    }));
  }, [availableTokensFromPools, currentChainId]);

  // Token selections
  const [sourceToken, setSourceToken] = useState<Token | null>(null);
  const [destToken, setDestToken] = useState<Token | null>(null);

  // Token balance state
  const [sourceTokenBalance, setSourceTokenBalance] = useState<string | null>(null);
  const [destTokenBalance, setDestTokenBalance] = useState<string | null>(null);
  const [isSourceBalanceLoading, setIsSourceBalanceLoading] = useState(false);
  const [isDestBalanceLoading, setIsDestBalanceLoading] = useState(false);
  const [isSourceBalanceError, setIsSourceBalanceError] = useState(false);
  const [isDestBalanceError, setIsDestBalanceError] = useState(false);

  // External wallet token balance hooks (only used when not using embedded wallet)
  const {
    formattedBalance: externalSourceBalance,
    isLoading: isExternalSourceLoading,
    isError: isExternalSourceError,
  } = useTokenBalance(
    useEmbeddedWallet ? undefined : sourceToken?.address,
    useEmbeddedWallet ? undefined : actualAddress
  );

  const {
    formattedBalance: externalDestBalance,
    isLoading: isExternalDestLoading,
    isError: isExternalDestError,
  } = useTokenBalance(
    useEmbeddedWallet ? undefined : destToken?.address,
    useEmbeddedWallet ? undefined : actualAddress
  );

  // Get actual token decimals from the available tokens (from pools data)
  const getTokenDecimalsFromPools = (tokenAddress: string): number | null => {
    const token = availableTokensList.find(t => 
      t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token?.decimals || null;
  };
  
  // Get actual token decimals from pools data
  const sourceTokenDecimals = sourceToken ? getTokenDecimalsFromPools(sourceToken.address) : null;
  const destTokenDecimals = destToken ? getTokenDecimalsFromPools(destToken.address) : null;
  const hasValidDecimals = sourceTokenDecimals !== null && destTokenDecimals !== null;

  // Fetch balances based on wallet type
  useEffect(() => {
    const fetchBalances = async () => {
      if (!sourceToken || !destToken || !actualAddress) {
        return;
      }

      if (useEmbeddedWallet) {
        // Use Trading Balances for embedded wallet
        try {
          setIsSourceBalanceLoading(true);
          setIsDestBalanceLoading(true);
          
          // Check if we have valid decimals before proceeding
          if (!hasValidDecimals) {
            console.error('[SWAP] ❌ Cannot fetch balances - missing token decimals from pools');
            setIsSourceBalanceError(true);
            setIsDestBalanceError(true);
            setSourceTokenBalance('Error: Missing token info');
            setDestTokenBalance('Error: Missing token info');
            return;
          }
          
          const sourceBalanceBigInt = await getWalletBalance(sourceToken.address as HexAddress);
          const destBalanceBigInt = await getWalletBalance(destToken.address as HexAddress);
          
          console.log('[SWAP] 💰 Raw balances fetched:', {
            sourceBalanceBigInt: sourceBalanceBigInt.toString(),
            destBalanceBigInt: destBalanceBigInt.toString()
          });
          
          // Format the balances with actual decimals from pools data
          const sourceDecimals = sourceTokenDecimals!; // We know it's not null due to hasValidDecimals check
          const destDecimals = destTokenDecimals!;
          
          const sourceFormatted = formatUnits(sourceBalanceBigInt, sourceDecimals);
          const destFormatted = formatUnits(destBalanceBigInt, destDecimals);
          
          // Format balances without unnecessary decimals
          const formatBalance = (value: string): string => {
            const num = parseFloat(value);
            // If it's a whole number, don't show decimals
            if (num === Math.floor(num)) {
              return num.toString();
            }
            // Otherwise, show up to 6 decimals but remove trailing zeros
            return parseFloat(num.toFixed(6)).toString();
          };
          
          const sourceFinal = formatBalance(sourceFormatted);
          const destFinal = formatBalance(destFormatted);
          
          console.log('[SWAP] 📊 Formatted balances:', {
            sourceFormatted,
            destFormatted,
            sourceFinal,
            destFinal
          });
          
          setSourceTokenBalance(sourceFinal);
          setDestTokenBalance(destFinal);
          setIsSourceBalanceError(false);
          setIsDestBalanceError(false);
        } catch (error) {
          console.error('[SWAP] ❌ Error fetching embedded wallet balances:', error);
          setIsSourceBalanceError(true);
          setIsDestBalanceError(true);
          setSourceTokenBalance(null);
          setDestTokenBalance(null);
        } finally {
          setIsSourceBalanceLoading(false);
          setIsDestBalanceLoading(false);
        }
      } else {
        // Use external wallet balances
        setSourceTokenBalance(externalSourceBalance);
        setDestTokenBalance(externalDestBalance);
        setIsSourceBalanceLoading(isExternalSourceLoading);
        setIsDestBalanceLoading(isExternalDestLoading);
        setIsSourceBalanceError(isExternalSourceError);
        setIsDestBalanceError(isExternalDestError);
      }
    };

    fetchBalances();
  }, [useEmbeddedWallet, sourceToken, destToken, actualAddress, hasValidDecimals, sourceTokenDecimals, destTokenDecimals, getWalletBalance, externalSourceBalance, externalDestBalance, isExternalSourceLoading, isExternalDestLoading, isExternalSourceError, isExternalDestError]);

  // Debug logging for balance hooks
  useEffect(() => {
    if (sourceToken && destToken) {
      console.log('[SWAP] 💰 Balance hook parameters:', {
        walletType,
        useEmbeddedWallet,
        sourceToken: `${sourceToken.symbol} (${sourceToken.address})`,
        destToken: `${destToken.symbol} (${destToken.address})`,
        actualAddress,
        sourceBalance: sourceTokenBalance,
        destBalance: destTokenBalance,
        isSourceLoading: isSourceBalanceLoading,
        isDestLoading: isDestBalanceLoading,
        sourceError: isSourceBalanceError,
        destError: isDestBalanceError
      });
    }
  }, [walletType, useEmbeddedWallet, sourceToken, destToken, actualAddress, sourceTokenBalance, destTokenBalance, isSourceBalanceLoading, isDestBalanceLoading, isSourceBalanceError, isDestBalanceError]);

  // Initialize default tokens
  useEffect(() => {
    if (availableTokensList.length > 0) {
      console.log('[SWAP] 🪙 Available tokens:', availableTokensList.map(t => `${t.symbol} (${t.address})`));
      
      if (!sourceToken) {
        // For Rise Sepolia, default to MUSDC first
        const musdcToken = availableTokensList.find(t => t.symbol === 'MUSDC');
        const wethToken = availableTokensList.find(t => t.symbol === 'mWETH');
        const defaultToken = musdcToken || wethToken || availableTokensList[0];
        
        setSourceToken(defaultToken);
        console.log('[SWAP] 📤 Set default source token:', defaultToken.symbol, defaultToken.address);
      }

      if (!destToken) {
        // Try to find a different token than source - prefer mWBTC for Rise Sepolia
        const mwbtcToken = availableTokensList.find(t => t.symbol === 'mWBTC' && t.address !== sourceToken?.address);
        const wethToken = availableTokensList.find(t => t.symbol === 'mWETH' && t.address !== sourceToken?.address);
        const differentToken = availableTokensList.find(t => t.address !== sourceToken?.address);
        const fallbackToken = availableTokensList.find(t => t !== sourceToken);
        const defaultToken = mwbtcToken || wethToken || differentToken || fallbackToken || availableTokensList[0];
        
        setDestToken(defaultToken);
        console.log('[SWAP] 📥 Set default destination token:', defaultToken.symbol, defaultToken.address);
        
        // If still the same token, log a warning
        if (sourceToken && defaultToken.address === sourceToken.address) {
          console.warn('[SWAP] ⚠️ Warning: Only one token available, source and destination are identical');
        }
      }
    }
  }, [availableTokensList, sourceToken, destToken]);

  // Use on-chain calculation for min output amount
  const slippageBps = 30; // 0.3% slippage tolerance in basis points
  
  // Debug logging for decimals
  useEffect(() => {
    if (sourceToken && destToken) {
      console.log('[SWAP] 🔢 Token decimals from pools:', {
        sourceToken: `${sourceToken.symbol} (${sourceToken.address})`,
        sourceDecimals: sourceTokenDecimals,
        destToken: `${destToken.symbol} (${destToken.address})`,
        destDecimals: destTokenDecimals,
        hasValidDecimals,
        tokensFromPools: availableTokensList.map(t => ({
          symbol: t.symbol,
          address: t.address,
          decimals: t.decimals
        }))
      });
      
      if (!hasValidDecimals) {
        console.error('[SWAP] ❌ Cannot get token decimals from pools data!');
      }
    }
  }, [sourceToken, destToken, sourceTokenDecimals, destTokenDecimals, hasValidDecimals, availableTokensList]);
  
  const { minOutputAmount, isLoading: isCalculatingMinOut } = useCalculateMinOutForSwap({
    srcCurrency: sourceToken?.address || '',
    dstCurrency: destToken?.address || '',
    inputAmount: amount || '0',
    slippageToleranceBps: slippageBps,
    srcTokenDecimals: sourceTokenDecimals || 18, // Use 18 as last resort but log error
    enabled: !!(sourceToken && destToken && amount && parseFloat(amount) > 0 && hasValidDecimals)
  });

  // Update estimated receive amount when inputs change
  useEffect(() => {
    if (minOutputAmount && typeof minOutputAmount === 'bigint' && minOutputAmount > 0n && destToken && destTokenDecimals !== null) {
      // Convert the BigInt result to a readable format using destination token decimals from pools
      const formattedMinOut = formatUnits(minOutputAmount, destTokenDecimals);
      setMinReceived(parseFloat(formattedMinOut).toFixed(6));
      
      // Estimate received is slightly higher than min (reverse the slippage calculation)
      const estimatedOut = parseFloat(formattedMinOut) * (1 + slippageBps / 10000);
      setEstimatedReceived(estimatedOut.toFixed(6));
    } else {
      setEstimatedReceived('-');
      setMinReceived('-');
    }
  }, [minOutputAmount, isCalculatingMinOut, amount, sourceToken, destToken, destTokenDecimals, slippageBps]);


  // Calculate USD values 
  const getTokenUsdPrice = (symbol: string): number => {
    const priceMap: Record<string, number> = {
      'WETH': 1800,
      'mWETH': 1800,
      'ETH': 1800,
      'NATIVE': 1800,
      'USDC': 1,
      'MUSDC': 1,
      'WBTC': 50000,
      'mWBTC': 50000,
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
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');

    if (parts.length > 2) {
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
      // If selecting the same token as destination, swap them
      if (destToken && token.address === destToken.address) {
        setDestToken(sourceToken);
      }
      setSourceToken(token);
      console.log('[SWAP] 📤 Selected source token:', token.symbol, token.address);
    } else {
      // If selecting the same token as source, swap them
      if (sourceToken && token.address === sourceToken.address) {
        setSourceToken(destToken);
      }
      setDestToken(token);
      console.log('[SWAP] 📥 Selected destination token:', token.symbol, token.address);
    }
  };

  // Swap source and destination tokens
  const handleTokenSwap = () => {
    if (sourceToken && destToken) {
      const tempToken = sourceToken;
      setSourceToken(destToken);
      setDestToken(tempToken);
      console.log('[SWAP] 🔄 Swapped tokens:', {
        newSource: `${destToken.symbol} (${destToken.address})`,
        newDest: `${sourceToken.symbol} (${sourceToken.address})`
      });
    }
  };

  // Reset swap state when component unmounts or tokens change
  useEffect(() => {
    return () => {
      resetSwapState();
    };
  }, [resetSwapState]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actualAddress) {
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
      await executeSwapWithHook(
        sourceToken.address,
        destToken.address,
        amount,
        minReceived
      );
    } catch (err) {
      console.error('Error executing swap:', err);
      // Error handling is done in the hook
    }
  };

  // Exchange rate for display
  const exchangeRate = sourceToken && destToken
    ? calculateExchangeRatio(sourceToken.symbol, destToken.symbol)
    : '0';

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <DotPattern />
      <div className="w-full max-w-lg relative z-10">
        <Card className="border-white/20 bg-[#121212] p-6">
          <div className="mb-2 text-3xl font-bold text-white">Swap</div>
          {/* Source Section */}
          <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-5">
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
                    ? (effectiveIsConnected
                      ? (isSourceBalanceLoading
                        ? "Loading..."
                        : isSourceBalanceError
                          ? "Error"
                          : `${sourceTokenBalance || '0'} ${sourceToken?.symbol || ''}`)
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
              onClick={handleTokenSwap}
              className="absolute -top-4 z-10 h-8 w-8 rounded-full border-white/10 bg-[#121212] text-gray-400 hover:bg-blue-600/20 hover:text-white transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination Section */}
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-5">
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
                        target.src = "/tokens/default-token.png";
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
                    ? (effectiveIsConnected
                      ? (isDestBalanceLoading
                        ? "Loading..."
                        : isDestBalanceError
                          ? "Error"
                          : `${destTokenBalance || '0'} ${destToken?.symbol || ''}`)
                      : "Connect wallet")
                    : "Loading..."}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mb-6 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-5">
            <div className="space-y-2">
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-400">Exchange rate</span>
                <span className="text-white">
                  1 {sourceToken?.symbol || '?'} = {exchangeRate} {destToken?.symbol || '?'}
                </span>
              </div> */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage tolerance</span>
                <span className="text-white">{(slippageBps / 100).toFixed(1)}%</span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min. received</span>
                <span className="text-white">{minReceived} {destToken?.symbol || ''}</span>
              </div> */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fee (0.25%)</span>
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
            disabled={isProcessing || isSwapPending || isSwapConfirming || !amount || !sourceToken || !destToken || !effectiveIsConnected || !hasValidDecimals}
          >
            {isClient
              ? (!effectiveIsConnected
                ? 'Connect Wallet'
                : !hasValidDecimals
                  ? 'Error: Missing Token Info'
                  : isSwapPending
                    ? 'Confirming in Wallet...'
                    : isSwapConfirming
                      ? 'Confirming...'
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
                      target.src = "/tokens/default-token.png";
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