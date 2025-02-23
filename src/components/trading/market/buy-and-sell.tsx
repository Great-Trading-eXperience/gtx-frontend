import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { usePlaceOrder } from '@/hooks/web3/liquidbook/usePlaceOrderbook';
import Image from 'next/image';
import { ButtonConnectWallet } from '@/components/button-connect-wallet.tsx/button-connect-wallet';

const TICK_SPACING = 1.0001;

const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    return isClient;
};

const CurrencyIcon = ({ type }: { type: 'eth' | 'usdc' }) => (
    <div className="relative">
        <Image
            src={`/${type}.png`}
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
    const { address } = useAccount();
    const isClient = useIsClient();

    const { placeOrder, isPlacing } = usePlaceOrder({
        onSuccess: (result) => {
            if (!result) {
                toast.success('Order submitted successfully');
                return;
            }

            let description = 'Order submitted';
            if (result.orderIndex !== undefined) {
                description += ` - Index: ${result.orderIndex.toString()}`;
            }

            toast.success('Order placed successfully', {
                description
            });

            setPrice('');
            setSize('');
        },
        onError: (error) => {
            toast.error('Failed to place order', {
                description: error.message
            });
        }
    });

    if (!isClient) return null;

    const handleSubmit = async () => {
        if (!address) {
            toast.error('Please connect your wallet');
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

        try {
            const orderTick = orderType === 'limit'
                ? BigInt(Math.floor(Math.log(parseFloat(price)) / Math.log(TICK_SPACING)))
                : BigInt(0);

            const sizeValue = parseFloat(size);
            const orderVolume = BigInt(Math.floor(sizeValue * 1e6));
            const formattedAddress = address as `0x${string}`;

            await placeOrder({
                tick: orderTick,
                volume: orderVolume,
                user: formattedAddress,
                isBuy: side === 'buy',
                isMarket: orderType === 'market'
            });

        } catch (error) {
            console.error('Order placement error:', error);
            toast.error('Failed to place order', {
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    };

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white shadow-lg">
            <div className="flex items-center mb-[0.9px] bg-gray-100 dark:bg-[#151924] rounded-t-lg">
                <h2 className="text-md font-semibold px-3 py-[17px] bg-clip-text text-gray-800 dark:text-gray-300 uppercase">
                    Place Order
                </h2>
            </div>
            <div className=' p-3'>
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
                                <CurrencyIcon type={side === 'buy' ? 'usdc' : 'eth'} />
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
                        // Invisible placeholder to maintain consistent height
                        <div className="opacity-0 pointer-events-none">
                            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                                LIMIT PRICE
                                <Info className="w-3 h-3 text-gray-500 cursor-help" />
                            </label>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-300 dark:border-gray-700/50">
                                <CurrencyIcon type={side === 'buy' ? 'usdc' : 'eth'} />
                                <div className="w-full pl-2 text-base h-[24px]"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                        SIZE
                    </label>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-300 dark:border-gray-700/50 backdrop-blur-sm focus-within:border-blue-500/50 transition-colors">
                        <CurrencyIcon type={side === 'buy' ? 'usdc' : 'eth'} />
                        <input
                            type="number"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-2 bg-transparent outline-none text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        />
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
                        {isPlacing ? 'Placing Order...' : `${side === 'buy' ? 'BUY' : 'SELL'}`}
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

