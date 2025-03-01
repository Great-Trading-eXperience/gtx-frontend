import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ChevronDown } from 'lucide-react';

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

const STANDARD_ORDER_COUNT = 10;

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

const OrderBookSkeleton = () => {
    return (
        <div className="w-full max-w-xs mx-auto bg-gray-900 rounded-xl border border-gray-800 text-white p-4 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-800 rounded" />
                    <div className="w-8 h-8 bg-gray-800 rounded" />
                </div>
                <div className="w-16 h-8 bg-gray-800 rounded" />
            </div>

            <div>
                <div className="grid grid-cols-2 mb-2">
                    <div className="w-12 h-4 bg-gray-800 rounded" />
                    <div className="w-12 h-4 bg-gray-800 rounded ml-auto" />
                </div>

                <div className="space-y-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={`ask-${i}`} className="grid grid-cols-2 gap-4">
                            <div className="w-20 h-4 bg-gray-800 rounded" />
                            <div className="w-20 h-4 bg-gray-800 rounded ml-auto" />
                        </div>
                    ))}
                </div>

                <div className="py-4 flex justify-between">
                    <div className="w-24 h-4 bg-gray-800 rounded" />
                    <div className="w-20 h-4 bg-gray-800 rounded" />
                </div>

                <div className="space-y-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={`bid-${i}`} className="grid grid-cols-2 gap-4">
                            <div className="w-20 h-4 bg-gray-800 rounded" />
                            <div className="w-20 h-4 bg-gray-800 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
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

        return result;
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
        return <OrderBookSkeleton />;
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

                {(viewType === 'both' || viewType === 'asks') && (
                    <div className="flex flex-col-reverse space-y-[5px] space-y-reverse">
                        {orderBook.asks.map((ask, i) => (
                            <div key={`ask-${i}`} className="relative group">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-[#FF6978] bg-opacity-20"
                                    style={{
                                        width: `${(ask.total || 0) / Math.max(...orderBook.asks.map(a => a.total || 0)) * 100}%`
                                    }}
                                />
                                <div className="relative grid grid-cols-3 px-2 py-[2px] text-xs">
                                    <div className="text-[#FF6978]">{formatPrice(ask.price)}</div>
                                    <div className="text-center text-gray-300">{ask.size.toFixed(6)}</div>
                                    <div className="text-right text-gray-300">{(ask.total || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewType === 'both' && (
                    <div className="px-2 py-1 my-[5px] border-y border-gray-800 text-xs bg-gray-800">
                        <div className="flex justify-between text-white">
                            <span>Spread</span>
                            <span>{orderBook.spread}</span>
                        </div>
                    </div>
                )}

                {(viewType === 'both' || viewType === 'bids') && (
                    <div className="space-y-[5px]">
                        {orderBook.bids.map((bid, i) => (
                            <div key={`bid-${i}`} className="relative group">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-green-900/20"
                                    style={{
                                        width: `${(bid.total || 0) / Math.max(...orderBook.bids.map(b => b.total || 0)) * 100}%`
                                    }}
                                />
                                <div className="relative grid grid-cols-3 px-2 py-[2px] text-xs">
                                    <div className="text-green-400">{formatPrice(bid.price)}</div>
                                    <div className="text-center text-gray-300">{bid.size.toFixed(6)}</div>
                                    <div className="text-right text-gray-300">{(bid.total || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderBookPrep;