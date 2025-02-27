import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
// import { useGetBestPrice, useGetNextBestPrices } from '@/hooks/web3/gtx/clob-dex/order-book/useOrderBook';
import { formatUnits } from 'viem';
import { Side } from '@/types/web3/gtx/gtx';
import { useGetBestPrice } from '@/hooks/web3/gtx/clob-dex/orderbook/useGetBestPrice';
import { useGetNextBestPrices } from '@/hooks/web3/gtx/clob-dex/orderbook/useGetNextBestPrices';

interface Order {
  price: number;
  size: number;
  total?: number;
}

interface OrderBook {
  asks: Order[];
  bids: Order[];
  lastPrice: bigint;
  spread: bigint;
  lastUpdate?: number;
}

type ViewType = 'both' | 'bids' | 'asks';
type DecimalPrecision = '0.01' | '0.1' | '1';

const STANDARD_ORDER_COUNT = 8;

const OrderBookDex = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedDecimal, setSelectedDecimal] = useState<DecimalPrecision>('0.01');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const priceOptions = ['0.01', '0.1', '1'];

  const [orderBook, setOrderBook] = useState<OrderBook>({
    asks: [],
    bids: [],
    lastPrice: BigInt(0),
    spread: BigInt(0),
    lastUpdate: Date.now()
  });

  const [viewType, setViewType] = useState<ViewType>('both');

  // Use the custom hooks
  const { getBestPrice, isLoading: isLoadingBestPrice, error: bestPriceError } = useGetBestPrice();
  const { getNextBestPrices, isLoading: isLoadingNextPrices, error: nextPricesError } = useGetNextBestPrices();

  const formatPrice = (price: number | bigint): string => {
    const precision = parseFloat(selectedDecimal);

    // Convert to number if it's BigInt
    const priceNumber = typeof price === 'bigint' ? Number(price) : price;

    const roundedPrice = Math.round(priceNumber / precision) * precision;

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(roundedPrice);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchOrderBook = async () => {
      try {
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

        // Combine best price with next best prices and format
        const asks = [
          {
            price: Number(formatUnits(askBestPrice.price, 6)),
            size: Number(formatUnits(askBestPrice.volume, 18))
          },
          ...nextAsks.map(pv => ({
            price: Number(formatUnits(pv.price, 6)),
            size: Number(formatUnits(pv.volume, 18))
          }))
        ].sort((a, b) => a.price - b.price);

        const bids = [
          {
            price: Number(formatUnits(bidBestPrice.price, 6)),
            size: Number(formatUnits(bidBestPrice.volume, 18))
          },
          ...nextBids.map(pv => ({
            price: Number(formatUnits(pv.price, 6)),
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

        setOrderBook({
          asks: asksWithTotal,
          bids: bidsWithTotal,
          lastPrice: BigInt(Math.round(asks[0]?.price * 10 ** 8)),
          spread: BigInt(Math.round(spread * 10 ** 8)),
          lastUpdate: Date.now()
        });
      } catch (error) {
        console.error('Error fetching order book:', error);
      }
    };

    const interval = setInterval(fetchOrderBook, 1000);
    fetchOrderBook(); // Initial fetch

    return () => clearInterval(interval);
  }, [mounted, getBestPrice, getNextBestPrices]);

  const toggleView = useCallback(() => {
    const views: ViewType[] = ['both', 'bids', 'asks'];
    const currentIndex = views.indexOf(viewType);
    setViewType(views[(currentIndex + 1) % views.length]);
  }, [viewType]);

  const isLoading = isLoadingBestPrice || isLoadingNextPrices;

  // Display error if one occurs
  if (bestPriceError || nextPricesError) {
    return (
      <div className="w-full bg-gray-900 text-white rounded-lg p-4">
        <p className="text-red-500">Error loading order book data</p>
        <p>{bestPriceError?.message || nextPricesError?.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 text-white rounded-b-lg">
      <div className="flex items-center justify-between px-2 py-3 border-b border-gray-800">

        <div className="flex items-center gap-2">
          <button onClick={toggleView}>
            <Menu className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-800 rounded px-2 py-1 transition-colors duration-200 border border-gray-800"
          >
            <span className="text-xs">{selectedDecimal}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded shadow-lg z-50">
              {priceOptions.map((option) => (
                <button
                  key={option}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => {
                    setSelectedDecimal(option as DecimalPrecision);
                    setIsDropdownOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-0 py-2">
        <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-400">
          <div>Price</div>
          <div className="text-center">Size</div>
          <div className="text-right">Total</div>
        </div>

        {/* Loading state */}
        {isLoading && orderBook.asks.length === 0 && orderBook.bids.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {(viewType === 'both' || viewType === 'asks') && (
              <div className="flex flex-col-reverse space-y-[5px] space-y-reverse">
                {orderBook.asks.map((ask, i) => {
                  const maxTotal = orderBook.asks.reduce((max, curr) =>
                    curr.total && max ? (curr.total > max ? curr.total : max) : (curr.total || max || 1),
                    0
                  );

                  return (
                    <div key={`ask-${i}`} className="relative group">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#FF6978] bg-opacity-20"
                        style={{
                          width: `${((ask.total || 0) * 100 / maxTotal)}%`
                        }}
                      />
                      <div className="relative grid grid-cols-3 px-2 py-[2px] text-xs">
                        <div className="text-[#FF6978]">{formatPrice(ask.price)}</div>
                        <div className="text-center text-gray-300">
                          {ask.size.toFixed(6)}
                        </div>
                        <div className="text-right text-gray-300">
                          {(ask.total || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {viewType === 'both' && (
              <div className="px-2 py-1 my-[5px] border-y border-gray-800 text-xs bg-gray-800">
                <div className="flex justify-between text-white">
                  <span>Spread</span>
                  <span>{Number(orderBook.spread) / 10 ** 8}</span>
                </div>
              </div>
            )}

            {(viewType === 'both' || viewType === 'bids') && (
              <div className="space-y-[5px]">
                {orderBook.bids.map((bid, i) => {
                  const maxTotal = orderBook.bids.reduce((max, curr) =>
                    curr.total && max ? (curr.total > max ? curr.total : max) : (curr.total || max || 1),
                    0
                  );

                  return (
                    <div key={`bid-${i}`} className="relative group">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-green-900/20"
                        style={{
                          width: `${((bid.total || 0) * 100 / maxTotal)}%`
                        }}
                      />
                      <div className="relative grid grid-cols-3 px-2 py-[2px] text-xs">
                        <div className="text-green-400">{formatPrice(bid.price)}</div>
                        <div className="text-center text-gray-300">
                          {bid.size.toFixed(6)}
                        </div>
                        <div className="text-right text-gray-300">
                          {(bid.total || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderBookDex;