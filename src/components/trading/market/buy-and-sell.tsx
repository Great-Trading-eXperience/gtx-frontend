import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Info, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { ButtonConnectWallet } from '@/components/button-connect-wallet.tsx/button-connect-wallet';
// Import the needed hooks from the first file
import { usePlaceOrder, usePlaceMarketOrder, useGetBestPrice } from '@/hooks/web3/gtx/clob-dex/order-book/useOrderBook';

import { Side } from '@/types/web3/gtx/gtx';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';

// GraphQL query for pools
const poolsQuery = gql`
  query GetPools {
    poolss {
      items {
        baseCurrency
        coin
        id
        lotSize
        maxOrderAmount
        orderBook
        quoteCurrency
        timestamp
      }
    }
  }
`;

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    return isClient;
};

const CurrencyIcon = ({ type }: { type: string }) => (
    <div className="relative">
        <Image
            src={`/${type.toLowerCase()}.png`}
            alt={type.toUpperCase()}
            width={28}
            height={28}
            className="object-contain"
        />
    </div>
);

const BuyAndSellComponent = () => {
    const [orderType, setOrderType] = useState('limit');
    const [side, setSide] = useState('buy');
    const [price, setPrice] = useState('');
    const [size, setSize] = useState('');
    const [selectedPool, setSelectedPool] = useState<any>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { address } = useAccount();
    const isClient = useIsClient();
    
    // Fetch pools from GraphQL
    const { loading: loadingPools, error: poolsError, data: poolsData } = useQuery(poolsQuery, {
        context: { uri: GTX_GRAPHQL_URL }
    });

    // Use hooks for placing limit and market orders
    const { placeOrder, isPlacingOrder: isPlacingLimitOrder, error: limitOrderError } = usePlaceOrder({
        onSuccess: (receipt) => {
            toast.success('Limit order placed successfully', {
                description: `Transaction hash: ${receipt.transactionHash.slice(0, 10)}...`
            });
            setPrice('');
            setSize('');
        },
        onError: (error) => {
            toast.error('Failed to place limit order', {
                description: error.message
            });
        }
    });

    const { placeMarketOrder, isPlacingOrder: isPlacingMarketOrder, error: marketOrderError } = usePlaceMarketOrder({
        onSuccess: (receipt) => {
            toast.success('Market order placed successfully', {
                description: `Transaction hash: ${receipt.transactionHash.slice(0, 10)}...`
            });
            setSize('');
        },
        onError: (error) => {
            toast.error('Failed to place market order', {
                description: error.message
            });
        }
    });

    // Use the best price hook to get the current market price
    const { getBestPrice, isLoading: isLoadingPrice, error: priceError } = useGetBestPrice();

    // Select the first pool when data loads
    useEffect(() => {
        if (poolsData?.poolss?.items?.length > 0 && !selectedPool) {
            setSelectedPool(poolsData.poolss.items[0]);
        }
    }, [poolsData, selectedPool]);

    // Fetch best price when side changes or when pool changes
    useEffect(() => {
        if (orderType === 'market' && selectedPool) {
            const fetchBestPrice = async () => {
                try {
                    // Get the opposite side's best price for market orders
                    // For buy orders, we want to know the best sell price and vice versa
                    const oppositeSide = side === 'buy' ? Side.Sell : Side.Buy;
                    const bestPriceInfo = await getBestPrice({ side: oppositeSide });
                    
                    if (bestPriceInfo && bestPriceInfo.price) {
                        // Convert from bigint to a readable format (assuming 6 decimal places)
                        const readablePrice = Number(bestPriceInfo.price) / 1e6;
                        setPrice(readablePrice.toString());
                    }
                } catch (error) {
                    console.error('Error fetching best price:', error);
                }
            };
            
            fetchBestPrice();
        }
    }, [side, orderType, getBestPrice, selectedPool]);

    // Combined loading state
    const isPlacing = isPlacingLimitOrder || isPlacingMarketOrder;

    if (!isClient) return null;

    const handleSubmit = async () => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!selectedPool) {
            toast.error('Please select a trading pair');
            return;
        }

        if (orderType === 'limit' && !price) {
            toast.error('Please enter a price');
            return;
        }

        if (!size) {
            toast.error('Please enter a size');
            return;
        }

        // Validate order against maxOrderAmount from the contract
        if (selectedPool.maxOrderAmount && parseFloat(size) > parseFloat(selectedPool.maxOrderAmount)) {
            toast.error(`Order size exceeds maximum allowed (${selectedPool.maxOrderAmount})`);
            return;
        }

        try {
            // Convert inputs to appropriate formats based on the contract's expected inputs
            // Price is stored as a uint64 in the contract
            const priceValue = BigInt(Math.floor(parseFloat(price) * 1e6)); // Convert to uint64 (assuming 6 decimals)
            
            // Use the lot size from the selected pool for proper size conversion as defined in the contract
            const lotSizeDecimals = selectedPool.lotSize ? Number(selectedPool.lotSize) : 18;
            const sizeMultiplier = 10n ** BigInt(lotSizeDecimals);
            const sizeValue = BigInt(Math.floor(parseFloat(size) * Number(sizeMultiplier))); 
            
            // Convert side to the Side enum used in the contract
            const orderSide = side === 'buy' ? Side.Buy : Side.Sell;
            const formattedAddress = address as `0x${string}`;

            // Use the orderBook address from the selected pool if available
            const orderBookAddress = selectedPool.orderBook;
            
            if (orderType === 'limit') {
                // Place a limit order
                // The contract function is:
                // placeOrder(Price price, Quantity quantity, Side side, address user)
                await placeOrder({
                    price: priceValue,
                    quantity: sizeValue,
                    side: orderSide,
                    user: formattedAddress
                });
                
                // When this succeeds, the contract will:
                // 1. Create an order with status OPEN
                // 2. Add it to the order queue for the given price and side
                // 3. Lock the user's balance via the balanceManager
                // 4. Try to match the order with existing orders on the opposite side
            } else {
                // Place a market order
                // The contract function is:
                // placeMarketOrder(Quantity quantity, Side side, address user)
                await placeMarketOrder({
                    quantity: sizeValue,
                    side: orderSide,
                    user: formattedAddress
                });
                
                // When this succeeds, the contract will:
                // 1. Create a market order
                // 2. Immediately try to match it with existing orders at the best prices
                // 3. The order will be either fully filled or partially filled
            }

            // Reset form after successful submission
            if (orderType === 'limit') {
                setPrice('');
            }
            setSize('');
        } catch (error) {
            console.error('Order placement error:', error);
            toast.error('Failed to place order', {
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    };

    // Function to get the correct currency display for the selected pool
    const getBaseCurrency = () => {
        return selectedPool?.baseCurrency || 'ETH';
    };

    const getQuoteCurrency = () => {
        return selectedPool?.quoteCurrency || 'USDC';
    };

    // Get currency for price and size based on side
    const getPriceCurrency = () => {
        return side === 'buy' ? getQuoteCurrency() : getBaseCurrency();
    };

    const getSizeCurrency = () => {
        return side === 'buy' ? getBaseCurrency() : getQuoteCurrency();
    };

    // Loading message if pools are still loading
    if (!isClient || loadingPools) {
        return (
            <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg p-8 text-center">
                <p>Loading trading pairs...</p>
            </div>
        );
    }

    // Error message if pools failed to load
    if (poolsError) {
        return (
            <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg p-8 text-center">
                <p className="text-red-500">Error loading trading pairs. Please refresh the page.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center justify-between mb-[0.9px] bg-gray-100 dark:bg-[#151924] rounded-t-lg px-3 py-[17px]">
                <h2 className="text-md font-semibold bg-clip-text text-gray-800 dark:text-gray-300 uppercase">
                    Place Order
                </h2>
                <div className="relative">
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 text-sm font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                        {selectedPool ? `${selectedPool.baseCurrency}/${selectedPool.quoteCurrency}` : 'Select Pair'}
                        <ChevronDown size={16} />
                    </button>
                    
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <ul className="py-1 max-h-60 overflow-auto">
                                {poolsData.poolss.items.map((pool: any) => (
                                    <li key={pool.id}>
                                        <button
                                            onClick={() => {
                                                setSelectedPool(pool);
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {pool.baseCurrency}/{pool.quoteCurrency}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className='p-3'>
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700/50 p-0.5 bg-gray-100 dark:bg-gray-800/30 backdrop-blur-sm">
                        <button
                            onClick={() => setOrderType('limit')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${orderType === 'limit'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            LIMIT
                        </button>
                        <button
                            onClick={() => setOrderType('market')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${orderType === 'market'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            MARKET
                        </button>
                    </div>

                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700/50 p-0.5 bg-gray-100 dark:bg-gray-800/30 backdrop-blur-sm">
                        <button
                            onClick={() => setSide('buy')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${side === 'buy'
                                ? 'bg-[#0064A7] text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            BUY
                        </button>
                        <button
                            onClick={() => setSide('sell')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${side === 'sell'
                                ? 'bg-red-600/60 hover:bg-red-600/40 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30'
                                }`}
                        >
                            SELL
                        </button>
                    </div>
                </div>

                <div className="mb-5 mt-6 transition-opacity duration-200">
                    {orderType === 'limit' ? (
                        <>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                                LIMIT PRICE
                            </label>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-300 dark:border-gray-700/50 backdrop-blur-sm focus-within:border-blue-500/50 transition-colors">
                                <CurrencyIcon type={getPriceCurrency()} />
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-2 bg-transparent outline-none text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                                MARKET PRICE {isLoadingPrice && "(Loading...)"}
                            </label>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-300 dark:border-gray-700/50">
                                <CurrencyIcon type={getPriceCurrency()} />
                                <div className="w-full pl-2 text-base truncate">
                                    {price ? `${price} ${getPriceCurrency()}` : "Fetching best price..."}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mb-8">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                        SIZE
                    </label>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-300 dark:border-gray-700/50 backdrop-blur-sm focus-within:border-blue-500/50 transition-colors">
                        <CurrencyIcon type={getSizeCurrency()} />
                        <input
                            type="number"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-2 bg-transparent outline-none text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{getSizeCurrency()}</span>
                    </div>
                </div>

                {address ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isPlacing}
                        className={`w-full py-2 rounded-lg font-medium text-base transition-all duration-200
                        ${side === 'buy'
                                ? 'bg-[#0064A7] hover:bg-[#0064A7]/80 text-white'
                                : 'bg-red-600/60 hover:bg-red-600/40 text-white'
                            } ${isPlacing ? 'opacity-50 cursor-not-allowed' : ''} shadow-md`}
                    >
                        {isPlacing ? 'Placing Order...' : `${side === 'buy' ? 'BUY' : 'SELL'} ${getSizeCurrency()} ${orderType.toUpperCase()}`}
                    </button>
                ) : (
                    <div className="flex items-center justify-center">
                        <ButtonConnectWallet />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyAndSellComponent;