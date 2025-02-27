import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { formatUnits, parseUnits } from 'viem';
import { useAccount } from 'wagmi';
import { HexAddress } from '@/types/web3/general/address';
import { poolsQuery } from '@/graphql/gtx/gtx.query';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { useOrderBookAPI } from '@/hooks/web3/gtx/clob-dex/orderbook/useOrderBookAPI';
import { useTradingBalances } from '@/hooks/web3/gtx/clob-dex/balance-manager/useTradingBalances';
import { usePlaceOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/write/usePlaceOrder';
import { NotificationDialog } from '@/components/notification-dialog/notification-dialog';
// import { NotificationDialog } from "@/components/ui/notification-dialog";

// Order side type
type Side = 0 | 1; // 0 = BUY, 1 = SELL

// Define the expected data structure from the GraphQL query
interface PoolsData {
  poolss: {
    items: Array<{
      id: string;
      coin: string;
      orderBook: string;
      baseCurrency: string;
      quoteCurrency: string;
      lotSize: string;
      maxOrderAmount: string;
      timestamp: string;
    }>;
  };
}

// Configuration constants - replace with actual contract addresses
const BALANCE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_GTX_BALANCE_MANAGER_ADDRESS as HexAddress;

const PlaceOrder = () => {
  const { address, isConnected } = useAccount();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [side, setSide] = useState<Side>(0); // Default to BUY
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [total, setTotal] = useState<string>('0');
  const [orderBookAddress, setOrderBookAddress] = useState<HexAddress | undefined>();

  // Balance states
  const [availableBalance, setAvailableBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [depositMode, setDepositMode] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Notification dialog states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(true);
  const [notificationTxHash, setNotificationTxHash] = useState<string | undefined>();

  // Fetch pools data with react-query
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useQuery<PoolsData>({
    queryKey: ['poolsData'],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL as string, poolsQuery);
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

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
  } = usePlaceOrder();

  const {
    bestPriceBuy,
    bestPriceSell,
    isLoadingBestPrices,
    refreshOrderBook
  } = useOrderBookAPI(orderBookAddress as HexAddress || '0x0000000000000000000000000000000000000000');

  // Use the fixed balance hook
  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading
  } = useTradingBalances(BALANCE_MANAGER_ADDRESS);

  // Set the first pool as default when data is loaded
  useEffect(() => {
    if (poolsData && poolsData.poolss.items.length > 0 && !selectedPool) {
      setSelectedPool(poolsData.poolss.items[0]);
      setOrderBookAddress(poolsData.poolss.items[0].orderBook as HexAddress);
    }
  }, [poolsData, selectedPool]);

  // Update total when price or quantity changes
  useEffect(() => {
    if (price && quantity) {
      try {
        const priceValue = parseFloat(price);
        const quantityValue = parseFloat(quantity);
        setTotal((priceValue * quantityValue).toFixed(6));
      } catch (error) {
        setTotal('0');
      }
    } else {
      setTotal('0');
    }
  }, [price, quantity]);

  // Auto-fill best price when available and if price field is empty
  useEffect(() => {
    if (!price && orderType === 'limit') {
      if (side === 0 && bestPriceSell) { // Buy - use best sell price
        setPrice(formatUnits(bestPriceSell.price, 0));
      } else if (side === 1 && bestPriceBuy) { // Sell - use best buy price
        setPrice(formatUnits(bestPriceBuy.price, 0));
      }
    }
  }, [bestPriceBuy, bestPriceSell, side, price, orderType]);

  // Load balance when pool or address changes
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && address && selectedPool) {
        setIsLoadingBalance(true);
        try {
          const relevantCurrency = side === 0
            ? selectedPool.quoteCurrency as HexAddress  // For buys, we need quote currency (USDC)
            : selectedPool.baseCurrency as HexAddress;  // For sells, we need base currency (ETH)

          // Use wallet balance as fallback if manager balance fails
          try {
            const total = await getTotalAvailableBalance(relevantCurrency);
            setAvailableBalance(formatUnits(total, 18)); // Assuming 18 decimals
          } catch (error) {
            console.error('Failed to get total balance, falling back to wallet balance:', error);
            const walletBal = await getWalletBalance(relevantCurrency);
            setAvailableBalance(formatUnits(walletBal, 18));
          }
        } catch (error) {
          console.error('Error loading any balance:', error);
          setAvailableBalance('Error');
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };

    loadBalance();
  }, [address, isConnected, selectedPool, side, getTotalAvailableBalance, getWalletBalance]);

  // Refresh order book on regular intervals
  useEffect(() => {
    if (orderBookAddress) {
      const interval = setInterval(() => {
        refreshOrderBook();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [orderBookAddress, refreshOrderBook]);

  // Show error notification when there's an error
  useEffect(() => {
    if (limitSimulateError || marketSimulateError) {
      const error = limitSimulateError || marketSimulateError;
      setNotificationMessage("There was an error processing your transaction. Please try again.");
      setNotificationSuccess(false);
      setNotificationTxHash(undefined);
      setShowNotification(true);
    }
  }, [limitSimulateError, marketSimulateError]);

  // Show success notification when order is confirmed
  useEffect(() => {
    if (isLimitOrderConfirmed || isMarketOrderConfirmed) {
      setNotificationMessage(`Your ${side === 0 ? 'buy' : 'sell'} order has been placed.`);
      setNotificationSuccess(true);
      // Assuming you have the transaction hash saved somewhere in your hooks
      // setNotificationTxHash(txHash);
      setShowNotification(true);
    }
  }, [isLimitOrderConfirmed, isMarketOrderConfirmed, side]);

  const handlePoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poolId = e.target.value;
    const pool = poolsData?.poolss.items.find((p: any) => p.id === poolId);
    setSelectedPool(pool);
    setOrderBookAddress(pool?.orderBook as HexAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Enhanced parameter validation
      const quantityBigInt = parseUnits(quantity, 18);
      const priceBigInt = parseUnits(price, 0);

      // Additional checks before contract call
      if (quantityBigInt <= 0n) {
        throw new Error('Quantity must be positive');
      }

      if (priceBigInt <= 0n) {
        throw new Error('Price must be positive');
      }

      // Log detailed transaction parameters for debugging
      console.log('Order Parameters:', {
        baseCurrency: selectedPool.baseCurrency,
        quoteCurrency: selectedPool.quoteCurrency,
        price: priceBigInt.toString(),
        quantity: quantityBigInt.toString(),
        side
      });

      // Existing order placement logic
      await handlePlaceLimitOrder(
        {
          baseCurrency: selectedPool.baseCurrency as HexAddress,
          quoteCurrency: selectedPool.quoteCurrency as HexAddress
        },
        priceBigInt,
        quantityBigInt,
        side,
      );
    } catch (error) {
      console.error('Detailed Order Placement Error:', error);

      // More informative error handling
      if (error instanceof Error) {
        setNotificationMessage("There was an error processing your transaction. Please try again.");
        setNotificationSuccess(false);
        setNotificationTxHash(undefined);
        setShowNotification(true);
      }
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !selectedPool || !address) {
      setNotificationMessage("Please connect your wallet first.");
      setNotificationSuccess(false);
      setNotificationTxHash(undefined);
      setShowNotification(true);
      return;
    }

    try {
      const relevantCurrency = side === 0
        ? selectedPool.quoteCurrency as HexAddress  // For buys, we need quote currency (USDC)
        : selectedPool.baseCurrency as HexAddress;  // For sells, we need base currency (ETH)

      const depositBigInt = parseUnits(depositAmount, 18); // Assuming 18 decimals
      await deposit(relevantCurrency, depositBigInt);

      // Reset and refresh balance
      setDepositAmount('');
      setDepositMode(false);

      // Refresh balance
      try {
        const total = await getTotalAvailableBalance(relevantCurrency);
        setAvailableBalance(formatUnits(total, 18));

        // Show success message
        setNotificationMessage("Successfully deposited funds.");
        setNotificationSuccess(true);
        // You can set transaction hash here if available
        // setNotificationTxHash(depositTxHash);
        setShowNotification(true);
      } catch (error) {
        console.error('Failed to refresh balance after deposit:', error);
      }
    } catch (error) {
      console.error('Deposit error:', error);

      setNotificationMessage("There was an error processing your deposit.");
      setNotificationSuccess(false);
      setNotificationTxHash(undefined);
      setShowNotification(true);
    }
  };

  const isPending = isLimitOrderPending || isMarketOrderPending;
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming;
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed;
  const orderError = limitSimulateError || marketSimulateError;

  if (poolsLoading) return <div className="text-sm text-gray-300">Loading trading pairs...</div>;
  if (poolsError) return <div className="text-sm text-red-400">Error loading trading pairs: {(poolsError as Error).message}</div>;

  return (
    <div className="bg-gray-900 rounded-lg p-5 max-w-md mx-auto border border-gray-800 shadow-lg">
      <h2 className="text-xl font-medium text-white mb-4 flex items-center justify-between">
        <span>Place Order</span>
        {isConnected && (
          <div className="text-sm text-gray-400">
            {selectedPool?.coin}
          </div>
        )}
      </h2>

      {/* Trading Pair and Balance Row */}
      <div className="flex flex-col w-full gap-3 mb-4">
        <div className="w-full">
          <select
            className="w-full bg-gray-800 text-white text-sm rounded py-2 px-3 border border-gray-700"
            value={selectedPool?.id || ''}
            onChange={handlePoolChange}
          >
            {poolsData?.poolss.items.map((pool: any) => (
              <option key={pool.id} value={pool.id}>
                {pool.coin}
              </option>
            ))}
          </select>
        </div>

        {isConnected && selectedPool && (
          <div>
            <h2 className="text-gray-400">Balance Available: </h2>
            <div className="w-full bg-gray-800 rounded py-2 px-3 text-sm border border-gray-700 flex justify-between items-center">

              <div>
                <span className="text-white">
                  {isLoadingBalance || balanceLoading ? '...' :
                    availableBalance === 'Error' ? 'Error' :
                      `${parseFloat(availableBalance).toFixed(4)}`}
                </span>

              </div>
              <span className="ml-1 text-gray-400">
                {side === 0 ? 'USDC' : selectedPool.coin.split('/')[0]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Form */}
      <form onSubmit={handleDeposit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            className="flex-1 bg-gray-800 text-white text-sm rounded-l py-2 px-3 border border-gray-700"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder={`Deposit ${side === 0 ? 'USDC' : selectedPool.coin.split('/')[0]}`}
            step="0.000001"
            min="0"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-r"
            disabled={balanceLoading}
          >
            {balanceLoading ? '...' : 'Deposit'}
          </button>
        </div>
      </form>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type and Side Row */}
        <div className="flex gap-3">
          {/* Order Type Selection */}
          <div className="w-1/2">
            <div className="flex h-9 text-sm rounded overflow-hidden border border-gray-700">
              <button
                type="button"
                className={`flex-1 ${orderType === 'limit' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setOrderType('limit')}
              >
                Limit
              </button>
              <button
                type="button"
                className={`flex-1 ${orderType === 'market' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setOrderType('market')}
              >
                Market
              </button>
            </div>
          </div>

          {/* Buy/Sell Selection */}
          <div className="w-1/2">
            <div className="flex h-9 text-sm rounded overflow-hidden border border-gray-700">
              <button
                type="button"
                className={`flex-1 ${side === 0 ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setSide(0)}
              >
                Buy
              </button>
              <button
                type="button"
                className={`flex-1 ${side === 1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setSide(1)}
              >
                Sell
              </button>
            </div>
          </div>
        </div>

        {/* Price - Only for Limit Orders */}
        {orderType === 'limit' && (
          <div className="relative">
            <div className="flex items-center">
              <input
                type="number"
                className="w-full bg-gray-800 text-white text-sm rounded py-2 px-3 border border-gray-700"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                step="0.000001"
                min="0"
                required
              />
              <span className="absolute right-3 text-sm text-gray-400">
                USDC
              </span>
            </div>

            {/* Best price indicators */}
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-green-400">
                Buy: {bestPriceBuy ? formatUnits(bestPriceBuy.price, 0) : 'N/A'}
              </span>
              <span className="text-red-400">
                Sell: {bestPriceSell ? formatUnits(bestPriceSell.price, 0) : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="relative">
          <input
            type="number"
            className="w-full bg-gray-800 text-white text-sm rounded py-2 px-3 border border-gray-700"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Amount"
            step="0.000001"
            min="0"
            required
          />
          <span className="absolute right-3 top-2 text-sm text-gray-400">
            {selectedPool?.baseCurrency ? selectedPool.coin.split('/')[0] : ''}
          </span>
        </div>

        {/* Total - Calculated Field */}
        <div className="relative">
          <input
            type="text"
            className="w-full bg-gray-800 text-white text-sm rounded py-2 px-3 border border-gray-700"
            value={total}
            placeholder="Total"
            readOnly
          />
          <span className="absolute right-3 top-2 text-sm text-gray-400">
            USDC
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2.5 px-4 rounded text-sm font-medium transition-colors ${side === 0
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
            } ${(isPending || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isPending || isConfirming || !isConnected}
        >
          {isPending ? 'Processing...' :
            isConfirming ? 'Confirming...' :
              isConfirmed ? 'Order Placed!' :
                `${side === 0 ? 'Buy' : 'Sell'} ${selectedPool?.coin.split('/')[0]}`}
        </button>
      </form>

      {/* Success confirmation alert - temporary visual confirmation */}
      {/* {isConfirmed && (
        <div className="mt-3 p-2.5 bg-green-900/50 text-green-200 rounded text-sm border border-green-800">
          Order successfully placed!
        </div>
      )} */}

      {/* Error message block - COMMENTED OUT as requested
      {orderError && (
        <div className="mt-3 p-2.5 bg-red-900/50 text-red-200 rounded text-sm border border-red-800">
          Error: {orderError.message}
        </div>
      )}
      */}

      {!isConnected && (
        <div className="mt-3 p-2.5 bg-yellow-900/50 text-yellow-200 rounded text-sm border border-yellow-800 text-center">
          Please connect wallet to trade
        </div>
      )}

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        isSuccess={notificationSuccess}
        txHash={notificationTxHash}
      />
    </div>


  );
};

export default PlaceOrder;