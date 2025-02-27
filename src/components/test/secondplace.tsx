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
import { useGTXRouter } from '@/hooks/web3/gtx/clob-dex/gtx-router/useGTXRouter';
import { toast } from 'sonner';

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
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_GTX_ROUTER_ADDRESS as HexAddress;
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

  // Use the trading balances hook for balance management
  const {
    getWalletBalance,
    getTotalAvailableBalance,
    deposit,
    loading: balanceLoading
  } = useTradingBalances(BALANCE_MANAGER_ADDRESS);

  // Use the orderbook API for price data
  const {
    bestPriceBuy,
    bestPriceSell,
    isLoadingBestPrices,
    refreshOrderBook
  } = useOrderBookAPI(orderBookAddress as HexAddress || '0x0000000000000000000000000000000000000000');

  // Use GTXRouter hook for placing orders through the router
  const {
    placeOrderMutation,
    placeOrderWithDepositMutation,
    placeMarketOrderMutation,
    placeMarketOrderWithDepositMutation,
    steps: routerSteps,
    txHash: routerTxHash
  } = useGTXRouter(ROUTER_ADDRESS);

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

  const handlePoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poolId = e.target.value;
    const pool = poolsData?.poolss.items.find((p: any) => p.id === poolId);
    setSelectedPool(pool);
    setOrderBookAddress(pool?.orderBook as HexAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !selectedPool || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Convert string values to proper types
      const quantityBigInt = parseUnits(quantity, 18); // Assuming 18 decimals
      
      // Create a pool key from the selected pool
      const poolKey = {
        baseCurrency: selectedPool.baseCurrency as HexAddress,
        quoteCurrency: selectedPool.quoteCurrency as HexAddress
      };
      
      // Log the order details for debugging
      console.log('Placing order with parameters:');
      console.log('Pool Key:', poolKey);
      console.log('Order Type:', orderType);
      console.log('Side:', side);
      console.log('Router Address:', ROUTER_ADDRESS);
      
      if (orderType === 'limit') {
        // For limit orders
        const priceBigInt = parseUnits(price, 0); // Price as uint64 with 0 decimals
        console.log('Price:', priceBigInt.toString());
        console.log('Quantity:', quantityBigInt.toString());
        
        // Use placeOrderWithDeposit to handle token approval + deposit + order in one transaction
        const result = await placeOrderWithDepositMutation.mutateAsync({
          key: poolKey,
          price: priceBigInt,
          quantity: quantityBigInt,
          side: side
        });
        
        console.log('Order result:', result);
      } else {
        // For market orders
        console.log('Quantity:', quantityBigInt.toString());
        
        // If market order with deposit, we still need a max price parameter
        const maxPriceBigInt = bestPriceSell 
          ? bestPriceSell.price * BigInt(2)  // 2x the best ask price as a safe max price
          : parseUnits('1000000', 0);       // Fallback max price if best price is unknown
          
        console.log('Max Price for Market Order:', maxPriceBigInt.toString());
        
        // Use market order with deposit
        const result = await placeMarketOrderWithDepositMutation.mutateAsync({
          key: poolKey,
          price: maxPriceBigInt,  // Max price willing to pay (for buy orders)
          quantity: quantityBigInt,
          side: side
        });
        
        console.log('Market order result:', result);
      }
      
      // Refresh balances after order
      const relevantCurrency = side === 0 
        ? selectedPool.quoteCurrency as HexAddress
        : selectedPool.baseCurrency as HexAddress;
        
      const newBalance = await getTotalAvailableBalance(relevantCurrency);
      setAvailableBalance(formatUnits(newBalance, 18));
      
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. See console for details.');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !selectedPool || !address) {
      alert('Please connect your wallet first');
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
      } catch (error) {
        console.error('Failed to refresh balance after deposit:', error);
      }
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  // Determine if any order operation is pending
  const isPending = 
    placeOrderMutation.isPending || 
    placeOrderWithDepositMutation.isPending || 
    placeMarketOrderMutation.isPending || 
    placeMarketOrderWithDepositMutation.isPending;
  
  // Determine if order is confirming (waiting for transaction receipt)
  const isConfirming = routerSteps.some(step => step.status === 'loading');
  
  // Determine if order was confirmed successfully
  const isConfirmed = 
    placeOrderMutation.isSuccess || 
    placeOrderWithDepositMutation.isSuccess || 
    placeMarketOrderMutation.isSuccess || 
    placeMarketOrderWithDepositMutation.isSuccess;
  
  // Determine if there was an error
  const orderError = 
    placeOrderMutation.error || 
    placeOrderWithDepositMutation.error || 
    placeMarketOrderMutation.error || 
    placeMarketOrderWithDepositMutation.error;

  if (poolsLoading) return <div>Loading trading pairs...</div>;
  if (poolsError) return <div>Error loading trading pairs: {(poolsError as Error).message}</div>;

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Place Order</h2>
      
      {/* Balance Display */}
      {isConnected && selectedPool && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-300">Available: </span>
              <span className="text-white font-medium">
                {isLoadingBalance || balanceLoading ? 'Loading...' : 
                  availableBalance === 'Error' ? 'Error loading balance' : 
                  `${parseFloat(availableBalance).toFixed(6)}`}
              </span>
              <span className="ml-1 text-gray-400">
                {side === 0 
                  ? 'USDC' 
                  : selectedPool.coin.split('/')[0]}
              </span>
            </div>
            <button
              type="button"
              className="text-blue-400 text-sm underline"
              onClick={() => setDepositMode(!depositMode)}
            >
              {depositMode ? 'Cancel' : 'Deposit'}
            </button>
          </div>

          {depositMode && (
            <form onSubmit={handleDeposit} className="mt-3">
              <div className="flex">
                <input
                  type="number"
                  className="flex-1 bg-gray-600 text-white rounded-l p-2"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Deposit amount in ${side === 0 ? 'USDC' : selectedPool.coin.split('/')[0]}`}
                  step="0.000001"
                  min="0"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 rounded-r"
                  disabled={balanceLoading}
                >
                  {balanceLoading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Trading Pair Selection */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Trading Pair</label>
          <select 
            className="w-full bg-gray-700 text-white rounded p-2"
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
        
        {/* Order Type Selection */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Order Type</label>
          <div className="flex">
            <button 
              type="button"
              className={`flex-1 p-2 rounded-l ${orderType === 'limit' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button 
              type="button"
              className={`flex-1 p-2 rounded-r ${orderType === 'market' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>
        </div>
        
        {/* Buy/Sell Selection */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Side</label>
          <div className="flex">
            <button 
              type="button"
              className={`flex-1 p-2 rounded-l ${side === 0 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSide(0)}
            >
              Buy
            </button>
            <button 
              type="button"
              className={`flex-1 p-2 rounded-r ${side === 1 ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setSide(1)}
            >
              Sell
            </button>
          </div>
        </div>
        
        {/* Price - Only for Limit Orders */}
        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">
              Price {isLoadingBestPrices && <span className="text-xs">(loading best price...)</span>}
            </label>
            <div className="flex items-center">
              <input 
                type="number"
                className="w-full bg-gray-700 text-white rounded p-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                step="0.000001"
                min="0"
                required
              />
              <span className="ml-2 text-gray-400">
                {selectedPool?.quoteCurrency ? 'USDC' : ''}
              </span>
            </div>
            
            {/* Best price indicators */}
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-green-400">
                Best Buy: {bestPriceBuy ? formatUnits(bestPriceBuy.price, 0) : 'N/A'}
              </span>
              <span className="text-red-400">
                Best Sell: {bestPriceSell ? formatUnits(bestPriceSell.price, 0) : 'N/A'}
              </span>
            </div>
          </div>
        )}
        
        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Amount</label>
          <div className="flex items-center">
            <input 
              type="number"
              className="w-full bg-gray-700 text-white rounded p-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter amount"
              step="0.000001"
              min="0"
              required
            />
            <span className="ml-2 text-gray-400">
              {selectedPool?.baseCurrency ? selectedPool.coin.split('/')[0] : ''}
            </span>
          </div>
        </div>
        
        {/* Total - Calculated Field */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Total</label>
          <div className="flex items-center">
            <input 
              type="text"
              className="w-full bg-gray-700 text-white rounded p-2"
              value={total}
              readOnly
            />
            <span className="ml-2 text-gray-400">
              {selectedPool?.quoteCurrency ? 'USDC' : ''}
            </span>
          </div>
        </div>
        
        {/* Steps Display - Show when order is being processed */}
        {(isPending || isConfirming) && routerSteps.length > 0 && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <h3 className="text-white text-sm font-semibold mb-2">Order Progress:</h3>
            <ul>
              {routerSteps.map((step, index) => (
                <li key={index} className="flex items-center py-1">
                  {step.status === 'idle' && <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>}
                  {step.status === 'loading' && <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse mr-2"></span>}
                  {step.status === 'success' && <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>}
                  {step.status === 'error' && <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>}
                  
                  <span className={`text-sm ${
                    step.status === 'idle' ? 'text-gray-400' :
                    step.status === 'loading' ? 'text-yellow-400' :
                    step.status === 'success' ? 'text-green-400' :
                    'text-red-400'
                  }`}>
                    Step {step.step}
                    {step.error && (
                      <span className="block text-xs text-red-400">
                        Error: {step.error}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            
            {routerTxHash && (
              <div className="mt-2 text-xs text-blue-400 break-all">
                Transaction: {routerTxHash}
              </div>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <button 
          type="submit" 
          className={`w-full p-3 rounded font-semibold ${
            side === 0 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${(isPending || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isPending || isConfirming || !isConnected}
        >
          {isPending ? 'Processing Order...' : 
           isConfirming ? 'Confirming Transaction...' : 
           isConfirmed ? 'Order Placed!' :
           `${side === 0 ? 'Buy' : 'Sell'} ${orderType === 'limit' ? 'Limit' : 'Market'}`}
        </button>
      </form>
      
      {/* Status Message */}
      {isConfirmed && (
        <div className="mt-4 p-3 bg-green-900 text-green-200 rounded">
          <p className="font-semibold">Order placed successfully!</p>
          {routerTxHash && (
            <p className="text-xs mt-1 break-all">
              Transaction Hash: {routerTxHash}
            </p>
          )}
        </div>
      )}
      
      {orderError && (
        <div className="mt-4 p-3 bg-red-900 text-red-200 rounded">
          <p className="font-semibold">Error placing order:</p>
          <p className="text-sm mt-1">{orderError.message}</p>
        </div>
      )}
      
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-900 text-yellow-200 rounded text-center">
          Please connect your wallet to place orders
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;