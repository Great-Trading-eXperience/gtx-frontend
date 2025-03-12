import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown, RefreshCw } from 'lucide-react';
import { OrderBookSkeleton } from './order-book-skeleton';

interface Order {
    price: number;
    size: number;
    total?: number;
}

interface OrderBook {
    asks: Order[];
    bids: Order[];
    lastPrice: number;
    spread: number;
    lastUpdate?: number;
}

type ViewType = 'both' | 'bids' | 'asks';
type DecimalPrecision = '0.01' | '0.1' | '1';

const STANDARD_ORDER_COUNT = 8;

// Mock data for the order book
const MOCK_DATA = {
    asks: [
        ["1845.12", "1.23456"],
        ["1845.65", "0.89732"],
        ["1846.23", "2.34521"],
        ["1847.01", "1.56789"],
        ["1847.84", "3.21548"],
        ["1848.32", "0.76521"],
        ["1848.95", "1.98752"],
        ["1849.43", "2.45632"],
        ["1850.11", "1.12354"],
        ["1850.87", "0.95623"],
        ["1851.34", "1.78952"],
        ["1851.92", "2.56321"],
        ["1852.45", "1.34569"],
        ["1853.21", "0.87542"],
        ["1853.78", "1.56231"],
        ["1854.32", "2.12365"],
        ["1854.91", "1.78952"],
        ["1855.45", "0.92365"],
        ["1856.12", "1.45632"],
        ["1856.78", "2.31456"]
    ],
    bids: [
        ["1844.52", "1.45678"],
        ["1843.98", "2.36541"],
        ["1843.45", "1.12358"],
        ["1842.87", "0.78952"],
        ["1842.23", "2.45632"],
        ["1841.76", "1.36541"],
        ["1841.21", "0.98752"],
        ["1840.67", "1.56321"],
        ["1840.12", "2.36541"],
        ["1839.54", "1.78952"],
        ["1838.98", "0.95623"],
        ["1838.45", "1.23654"],
        ["1837.87", "2.56321"],
        ["1837.34", "1.45632"],
        ["1836.89", "0.87542"],
        ["1836.32", "1.23654"],
        ["1835.78", "2.36541"],
        ["1835.23", "1.12358"],
        ["1834.89", "0.95623"],
        ["1834.32", "1.56321"]
    ]
};

const OrderBookPrep = () => {
    const [mounted, setMounted] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDecimal, setSelectedDecimal] = useState<DecimalPrecision>('0.01');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const priceOptions = ['0.01', '0.1', '1'];
    
    const [orderBook, setOrderBook] = useState<OrderBook>({
        asks: [],
        bids: [],
        lastPrice: 0,
        spread: 0,
        lastUpdate: Date.now()
    });
    
    const [viewType, setViewType] = useState<ViewType>('both');
    const baseToken = "WETH";

    const formatPrice = (price: number): string => {
        const precision = parseFloat(selectedDecimal);
        const roundedPrice = Math.round(price / precision) * precision;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(roundedPrice);
    };

    const processOrders = (orders: string[][], isAsk: boolean): Order[] => {
        const result = orders
            .slice(0, STANDARD_ORDER_COUNT)
            .map(order => ({
                price: parseFloat(order[0]),
                size: parseFloat(order[1]),
                total: 0
            }));

        // Calculate running total
        let runningTotal = 0;
        result.forEach(order => {
            runningTotal += order.size;
            order.total = runningTotal;
        });

        return isAsk ? result.sort((a, b) => a.price - b.price) : result.sort((a, b) => b.price - a.price);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchOrderBook = async () => {
            try {
                // Use mock data instead of actual API call
                const asks = processOrders(MOCK_DATA.asks, true);
                const bids = processOrders(MOCK_DATA.bids, false);
                
                const lastPrice = parseFloat(MOCK_DATA.asks[0][0]);
                const spread = Number((parseFloat(MOCK_DATA.asks[0][0]) - parseFloat(MOCK_DATA.bids[0][0])).toFixed(2));

                setOrderBook({
                    asks,
                    bids,
                    lastPrice,
                    spread,
                    lastUpdate: Date.now()
                });
                
                // Add some randomness to simulate real-time updates
                if (!initialLoading) {
                    // Randomly modify some prices and sizes to simulate market movement
                    MOCK_DATA.asks.forEach((ask, index) => {
                        if (Math.random() > 0.7) {
                            const currentPrice = parseFloat(ask[0]);
                            const priceChange = (Math.random() - 0.5) * 0.1;
                            MOCK_DATA.asks[index][0] = (currentPrice + priceChange).toFixed(2);
                            
                            const currentSize = parseFloat(ask[1]);
                            const sizeChange = (Math.random() - 0.5) * 0.2;
                            MOCK_DATA.asks[index][1] = Math.max(0.01, currentSize + sizeChange).toFixed(5);
                        }
                    });
                    
                    MOCK_DATA.bids.forEach((bid, index) => {
                        if (Math.random() > 0.7) {
                            const currentPrice = parseFloat(bid[0]);
                            const priceChange = (Math.random() - 0.5) * 0.1;
                            MOCK_DATA.bids[index][0] = (currentPrice + priceChange).toFixed(2);
                            
                            const currentSize = parseFloat(bid[1]);
                            const sizeChange = (Math.random() - 0.5) * 0.2;
                            MOCK_DATA.bids[index][1] = Math.max(0.01, currentSize + sizeChange).toFixed(5);
                        }
                    });
                }
            } catch (error) {
                console.error('Error processing order book:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        const interval = setInterval(fetchOrderBook, 1000);
        fetchOrderBook(); // Initial fetch

        return () => clearInterval(interval);
    }, [mounted, initialLoading]);

    const toggleView = useCallback(() => {
        const views: ViewType[] = ['both', 'bids', 'asks'];
        const currentIndex = views.indexOf(viewType);
        setViewType(views[(currentIndex + 1) % views.length]);
    }, [viewType]);

    if (!mounted || initialLoading) {
        return (
            <div className="w-full overflow-hidden rounded-b-xl bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">
                <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-b-xl bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleView}
                        className="rounded-lg bg-gray-900/40 p-1.5 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-gray-300"
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-300">
                        {viewType === "both" ? "Order Book" : viewType === "asks" ? "Asks Only" : "Bids Only"}
                    </span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 rounded border border-gray-700/50 bg-gray-900/40 px-3 py-1.5 text-gray-200 transition-all duration-200 hover:bg-gray-800/50"
                    >
                        <span className="text-xs">Precision: {selectedDecimal}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-700/50 bg-gray-900 shadow-lg">
                            {priceOptions.map((option) => (
                                <button
                                    key={option}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-200 transition-colors duration-200 hover:bg-gray-800 hover:text-white"
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

            <div className="py-2">
                {(viewType === 'both' || viewType === 'asks') && (
                    <div>
                        {/* Column Headers for Asks */}
                        <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                            <div>Price ({baseToken})</div>
                            <div className="text-center">Size ({baseToken})</div>
                            <div className="text-right">Total</div>
                        </div>

                        <div className="flex flex-col-reverse space-y-[2px] space-y-reverse">
                            {orderBook.asks.map((ask, i) => {
                                const maxTotal = orderBook.asks.reduce(
                                    (max, curr) =>
                                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                                    0,
                                );

                                return (
                                    <div key={`ask-${i}`} className="group relative">
                                        <div
                                            className="absolute bottom-0 left-0 top-0 bg-rose-500/10 transition-all group-hover:bg-rose-500/20"
                                            style={{
                                                width: `${((ask.total || 0) * 100) / maxTotal}%`,
                                            }}
                                        />
                                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                                            <div className="font-medium text-rose-400">{formatPrice(ask.price)}</div>
                                            <div className="text-center text-gray-200">{ask.size.toFixed(6)}</div>
                                            <div className="text-right text-gray-200">{(ask.total || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewType === 'both' && (
                    <div className="my-2 border-y border-gray-800/30 bg-gray-900/40 px-4 py-2 text-xs">
                        <div className="flex justify-between text-gray-200">
                            <span>Spread</span>
                            <span className="font-medium text-white">
                                {orderBook.spread} ({baseToken})
                            </span>
                        </div>
                    </div>
                )}

                {(viewType === 'both' || viewType === 'bids') && (
                    <div>
                        {/* Column Headers for Bids */}
                        <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                            <div>Price (USDC)</div>
                            <div className="text-center">Size (USDC)</div>
                            <div className="text-right">Total</div>
                        </div>

                        <div className="space-y-[2px]">
                            {orderBook.bids.map((bid, i) => {
                                const maxTotal = orderBook.bids.reduce(
                                    (max, curr) =>
                                        curr.total && max ? (curr.total > max ? curr.total : max) : curr.total || max || 1,
                                    0,
                                );

                                return (
                                    <div key={`bid-${i}`} className="group relative">
                                        <div
                                            className="absolute bottom-0 left-0 top-0 bg-emerald-500/10 transition-all group-hover:bg-emerald-500/20"
                                            style={{
                                                width: `${((bid.total || 0) * 100) / maxTotal}%`,
                                            }}
                                        />
                                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                                            <div className="font-medium text-emerald-400">{formatPrice(bid.price)}</div>
                                            <div className="text-center text-gray-200">{bid.size.toFixed(6)}</div>
                                            <div className="text-right text-gray-200">{(bid.total || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderBookPrep;