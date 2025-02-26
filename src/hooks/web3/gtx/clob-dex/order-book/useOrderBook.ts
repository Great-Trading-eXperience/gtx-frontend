import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { ORDERBOOK_ADDRESS } from '@/constants/contract-address';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Side enum (buy = 0, sell = 1)
enum Side {
    Buy = 0,
    Sell = 1,
}

// Order status enum
enum Status {
    Active = 0,
    PartiallyFilled = 1,
    Filled = 2,
    Cancelled = 3,
    Expired = 4,
}

// PriceVolume type
interface PriceVolume {
    price: bigint; // uint64
    volume: bigint; // uint256
}

// Order type
interface Order {
    id: number; // uint48
    user: HexAddress;
    next: number; // uint48
    prev: number; // uint48
    timestamp: number; // uint48
    expiry: number; // uint48
    price: bigint; // uint64
    status: number; // uint8
    quantity: bigint; // uint128
    filled: bigint; // uint128
}

// Hook for retrieving contract owner
interface UseOrderBookOwnerReturn {
    getOwner: () => Promise<HexAddress>;
    isLoading: boolean;
    error: Error | null;
}

export const useOrderBookOwner = (): UseOrderBookOwnerReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getOwner = useCallback(async (): Promise<HexAddress> => {
        setIsLoading(true);
        setError(null);

        try {
            const owner = await readContract(wagmiConfig, {
                address: ORDERBOOK_ADDRESS,
                abi: OrderBookABI,
                functionName: 'owner',
            });

            return owner;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get order book owner');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getOwner,
        isLoading,
        error,
    };
};

// Hook for setting router address
interface SetRouterParams {
    router: HexAddress;
}

interface UseSetRouterReturn {
    setRouter: (params: SetRouterParams) => Promise<TransactionReceipt>;
    isSettingRouter: boolean;
    error: Error | null;
}

export const useSetRouter = (options: BaseOptions = {}): UseSetRouterReturn => {
    const { onSuccess, onError } = options;
    const [isSettingRouter, setIsSettingRouter] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const setRouter = useCallback(
        async ({ router }: SetRouterParams): Promise<TransactionReceipt> => {
            setIsSettingRouter(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'setRouter',
                    args: [router] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to set router');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsSettingRouter(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        setRouter,
        isSettingRouter,
        error,
    };
};

// Hook for transferring ownership
interface TransferOwnershipParams {
    newOwner: HexAddress;
}

interface UseTransferOwnershipReturn {
    transferOwnership: (params: TransferOwnershipParams) => Promise<TransactionReceipt>;
    isTransferring: boolean;
    error: Error | null;
}

export const useTransferOwnership = (options: BaseOptions = {}): UseTransferOwnershipReturn => {
    const { onSuccess, onError } = options;
    const [isTransferring, setIsTransferring] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const transferOwnership = useCallback(
        async ({ newOwner }: TransferOwnershipParams): Promise<TransactionReceipt> => {
            setIsTransferring(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'transferOwnership',
                    args: [newOwner] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to transfer ownership');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsTransferring(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        transferOwnership,
        isTransferring,
        error,
    };
};

// Hook for renouncing ownership
interface UseRenounceOwnershipReturn {
    renounceOwnership: () => Promise<TransactionReceipt>;
    isRenouncing: boolean;
    error: Error | null;
}

export const useRenounceOwnership = (options: BaseOptions = {}): UseRenounceOwnershipReturn => {
    const { onSuccess, onError } = options;
    const [isRenouncing, setIsRenouncing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const renounceOwnership = useCallback(async (): Promise<TransactionReceipt> => {
        setIsRenouncing(true);
        setError(null);

        try {
            const hash = await writeContract(wagmiConfig, {
                address: ORDERBOOK_ADDRESS,
                abi: OrderBookABI,
                functionName: 'renounceOwnership',
            });

            const receipt = await waitForTransaction(wagmiConfig, {
                hash,
            });

            onSuccess?.(receipt);
            return receipt;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to renounce ownership');
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setIsRenouncing(false);
        }
    }, [onSuccess, onError]);

    return {
        renounceOwnership,
        isRenouncing,
        error,
    };
};

// Hook for placing a limit order
interface PlaceOrderParams {
    price: bigint; // uint64
    quantity: bigint; // uint128
    side: Side;
    user: HexAddress;
}

interface UsePlaceOrderReturn {
    placeOrder: (params: PlaceOrderParams) => Promise<bigint>;
    isPlacingOrder: boolean;
    error: Error | null;
}

export const usePlaceOrder = (options: BaseOptions = {}): UsePlaceOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeOrder = useCallback(
        async ({ price, quantity, side, user }: PlaceOrderParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'placeOrder',
                    args: [price, quantity, side, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                const orderId = BigInt(0); // In a real implementation, extract from event logs
                onSuccess?.(receipt);
                return orderId;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsPlacingOrder(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        placeOrder,
        isPlacingOrder,
        error,
    };
};

// Hook for placing a market order
interface PlaceMarketOrderParams {
    quantity: bigint; // uint128
    side: Side;
    user: HexAddress;
}

interface UsePlaceMarketOrderReturn {
    placeMarketOrder: (params: PlaceMarketOrderParams) => Promise<bigint>;
    isPlacingOrder: boolean;
    error: Error | null;
}

export const usePlaceMarketOrder = (options: BaseOptions = {}): UsePlaceMarketOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeMarketOrder = useCallback(
        async ({ quantity, side, user }: PlaceMarketOrderParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'placeMarketOrder',
                    args: [quantity, side, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                const orderId = BigInt(0); // In a real implementation, extract from event logs
                onSuccess?.(receipt);
                return orderId;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place market order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsPlacingOrder(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        placeMarketOrder,
        isPlacingOrder,
        error,
    };
};

// Hook for cancelling an order
interface CancelOrderParams {
    side: Side;
    price: bigint; // uint64
    orderId: number; // uint48
    user: HexAddress;
}

interface UseCancelOrderReturn {
    cancelOrder: (params: CancelOrderParams) => Promise<TransactionReceipt>;
    isCancelling: boolean;
    error: Error | null;
}

export const useCancelOrder = (options: BaseOptions = {}): UseCancelOrderReturn => {
    const { onSuccess, onError } = options;
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const cancelOrder = useCallback(
        async ({ side, price, orderId, user }: CancelOrderParams): Promise<TransactionReceipt> => {
            setIsCancelling(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'cancelOrder',
                    args: [side, price, orderId, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to cancel order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsCancelling(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        cancelOrder,
        isCancelling,
        error,
    };
};

// Hook for getting the best price for a side
interface GetBestPriceParams {
    side: Side;
}

interface UseGetBestPriceReturn {
    getBestPrice: (params: GetBestPriceParams) => Promise<PriceVolume>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetBestPrice = (): UseGetBestPriceReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getBestPrice = useCallback(async ({ side }: GetBestPriceParams): Promise<PriceVolume> => {
        setIsLoading(true);
        setError(null);

        try {
            const priceVolume = await readContract(wagmiConfig, {
                address: ORDERBOOK_ADDRESS,
                abi: OrderBookABI,
                functionName: 'getBestPrice',
                args: [side] as const,
            });

            return priceVolume;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get best price');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getBestPrice,
        isLoading,
        error,
    };
};

// Hook for getting the next best prices
interface GetNextBestPricesParams {
    side: Side;
    price: bigint; // uint64
    count: number; // uint8
}

interface UseGetNextBestPricesReturn {
    getNextBestPrices: (params: GetNextBestPricesParams) => Promise<PriceVolume[]>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetNextBestPrices = (): UseGetNextBestPricesReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getNextBestPrices = useCallback(
        async ({ side, price, count }: GetNextBestPricesParams): Promise<PriceVolume[]> => {
            setIsLoading(true);
            setError(null);

            try {
                const prices = await readContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'getNextBestPrices',
                    args: [side, price, count] as const,
                });

                return [...prices] as PriceVolume[];
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to get next best prices');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        getNextBestPrices,
        isLoading,
        error,
    };
};

// Hook for getting order queue details
interface GetOrderQueueParams {
    side: Side;
    price: bigint; // uint64
}

interface OrderQueueDetails {
    orderCount: number; // uint48
    totalVolume: bigint; // uint256
}

interface UseGetOrderQueueReturn {
    getOrderQueue: (params: GetOrderQueueParams) => Promise<OrderQueueDetails>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetOrderQueue = (): UseGetOrderQueueReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getOrderQueue = useCallback(
        async ({ side, price }: GetOrderQueueParams): Promise<OrderQueueDetails> => {
            setIsLoading(true);
            setError(null);

            try {
                const [orderCount, totalVolume] = await readContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'getOrderQueue',
                    args: [side, price] as const,
                });

                return { orderCount, totalVolume };
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to get order queue details');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        getOrderQueue,
        isLoading,
        error,
    };
};

// Hook for getting user's active orders
interface GetUserActiveOrdersParams {
    user: HexAddress;
}

interface UseGetUserActiveOrdersReturn {
    getUserActiveOrders: (params: GetUserActiveOrdersParams) => Promise<Order[]>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetUserActiveOrders = (): UseGetUserActiveOrdersReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getUserActiveOrders = useCallback(
        async ({ user }: GetUserActiveOrdersParams): Promise<Order[]> => {
            setIsLoading(true);
            setError(null);

            try {
                const orders = await readContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'getUserActiveOrders',
                    args: [user] as const,
                });

                return [...orders] as Order[];
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to get user active orders');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        getUserActiveOrders,
        isLoading,
        error,
    };
};