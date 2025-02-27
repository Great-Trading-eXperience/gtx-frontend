import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useAccount } from 'wagmi';

import { 
    useCancelOrder, useGetBestPrice, useGetNextBestPrices, useGetUserActiveOrders, usePlaceOrder 
} from '@/hooks/web3/gtx/clob-dex/order-book/useOrderBook';
import { parseUnits, formatUnits } from 'viem';

// Enum for order side
enum Side {
  Buy = 0,
  Sell = 1,
}

// Interface for order
interface Order {
  price: number;
  size: number;
  total?: number;
  id?: number; // Order ID from contract
  timestamp?: number;
  status?: number;
}

// Interface for orderbook
interface OrderBook {
  asks: Order[];
  bids: Order[];
  lastPrice: number;
  spread: number;
  lastUpdate?: number;
}

type ViewType = 'both' | 'bids' | 'asks';
type DecimalPrecision = '0.01' | '0.1' | '1';

const STANDARD_ORDER_COUNT = 10;

const OrderBookComponent = () => {
  // State
  const [mounted, setMounted] = useState(false);
  const [selectedDecimal, setSelectedDecimal] = useState<DecimalPrecision>('0.01');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('both');
  const [orderBook, setOrderBook] = useState<OrderBook>({
    asks: [],
    bids: [],
    lastPrice: 0,
    spread: 0,
    lastUpdate: Date.now()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Get user account
  const { address } = useAccount();

  // Get hooks
  const { getBestPrice, isLoading: isBestPriceLoading } = useGetBestPrice();
  const { getNextBestPrices, isLoading: isNextBestPricesLoading } = useGetNextBestPrices();
  const { getUserActiveOrders, isLoading: isUserOrdersLoading } = useGetUserActiveOrders();
  const { placeOrder, isPlacingOrder } = usePlaceOrder({
    onSuccess: () => {
      // Refresh orderbook after successful order placement
      fetchOrderBookData();
      fetchUserOrders();
    }
  });
  const { cancelOrder, isCancelling } = useCancelOrder({
    onSuccess: () => {
      // Refresh orderbook and user orders after cancellation
      fetchOrderBookData();
      fetchUserOrders();
    }
  });

  // Function to fetch orderbook data
  const fetchOrderBookData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get best ask price
      const askBestPrice = await getBestPrice({ side: Side.Sell });
      
      // Get best bid price
      const bidBestPrice = await getBestPrice({ side: Side.Buy });
      
      // Get next best ask prices
      const nextAsks = await getNextBestPrices({
        side: Side.Sell,
        price: askBestPrice.price,
        count: STANDARD_ORDER_COUNT - 1
      });
      
      // Get next best bid prices
      const nextBids = await getNextBestPrices({
        side: Side.Buy,
        price: bidBestPrice.price,
        count: STANDARD_ORDER_COUNT - 1
      });

      // Combine best price with next best prices
      const asks = [
        {
          price: Number(formatUnits(askBestPrice.price, 8)),
          size: Number(formatUnits(askBestPrice.volume, 18))
        },
        ...nextAsks.map(pv => ({
          price: Number(formatUnits(pv.price, 8)),
          size: Number(formatUnits(pv.volume, 18))
        }))
      ].sort((a, b) => a.price - b.price);

      const bids = [
        {
          price: Number(formatUnits(bidBestPrice.price, 8)),
          size: Number(formatUnits(bidBestPrice.volume, 18))
        },
        ...nextBids.map(pv => ({
          price: Number(formatUnits(pv.price, 8)),
          size: Number(formatUnits(pv.volume, 18))
        }))
      ].sort((a, b) => b.price - a.price);

      // Calculate totals
      let bidTotal = 0;
      const bidsWithTotal = bids.map(bid => {
        bidTotal += bid.size;
        return { ...bid, total: bidTotal };
      });

      let askTotal = 0;
      const asksWithTotal = asks.map(ask => {
        askTotal += ask.size;
        return { ...ask, total: askTotal };
      });

      // Calculate spread
      const spread = Number((asks[0]?.price - bids[0]?.price).toFixed(2));

      // Update orderbook state
      setOrderBook({
        bids: bidsWithTotal,
        asks: asksWithTotal,
        lastPrice: bids[0]?.price || 0,
        spread: spread,
        lastUpdate: Date.now()
      });
    } catch (error) {
      console.error('Error fetching orderbook data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getBestPrice, getNextBestPrices]);

  // Function to fetch user orders
  const fetchUserOrders = useCallback(async () => {
    if (!address) return;
    
    try {
      const orders = await getUserActiveOrders({ user: address });
      setUserOrders(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  }, [address, getUserActiveOrders]);

  // Initial data load
  useEffect(() => {
    setMounted(true);
    fetchOrderBookData();

    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      fetchOrderBookData();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchOrderBookData]);

  // Fetch user orders when address changes
  useEffect(() => {
    if (address) {
      fetchUserOrders();
    }
  }, [address, fetchUserOrders]);

  // Format price with selected decimal precision
  const formatPrice = (price: number): string => {
    const precision = parseFloat(selectedDecimal);
    const roundedPrice = Math.round(price / precision) * precision;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(roundedPrice);
  };

  // Toggle view function
  const toggleView = useCallback(() => {
    const views: ViewType[] = ['both', 'bids', 'asks'];
    const currentIndex = views.indexOf(viewType);
    setViewType(views[(currentIndex + 1) % views.length]);
  }, [viewType]);

  // Cancel order function
  const handleCancelOrder = async (order: any, side: Side) => {
    if (!address) return;
    
    try {
      await cancelOrder({
        side: side,
        price: BigInt(Math.floor(order.price * 100000000)), // Convert to contract format (8 decimals)
        orderId: order.id,
        user: address
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  // Place order function
  const handlePlaceOrder = async (price: number, size: number, side: Side) => {
    if (!address) return;
    
    try {
      await placeOrder({
        price: BigInt(Math.floor(price * 100000000)), // Convert to contract format (8 decimals)
        quantity: BigInt(Math.floor(size * 1e18)), // Convert to wei (18 decimals)
        side: side,
        user: address
      });
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  // Show loading skeleton if not mounted or loading
  if (!mounted || isLoading) {
    return <OrderBookSkeleton />;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-b-lg shadow-lg">
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors duration-200 border border-gray-200 dark:border-gray-800"
          >
            <span className="text-xs">{selectedDecimal}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
              {["0.01", "0.1", "1"].map((option) => (
                <button
                  key={option}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => {
                    setSelectedDecimal(option as DecimalPrecision)
                    setIsDropdownOpen(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={toggleView} 
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
        >
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="px-0 py-2">
        <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
          <div>Price</div>
          <div className="text-center">Size</div>
          <div className="text-right">Total</div>
        </div>

        {(viewType === 'both' || viewType === 'asks') && (
          <div className="space-y-[5px]">
            {orderBook.asks.sort((a, b) => b.price - a.price).slice(-7).map((ask, i) => {
              const isUserOrder = userOrders.some(order => 
                Number(formatUnits(order.price, 8)) === ask.price && order.status === 0
              );
              
              return (
                <div key={`ask-${i}`} className="relative group">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-100 dark:bg-[#FF6978] dark:bg-opacity-20"
                    style={{
                      width: `${(ask.total || 0) / Math.max(...orderBook.asks.map(a => a.total || 0)) * 100}%`
                    }}
                  />
                  <div 
                    className={`relative grid grid-cols-3 px-2 py-[2px] text-xs ${isUserOrder ? 'bg-opacity-20 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                    onClick={() => {
                      if (isUserOrder) {
                        const order = userOrders.find(order => Number(formatUnits(order.price, 8)) === ask.price);
                        if (order) handleCancelOrder(order, Side.Sell);
                      } else {
                        // Optional: allow placing opposing orders by clicking
                        // handlePlaceOrder(ask.price, 1, Side.Buy);
                      }
                    }}
                  >
                    <div className="text-red-600 dark:text-[#FF6978]">{formatPrice(ask.price)}</div>
                    <div className="text-center text-gray-700 dark:text-gray-300">{formatPrice(ask.size)}</div>
                    <div className="text-right text-gray-700 dark:text-gray-300">{formatPrice(ask.total ?? 0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewType === 'both' && (
          <div className="px-2 py-1 my-[5px] border-y border-gray-200 dark:border-gray-800 text-xs bg-gray-100 dark:bg-gray-800">
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Spread</span>
              <span>{orderBook.spread}</span>
            </div>
          </div>
        )}

        {(viewType === 'both' || viewType === 'bids') && (
          <div className="space-y-[5px]">
            {orderBook.bids.slice(-7).map((bid, i) => {
              const isUserOrder = userOrders.some(order => 
                Number(formatUnits(order.price, 8)) === bid.price && order.status === 0
              );
              
              return (
                <div key={`bid-${i}`} className="relative group">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-green-100 dark:bg-green-900/20"
                    style={{
                      width: `${(bid.total || 0) / Math.max(...orderBook.bids.map(b => b.total || 0)) * 100}%`
                    }}
                  />
                  <div 
                    className={`relative grid grid-cols-3 px-2 py-[2px] text-xs ${isUserOrder ? 'bg-opacity-20 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                    onClick={() => {
                      if (isUserOrder) {
                        const order = userOrders.find(order => Number(formatUnits(order.price, 8)) === bid.price);
                        if (order) handleCancelOrder(order, Side.Buy);
                      } else {
                        // Optional: allow placing opposing orders by clicking
                        // handlePlaceOrder(bid.price, 1, Side.Sell);
                      }
                    }}
                  >
                    <div className="text-green-600 dark:text-green-400">{formatPrice(bid.price)}</div>
                    <div className="text-center text-gray-700 dark:text-gray-300">{formatPrice(bid.size)}</div>
                    <div className="text-right text-gray-700 dark:text-gray-300">{formatPrice(bid.total ?? 0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderBookSkeleton = () => {
  return (
    <div className="w-full h-[591px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-b-lg">
      <div className="flex items-center justify-between px-2 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="w-16 h-6 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      <div className="h-[calc(620px-48px)] flex flex-col px-0 py-2">
        <div className="grid grid-cols-3 px-2 py-1">
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded justify-self-center" />
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded justify-self-end" />
        </div>

        <div className="flex-1 flex flex-col-reverse space-y-[5px] space-y-reverse">
          {[...Array(10)].map((_, i) => (
            <div key={`ask-${i}`} className="grid grid-cols-3 px-2 py-[2px]">
              <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded" />
              <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-center" />
              <div className="w-16 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-end" />
            </div>
          ))}
        </div>

        <div className="px-2 py-1 my-[5px] border-y border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
          <div className="flex justify-between">
            <div className="w-12 h-3 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="w-16 h-3 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>

        <div className="flex-1 space-y-[5px]">
          {[...Array(10)].map((_, i) => (
            <div key={`bid-${i}`} className="grid grid-cols-3 px-2 py-[2px]">
              <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded" />
              <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-center" />
              <div className="w-16 h-3 bg-gray-100 dark:bg-gray-800/50 rounded justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBookComponent;