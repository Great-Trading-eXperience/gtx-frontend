'use client';

import poolManagerABI from '@/abis/gtx/clob/PoolManagerABI';
import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { EXPLORER_URL } from '@/constants/explorer-url';
import { TradeItem } from '@/graphql/gtx/clob';
import { useTradingBalances } from '@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances';
import { usePlaceOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/usePlaceOrder';
import { DepthData, Ticker24hrData } from '@/lib/market-api';
import { formatNumber } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import type { HexAddress } from '@/types/general/address';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { RefreshCw, Wallet } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useChainId, useContractRead } from 'wagmi';
import { OrderSideEnum } from '../../../../lib/enums/clob.enum';
import { ClobDexComponentProps } from '../clob-dex';

export interface PlaceOrderProps extends ClobDexComponentProps {
  selectedPool?: ProcessedPoolItem;
  tradesData?: TradeItem[];
  tradesLoading: boolean;
  depthData?: DepthData | null;
  ticker24hr?: Ticker24hrData;
  refetchAccount: () => void;
}

const PlaceOrder = ({
  address,
  chainId,
  defaultChainId,
  selectedPool,
  depthData,
  ticker24hr,
  refetchAccount,
}: PlaceOrderProps) => {
  const { isConnected } = useAccount();

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

  // Use individual hooks - split for better error isolation
  const {
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
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
  } = usePlaceOrder();

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

  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading,
  } = useTradingBalances(
    getContractAddress(
      chainId ?? defaultChainId,
      ContractName.clobBalanceManager
    ) as HexAddress
  );

  //   const convertToPoolType = (poolItem: PoolItemWithStringTimestamp): Pool => {
  //     return {
  //       baseDecimals: baseDecimals,
  //       quoteDecimals: quoteDecimals,
  //       ...poolItem,
  //       timestamp: poolItem.timestamp,
  //     };
  //   };

  // Function to refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (!address || !selectedPool) return;

    setIsManualRefreshing(true);
    try {
      const relevantCurrency =
        side === OrderSideEnum.BUY
          ? (selectedPool.quoteTokenAddress as HexAddress)
          : (selectedPool.baseTokenAddress as HexAddress);

      try {
        const total = await getTotalAvailableBalance(relevantCurrency);
        setAvailableBalance(
          formatUnits(total, Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals))
        );
        toast.success('Balance refreshed');
      } catch (error) {
        console.error(
          'Failed to get total balance, falling back to wallet balance:',
          error
        );
        const walletBal = await getWalletBalance(relevantCurrency);
        setAvailableBalance(
          formatUnits(
            walletBal,
            Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals)
          )
        );
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
    address,
    selectedPool,
    selectedPool?.quoteDecimals,
    selectedPool?.baseDecimals,
    side
  ]);

  // Load initial balance
  const loadBalance = useCallback(async () => {
    if (address && selectedPool) {
      setIsLoadingBalance(true);
      try {
        const relevantCurrency =
          side === OrderSideEnum.BUY
            ? (selectedPool.quoteTokenAddress as HexAddress)
            : (selectedPool.baseTokenAddress as HexAddress);

        try {
          const total = await getTotalAvailableBalance(relevantCurrency);
          setAvailableBalance(
            formatUnits(total, Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals))
          );
        } catch (error) {
          console.error(
            'Failed to get total balance, falling back to wallet balance:',
            error
          );
          const walletBal = await getWalletBalance(relevantCurrency);
          setAvailableBalance(
            formatUnits(
              walletBal,
              Number(side === OrderSideEnum.BUY ? selectedPool.quoteDecimals : selectedPool.baseDecimals)
            )
          );
        }
      } catch (error) {
        console.error('Error loading any balance:', error);
        setAvailableBalance('Error');
      } finally {
        setIsLoadingBalance(false);
      }
    }
  }, [
    address,
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
  }, [price, quantity]);

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

  // Load balance when relevant data changes
  useEffect(() => {
    loadBalance();
  }, [address, selectedPool, side, loadBalance]);

  // TODO
  // Refresh order book on regular intervals
  // useEffect(() => {
  //   if (pool?.orderBook) {
  //     const interval = setInterval(() => {
  //       refreshOrderBook();
  //     }, 1000); // Refresh every second

  //     return () => clearInterval(interval);
  //   }
  // }, [pool?.orderBook, refreshOrderBook]);

  // Auto refresh balance after transaction completion
  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      // Add a small delay to allow blockchain to update
      const timeoutId = setTimeout(() => {
        refreshBalance();
      }, 2000); // 2 seconds delay to allow transaction to propagate

      return () => clearTimeout(timeoutId);
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, refreshBalance]);

  // Reset confirmation status after 1 second
  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      const timeoutId = setTimeout(() => {
        // Reset the confirmation states after 1 second
        if (isLimitOrderConfirmed) {
          resetLimitOrderState();
        }
        if (isMarketOrderConfirmed) {
          resetMarketOrderState();
        }
      }, 1000); // 1 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [
    isLimitOrderConfirmed,
    isMarketOrderConfirmed,
    resetLimitOrderState,
    resetMarketOrderState,
  ]);

  // Show error notification when there's an error
  useEffect(() => {
    if (limitSimulateError || marketSimulateError) {
      const error = limitSimulateError || marketSimulateError;
      setNotificationMessage(error?.message || 'Unknown error occurred.');
      setNotificationSuccess(false);
      setNotificationTxHash(undefined);
      setShowNotification(true);
    }
  }, [limitSimulateError, marketSimulateError]);

  // Show success notification when order is confirmed
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

  // Function to handle transaction errors
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

  // Function to handle order placement
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit', e);
    e.preventDefault();

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
      // Enhanced parameter validation
      const quantityBigInt = parseUnits(quantity, Number(selectedPool.baseDecimals));
      const priceBigInt = parseUnits(price, Number(selectedPool.quoteDecimals));

      // Additional checks before contract call
      if (quantityBigInt <= 0n) {
        throw new Error('Quantity must be positive');
      }

      if (priceBigInt <= 0n) {
        throw new Error('Price must be positive');
      }

      if (orderType === 'limit') {
        await handlePlaceLimitOrder(pool, priceBigInt, quantityBigInt, side);
      } else {
        await handlePlaceMarketOrder(pool, quantityBigInt, side, priceBigInt, true);
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

  if (!mounted)
    return (
      <div className="flex items-center justify-center h-40 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2 text-gray-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading trading pairs...</span>
        </div>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-3 max-w-md mx-auto border border-gray-700/30 backdrop-blur-sm">
      <style jsx global>
        {inputStyles}
      </style>

      <div className="flex flex-col w-full gap-3 mb-3">
        {isConnected && selectedPool && (
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Order Type and Side Row */}
        {/* <div className="grid grid-cols-2 gap-3"> */}
        <div className="grid gap-3">
          {/* Order Type Selection */}
          {/* <div className="relative">
            <div className="flex h-9 text-sm border-b border-gray-700">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center transition-colors pb-1 border-b-2 ${
                  orderType === 'market'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-blue-300 hover:text-white'
                }`}
                onClick={() => setOrderType('market')}
              >
                Market
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center transition-colors pb-1 border-b-2 ${
                  orderType === 'limit'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-blue-300 hover:text-white'
                }`}
                onClick={() => setOrderType('limit')}
              >
                Limit
              </button>
            </div>
          </div> */}
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
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Amount</span>
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Enter amount"
              step="0.000001"
              min="0"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {selectedPool?.baseTokenAddress ? selectedPool.coin.split('/')[0] : ''}
            </div>
          </div>
        </div>

        {/* Total - Calculated Field */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Total</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50"
              value={total}
              placeholder="Total amount"
              readOnly
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              USDC
            </div>
          </div>
        </div>

        {/* Submit Button with glow effect */}
        <div className="relative mt-6 group">
          <div
            className={`absolute inset-0 rounded-lg blur-md transition-opacity group-hover:opacity-100 ${
              side === OrderSideEnum.BUY ? 'bg-emerald-500/30' : 'bg-rose-500/30'
            } ${isPending || isConfirming || !isConnected ? 'opacity-0' : 'opacity-50'}`}
          ></div>
          <button
            type="submit"
            className={`relative w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              side === OrderSideEnum.BUY
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]'
            } ${
              isPending || isConfirming || !isConnected
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={isPending || isConfirming || !isConnected}
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

      {!isConnected && (
        <div className="mt-3 p-2 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Please connect wallet to trade</span>
        </div>
      )}

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
        explorerBaseUrl={EXPLORER_URL(chainId ?? defaultChainId)}
      />
    </div>
  );
};

export default PlaceOrder;
