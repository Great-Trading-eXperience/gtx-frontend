'use client';

import poolManagerABI from '@/abis/gtx/clob/PoolManagerABI';
import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { EXPLORER_URL } from '@/constants/explorer-url';
import { TradeItem } from '@/graphql/gtx/clob';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { useTradingBalances } from '@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances';
import { usePlaceOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/usePlaceOrder';
import { usePlaceOrder as usePrivyPlaceOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/usePrivyPlaceOrder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useFeePercentages } from '@/hooks/web3/gtx/clob-dex/balance-manager/useFeePercentages';
import { DepthData, Ticker24hrData } from '@/lib/market-api';
import type { HexAddress } from '@/types/general/address';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { RefreshCw, Wallet, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useChainId, useContractRead } from 'wagmi';
import { OrderSideEnum } from '../../../../lib/enums/clob.enum';
import { ClobDexComponentProps } from '../clob-dex';
import GTXSlider from './slider';
import GTXTooltip from './tooltip';
import PlaceOrderSkeleton from './place-order-skeleton';

export interface PlaceOrderProps extends ClobDexComponentProps {
  selectedPool?: ProcessedPoolItem;
  tradesData?: TradeItem[];
  tradesLoading: boolean;
  depthData?: DepthData | null;
  ticker24hr?: Ticker24hrData;
  refetchAccount: () => void;
  isLoading?: boolean;
}

const PlaceOrder = ({
  address,
  chainId,
  defaultChainId,
  selectedPool,
  depthData,
  ticker24hr,
  refetchAccount,
  isLoading = false,
}: PlaceOrderProps) => {
  const { isConnected, address: wagmiAddress } = useAccount();
  const { isFullyAuthenticated } = usePrivyAuth();
  
  // Check if user is connected via either traditional wallet or Privy
  const effectiveIsConnected = isConnected || isFullyAuthenticated;
  
  // Determine wallet type and address explicitly
  // Priority: Privy embedded wallet first, then external wallet (wagmi)
  let walletType: 'external' | 'embedded' | 'none';
  let actualAddress: HexAddress | undefined;
  
  if (isFullyAuthenticated && address) {
    // Privy embedded wallet is authenticated and has address - prioritize this
    walletType = 'embedded';
    actualAddress = address;
  } else if (isConnected && wagmiAddress) {
    // Fall back to external wallet if Privy is not available
    walletType = 'external';
    actualAddress = wagmiAddress;
  } else {
    // No wallet available
    walletType = 'none';
    actualAddress = undefined;
  }
  
  const useEmbeddedWallet = walletType === 'embedded';
  
  const currentChainId = useChainId();
  const poolManagerAddress = getContractAddress(
    currentChainId,
    ContractName.clobPoolManager
  ) as HexAddress;

  const { data: pool } = useContractRead({
    address: poolManagerAddress,
    abi: poolManagerABI,
    functionName: 'getPool',
    args: [
      {
        baseCurrency: selectedPool?.baseTokenAddress as HexAddress,
        quoteCurrency: selectedPool?.quoteTokenAddress as HexAddress,
      },
    ],
    chainId: currentChainId,
  }) as {
    data:
      | {
          baseCurrency: HexAddress;
          quoteCurrency: HexAddress;
          orderBook: HexAddress;
        }
      | undefined;
  };

  const [orderType, setOrderType] = useState<'limit' | 'market'>('market');
  const [side, setSide] = useState<OrderSideEnum>(OrderSideEnum.BUY); 
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [total, setTotal] = useState<string>('0');

  // Balance states
  const [availableBalance, setAvailableBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Notification dialog states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(true);
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>();

  // Component mounted state
  const [mounted, setMounted] = useState(false);

  // Slippage info state for market orders
  const [slippageInfo, setSlippageInfo] = useState<any>(null);
  const [calculatingSlippage, setCalculatingSlippage] = useState(false);

  
  // Component Slippage
  const [autoSlippage, setAutoSlippage] = useState(true);
  const [slippageValue, setSlippageValue] = useState('0.3');
  const [slippageValueChange, setSlippageValueChange] = useState<string>(slippageValue);
  const [isModalSlippageOpen, setIsModalSlippageOpen] = useState(false);
  
  const handleSlippageValueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setSlippageValueChange(value);
      
      if (!/^\d*$/.test(value)) return;
      
      const numValue = parseFloat(value);
      
      if (numValue >= 0 && numValue <= 99) {
          setSlippageValueChange(value);
      } else if (numValue > 99) {
          setSlippageValueChange('99');
      }
  };

  const handleConfirmModalSlippage = () => {
    console.log('[PLACE_ORDER] 🎯 Slippage value changed:', {
      oldValue: slippageValue,
      newValue: slippageValueChange,
      oldBps: Math.round(parseFloat(slippageValue) * 100),
      newBps: Math.round(parseFloat(slippageValueChange) * 100)
    });
    setIsModalSlippageOpen(false)
    setSlippageValue(slippageValueChange)
  }

  const inputStyles = `
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    appearance: textfield;
  }
`;

  // Use the appropriate hook based on wallet type (hooks must be called before any early returns)
  const externalWalletHook = usePlaceOrder(useEmbeddedWallet ? undefined : actualAddress);
  const embeddedWalletHook = usePrivyPlaceOrder(useEmbeddedWallet ? actualAddress : undefined);
  
  // Choose the correct hook results based on wallet type
  const {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    getMarketOrderSlippageInfo,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    limitSimulateError,
    marketSimulateError,
    limitOrderHash,
    marketOrderHash,
    resetLimitOrderState,
    resetMarketOrderState,
  } = useEmbeddedWallet ? embeddedWalletHook : externalWalletHook;

  const bestBidPrice = useMemo(() => {
    if (depthData?.bids && depthData.bids.length > 0) {
      const validBid = depthData.bids.find(bid => bid[0] !== '0');
      return validBid ? validBid[0] : undefined;
    }
    return undefined;
  }, [depthData]);

  const bestAskPrice = useMemo(() => {
    if (depthData?.asks && depthData.asks.length > 0) {
      const validAsk = depthData.asks.find(ask => ask[0] !== '0');
      return validAsk ? validAsk[0] : undefined;
    }
    return undefined;
  }, [depthData]);

  const balanceManagerAddress = getContractAddress(
    chainId ?? defaultChainId,
    ContractName.clobBalanceManager
  ) as HexAddress

  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading,
  } = useTradingBalances(
    balanceManagerAddress,
    actualAddress 
  );

  // Move useFeePercentages here with other hooks (before any early returns)
  const { takerFeePercent, makerFeePercent } = useFeePercentages(balanceManagerAddress);

  // Function to refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (!actualAddress || !selectedPool) return;

    setIsManualRefreshing(true);
    try {
      const relevantCurrency =
        side === OrderSideEnum.BUY
          ? (selectedPool.quoteTokenAddress as HexAddress)
          : (selectedPool.baseTokenAddress as HexAddress);

      try {
        const total = await getTotalAvailableBalance(relevantCurrency);
        const formattedBalance = formatUnits(total, Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals));
        // Round to 6 decimal places to avoid floating point precision issues
        const roundedBalance = Math.round(parseFloat(formattedBalance) * 1000000) / 1000000;
        setAvailableBalance(roundedBalance.toString());
        toast.success('Balance refreshed');
      } catch (error) {
        console.error(
          'Failed to get total balance, falling back to wallet balance:',
          error
        );
        const walletBal = await getWalletBalance(relevantCurrency);
        const formattedWalletBalance = formatUnits(
          walletBal,
          Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals)
        );
        // Round to 6 decimal places to avoid floating point precision issues
        const roundedWalletBalance = Math.round(parseFloat(formattedWalletBalance) * 1000000) / 1000000;
        setAvailableBalance(roundedWalletBalance.toString());
        toast.info('Used wallet balance (balance manager unavailable)');
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
      setAvailableBalance('Error');
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    actualAddress,
    selectedPool,
    selectedPool?.quoteDecimals,
    selectedPool?.baseDecimals,
    side
  ]);

  // Load initial balance
  const loadBalance = useCallback(async () => {
    if (actualAddress && selectedPool) {
      setIsLoadingBalance(true);
      try {
        const relevantCurrency =
          side === OrderSideEnum.BUY
            ? (selectedPool.quoteTokenAddress as HexAddress)
            : (selectedPool.baseTokenAddress as HexAddress);

        try {
          const total = await getTotalAvailableBalance(relevantCurrency);
          const formattedBalance = formatUnits(total, Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals));
          
          // Round to 6 decimal places to avoid floating point precision issues
          const roundedBalance = Math.round(parseFloat(formattedBalance) * 1000000) / 1000000;
          setAvailableBalance(roundedBalance.toString());
        } catch (error) {
          console.error(
            'Failed to get total balance, falling back to wallet balance:',
            error
          );
          const walletBal = await getWalletBalance(relevantCurrency);
          const formattedWalletBalance = formatUnits(
            walletBal,
            Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals)
          );
          // Round to 6 decimal places to avoid floating point precision issues
          const roundedWalletBalance = Math.round(parseFloat(formattedWalletBalance) * 1000000) / 1000000;
          setAvailableBalance(roundedWalletBalance.toString());
        }
      } catch (error) {
        console.error('Error loading any balance:', error);
        setAvailableBalance('Error');
      } finally {
        setIsLoadingBalance(false);
      }
    }
  }, [
    actualAddress,
    selectedPool,
    selectedPool?.quoteDecimals,
    selectedPool?.baseDecimals,
    side,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedPool && selectedPool.orderBook) {
      console.log(`PlaceOrder: Setting orderbook address for ${selectedPool.coin}`);
      setPrice('');
      setQuantity('');
      setTotal('0');
    }
  }, [selectedPool]);

  // Fall back to first pool if selectedPool is not set
  useEffect(() => {
    if (selectedPool && selectedPool.orderBook) {
      console.log(`PlaceOrder: Setting orderbook address for ${selectedPool.coin}`);
      setPrice('');
      setQuantity('');
      setTotal('0');
    }
  }, [selectedPool]);

  // Update total when price or quantity changes
  useEffect(() => {
    if (orderType === 'limit') {
      if (price && quantity) {
        try {
          const priceValue = Number.parseFloat(price);
          const quantityValue = Number.parseFloat(quantity);
          setTotal((priceValue * quantityValue).toFixed(2));
        } catch (error) {
          setTotal('0');
        }
      } else {
        setTotal('0');
      }
    } else if (orderType === 'market') {
      if (quantity && slippageInfo) {
        try {
          if (side === OrderSideEnum.BUY) {
            const conservativeMinEth = formatUnits(
              slippageInfo.conservativeMinOut, 
              18
            );
            setTotal(parseFloat(conservativeMinEth).toFixed(6));
          } else {
            const conservativeMinUsdc = formatUnits(
              slippageInfo.conservativeMinOut, 
              6 
            );
            setTotal(parseFloat(conservativeMinUsdc).toFixed(2));
          }
        } catch (error) {
          setTotal('0');
        }
      }
    }
  }, [price, quantity, orderType, side, slippageInfo]);

  useEffect(() => {
    if (!selectedPool || !selectedPool.quoteDecimals) return;

    if (orderType === 'limit') {
      if (side === OrderSideEnum.BUY && bestAskPrice) {
        const normalizedPrice = formatUnits(BigInt(bestAskPrice), selectedPool.quoteDecimals);
        setPrice(normalizedPrice);
      } else if (side === OrderSideEnum.SELL && bestBidPrice) {
        const normalizedPrice = formatUnits(BigInt(bestBidPrice), selectedPool.quoteDecimals);
        setPrice(normalizedPrice);
      }
    } else {
      const normalizedPrice = formatUnits(BigInt(ticker24hr?.lastPrice || 0), selectedPool?.quoteDecimals);
      setPrice(normalizedPrice);
    }
  }, [bestBidPrice, bestAskPrice, side, orderType, selectedPool?.quoteDecimals, ticker24hr?.lastPrice]);

  useEffect(() => {
    loadBalance();
  }, [address, selectedPool, side, loadBalance]);

  // Calculate slippage info for market orders with stable dependencies
  useEffect(() => {
    let isCancelled = false;
    
    const calculateSlippage = async () => {
      if (
        orderType === 'market' &&
        quantity &&
        selectedPool &&
        pool &&
        getMarketOrderSlippageInfo &&
        Number(quantity) > 0
      ) {
        if (!isCancelled) {
          setCalculatingSlippage(true);
        }
        
        try {
          // Parse quantity based on order type and side
          let quantityBigInt: bigint;
          if (side === OrderSideEnum.BUY) {
            // For market BUY orders, quantity is USDC amount to spend
            quantityBigInt = parseUnits(quantity, Number(selectedPool.quoteDecimals));
          } else {
            // For market SELL orders, quantity is ETH amount to sell
            quantityBigInt = parseUnits(quantity, Number(selectedPool.baseDecimals));
          }
          
          const slippageBps = Math.round(parseFloat(slippageValue) * 100);
          
          console.log('[PLACE_ORDER] 🚀 About to call getMarketOrderSlippageInfo with:', {
            quantity,
            quantityBigInt: quantityBigInt.toString(),
            slippageValue,
            slippageBps,
            side: side === OrderSideEnum.BUY ? 'BUY' : 'SELL',
            poolOrderBook: pool.orderBook,
            decimalsUsed: side === OrderSideEnum.BUY ? `${selectedPool.quoteDecimals} (USDC)` : `${selectedPool.baseDecimals} (MWETH)`
          });
          
          const info = await getMarketOrderSlippageInfo(
            pool,
            quantityBigInt,
            side,
            slippageBps
          );
          
          console.log('[PLACE_ORDER] 🏆 Received slippage info:', {
            info,
            slippageTolerance: info?.slippageTolerance,
            actualSlippage: info?.actualSlippage,
            minOutAmount: info?.minOutAmount?.toString(),
            conservativeMinOut: info?.conservativeMinOut?.toString(),
            estimatedPrice: info?.estimatedPrice?.toString()
          });
          
          if (!isCancelled) {
            setSlippageInfo(info);
            setCalculatingSlippage(false);
          }
        } catch (error) {
          console.error('Failed to calculate slippage info:', error);
          if (!isCancelled) {
            setSlippageInfo(null);
            setCalculatingSlippage(false);
          }
        }
      } else {
        if (!isCancelled) {
          setSlippageInfo(null);
          setCalculatingSlippage(false);
        }
      }
    };

    // Debounce the calculation to avoid too many calls
    const timeoutId = setTimeout(calculateSlippage, 500);
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
    // Remove getMarketOrderSlippageInfo from dependencies to prevent infinite re-renders
  }, [orderType, quantity, selectedPool?.baseDecimals, pool?.orderBook, side, slippageValue]);

  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      const timeoutId = setTimeout(() => {
        refreshBalance();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, refreshBalance]);

  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      const timeoutId = setTimeout(() => {
        if (isLimitOrderConfirmed) {
          resetLimitOrderState();
        }
        if (isMarketOrderConfirmed) {
          resetMarketOrderState();
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isLimitOrderConfirmed,
    isMarketOrderConfirmed,
    resetLimitOrderState,
    resetMarketOrderState,
  ]);

  useEffect(() => {
    if (limitSimulateError || marketSimulateError) {
      const error = limitSimulateError || marketSimulateError;
      setNotificationMessage(error?.message || 'Unknown error occurred.');
      setNotificationSuccess(false);
      setNotificationTxHash(undefined);
      setShowNotification(true);
    }
  }, [limitSimulateError, marketSimulateError]);

  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      const txHash = limitOrderHash || marketOrderHash;
      setNotificationMessage(
        `Your ${side === OrderSideEnum.BUY ? 'buy' : 'sell'} order has been placed.`
      );
      setNotificationSuccess(true);
      setNotificationTxHash(txHash);
      setShowNotification(true);
    }
  }, [
    isLimitOrderConfirmed,
    isMarketOrderConfirmed,
    side,
    limitOrderHash,
    marketOrderHash,
  ]);

  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      refetchAccount();
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, refetchAccount]);

  // Early return with loading state if we don't have the actual address yet
  // (Must be after all hooks are called to follow Rules of Hooks)
  if (!actualAddress || isLoading) {
    console.log('[DEBUG_BALANCE] ⏳ Waiting for wallet address...');
    return <PlaceOrderSkeleton />;
  }

  const handleTransactionError = (error: unknown) => {
    let errorMessage = 'Failed to place order';

    if (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    console.error('Transaction error:', errorMessage);
    setNotificationMessage(errorMessage);
    setNotificationSuccess(false);
    setNotificationTxHash(undefined);
    setShowNotification(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit', e);
    e.preventDefault();

    if (!actualAddress) {
      console.log('[DEBUG_BALANCE] ❌ No wallet address available for order submission');
      toast.error('Wallet not connected properly. Please reconnect your wallet.');
      return;
    }

    if (!selectedPool) {
      console.log('No trading pair selected.');
      toast.error('No trading pair selected.');
      return;
    }

    if (!pool) {
      console.log('Pool data not available.');
      toast.error('Pool data not available.');
      return;
    }

    try {
      let quantityBigInt: bigint;
      const priceBigInt = parseUnits(price, Number(selectedPool.quoteDecimals));

      // Different logic for market vs limit orders
      if (orderType === 'market' && side === OrderSideEnum.BUY) {
        // Market BUY: quantity is USDC amount to spend, need to convert to base currency amount
        const usdcAmountBigInt = parseUnits(quantity, Number(selectedPool.quoteDecimals));
        if (usdcAmountBigInt <= 0n) {
          throw new Error('Amount must be positive');
        }
        
        // For market orders, we'll need to calculate the equivalent base currency amount
        // This should use the current market price, but for now we'll convert in the hook
        // Pass the USDC amount as the quantity for market BUY orders
        quantityBigInt = usdcAmountBigInt;
      } else {
        // Limit orders and SELL market orders: quantity is base currency amount
        quantityBigInt = parseUnits(quantity, Number(selectedPool.baseDecimals));
        if (quantityBigInt <= 0n) {
          throw new Error('Quantity must be positive');
        }
      }

      if (orderType === 'limit' && priceBigInt <= 0n) {
        throw new Error('Price must be positive');
      }

      if (orderType === 'limit') {
        // For limit orders, quantityBigInt is always base currency amount
        const baseQuantity = orderType === 'limit' || side === OrderSideEnum.SELL ? 
          quantityBigInt : 
          parseUnits(quantity, Number(selectedPool.baseDecimals));
        await handlePlaceLimitOrder(pool, priceBigInt, baseQuantity, side);
      } else {
        // Convert slippage percentage to basis points (e.g., 0.3% -> 30 bps)
        const slippageBps = Math.round(parseFloat(slippageValue) * 100);
        await handlePlaceMarketOrder(pool, quantityBigInt, side, slippageBps);
      }
    } catch (err) {
      console.error('Order placement error:', err);
      handleTransactionError(err);
    }
  };

  const isPending = isLimitOrderPending || isMarketOrderPending;
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming;
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed;
  const orderError = limitSimulateError || marketSimulateError;

  if (!mounted || !selectedPool)
    return <PlaceOrderSkeleton />;

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-lg p-3 max-w-md mx-auto border border-gray-700/30 backdrop-blur-sm">
      <style jsx global>
        {inputStyles}
      </style>

      {/* <div className="flex flex-col w-full gap-3 mb-3">
        {effectiveIsConnected && selectedPool && (
          <div className="bg-gray-900/30 rounded-lg border border-gray-700/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>Available Balance</span>
              </h3>
              <button
                onClick={refreshBalance}
                disabled={isManualRefreshing || isLoadingBalance}
                className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-1.5 text-xs bg-gray-800/50 px-2 py-1 rounded border border-gray-700/40"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isManualRefreshing ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">
                {isLoadingBalance ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  formatNumber(Number(availableBalance), {
                    decimals: 2,
                    compact: true,
                  })
                )}
              </span>
              <span className="text-gray-400">
                {side === OrderSideEnum.BUY ? 'USDC' : selectedPool.coin.split('/')[0]}
              </span>
            </div>
          </div>
        )}
      </div> */}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Order Type and Side Row */}
        <div className="grid gap-3">
          {/* Order Type Selection */}
          <div className="relative">
            <div className="flex w-full gap-6 bg-transparent">
              <button
                type="button"
                className={`group relative flex flex-1 items-center justify-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 ${
                  orderType === 'market' ? 'text-white' : ''
                }`}
                onClick={() => setOrderType('market')}
              >
                <span>Market</span>
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out ${
                    orderType === 'market'
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>

              <button
                type="button"
                className={`group relative flex flex-1 items-center justify-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 ${
                  orderType === 'limit' ? 'text-white' : ''
                }`}
                onClick={() => setOrderType('limit')}
              >
                <span>Limit</span>
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out ${
                    orderType === 'limit'
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Buy/Sell Selection */}
          <div className="relative">
            <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                  side === OrderSideEnum.BUY
                    ? 'bg-emerald-600 text-white'
                    : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
                }`}
                onClick={() => setSide(OrderSideEnum.BUY)}
              >
                <span>Buy</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                  side === OrderSideEnum.SELL
                    ? 'bg-rose-600 text-white'
                    : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
                }`}
                onClick={() => setSide(OrderSideEnum.SELL)}
              >
                <span>Sell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Price - Only for Limit Orders */}
        {orderType === 'limit' && (
          <div className="space-y-1">
            <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
              <span>Price</span>
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Enter price"
                step={`0.${'0'.repeat(Number(selectedPool?.quoteDecimals) - 1)}1`}
                min="0"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
                {selectedPool?.quoteTokenAddress ? selectedPool.coin.split('/')[1] : ''}
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center justify-between ml-1">
            <span>Quantity</span>
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              value={quantity}
              onChange={e => {
                const value = e.target.value;
                const numValue = parseFloat(value);
                
                // Validate reasonable limits
                if (side === OrderSideEnum.BUY && orderType === 'market' && numValue > 1000000) {
                  toast.warning('Amount exceeds reasonable limit of 1M USDC for market orders');
                  return;
                }
                
                if (numValue > 1000000) {
                  toast.warning('Amount seems unusually large');
                }
                
                setQuantity(value);
              }}
              placeholder="Enter amount"
              step={
                side === OrderSideEnum.BUY && orderType === 'market' 
                  ? "0.000001"  // USDC has 6 decimals  
                  : "0.000000000000000001"  // ETH has 18 decimals
              }
              max={
                side === OrderSideEnum.BUY && orderType === 'market' 
                  ? Math.min(parseFloat(availableBalance) || 0, 1000000).toString()  // Max 1M USDC for market buys
                  : availableBalance
              }
              min="0"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {side === OrderSideEnum.BUY ? 
                (orderType === 'market' ? 'USDC' : selectedPool?.coin.split('/')[0]) : 
                selectedPool?.coin.split('/')[0]
              }
            </div>
          </div>
          <GTXSlider quantity={availableBalance} setQuantity={setQuantity}/>
        </div>

        {/* Order Value/Minimum Received - Display Only */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center justify-between ml-1">
            <span>
              {orderType === 'limit' ? 'Order Value' : 
               (side === OrderSideEnum.BUY ? 'Minimum Received' : 'Minimum Proceeds')
              }
            </span>
          </label>
          <div className="relative bg-gray-900/40 rounded-lg py-2 px-3 pr-16 border border-gray-700/50">
            <div className="text-white text-sm">
              {total}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {orderType === 'limit' 
                ? 'USDC'  // Limit orders always show USDC value (price * quantity)
                : (side === OrderSideEnum.BUY ? selectedPool?.coin.split('/')[0] : 'USDC')
              }
            </div>
          </div>
        </div>

        {/* Slippage Info for Market Orders */}
        {orderType === 'market' && quantity && selectedPool && pool && (
          <div className="bg-gray-900/30">
            {slippageInfo ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Slippage:</span>
                  <span className={`font-medium ${
                    slippageInfo.actualSlippage > slippageInfo.slippageTolerance 
                      ? 'text-red-400' 
                      : slippageInfo.actualSlippage > 1.0
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {slippageInfo.actualSlippage.toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : calculatingSlippage ? (
              <div className="text-xs text-gray-400">Calculating slippage...</div>
            ) : (
              <div className="text-xs text-gray-400">Enter amount to see slippage info</div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="relative mt-6">
          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              side === OrderSideEnum.BUY
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            } ${
              isPending || isConfirming || !effectiveIsConnected
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={isPending || isConfirming || !effectiveIsConnected}
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : isConfirming ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </div>
            ) : isConfirmed ? (
              <div className="flex items-center justify-center gap-2">
                <span>Order Placed!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{`${side === OrderSideEnum.BUY ? 'Buy' : 'Sell'} ${
                  selectedPool?.coin?.split('/')[0] || ''
                }`}</span>
              </div>
            )}
          </button>
        </div>
      </form>

      <div className='w-full border-t-2 border-gray-600 mt-3'></div>

      <div className='flex flex-col w-full gap-3 text-xs text-gray-400 mt-3'>
        <div className='flex flex-row justify-between'>
          <div className='border-b border-dashed border-gray-400'>
            <GTXTooltip text={`Taker orders pay a ${takerFeePercent.toFixed(2)}% fee. Maker orders pay ${makerFeePercent.toFixed(2)}% a fee`} width={372} position='center'>
              <span>Fees</span>
            </GTXTooltip>
          </div>
          <div className='flex flex-row gap-1 text-gray-200 font-medium'>
            <GTXTooltip text='Taker fee' width={80} position='right'>{takerFeePercent.toFixed(2)}%</GTXTooltip>
            <span>/</span>
            <GTXTooltip text='Maker fee' width={85} position='right'>{makerFeePercent.toFixed(2)}%</GTXTooltip>
          </div>
        </div>
      </div>

      <Dialog
          open={isModalSlippageOpen}
          onOpenChange={(openState) => {
              setIsModalSlippageOpen(openState);
              if (!openState) setIsModalSlippageOpen(false);
          }}
      >
          <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800/30 text-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-xl font-semibold">Slippage Setting</h2>
              <button
                onClick={() => setIsModalSlippageOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-1 mb-8">
              <div className='flex justify-between items-center'>
                <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
                  <span>Slippage</span>
                </label>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-400 text-xs'>Auto-slippage</span>
                  <button
                    onClick={() => {
                      setAutoSlippage(!autoSlippage)
                      setSlippageValueChange(slippageValue)
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      autoSlippage ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                        autoSlippage ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-lg p-2 border border-gray-700/50">
                <input
                  type="text"
                  value={slippageValueChange}
                  onChange={handleSlippageValueChange}
                  disabled={autoSlippage}
                  className="flex-1 bg-transparent text-gray-400 text-sm outline-none w-7 text-right"
                  placeholder="2"
                />
                <span className="text-white text-md font-medium">%</span>
              </div>
            </div>
    
            {/* Confirm Button */}
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-3 rounded-xl transition-colors"
              onClick={() => handleConfirmModalSlippage()}
            >
              Confirm Settings
            </button>
          </DialogContent>
      </Dialog>

      {!effectiveIsConnected && (
        <div className="mt-3 p-2 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Please connect wallet to trade</span>
        </div>
      )}

      {/* Notification Dialog */}
      {/* <NotificationDialog
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
        explorerBaseUrl={EXPLORER_URL(chainId ?? defaultChainId)}
      /> */}
    </div>
  );
};

export default PlaceOrder;
