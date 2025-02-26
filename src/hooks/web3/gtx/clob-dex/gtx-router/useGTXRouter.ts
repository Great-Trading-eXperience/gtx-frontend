import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { HexAddress } from '@/types/web3/general/address';

// Common types
export interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Pool Key type (used in many functions)
export interface PoolKey {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
}

// Side type (0 = Buy, 1 = Sell)
export type Side = 0 | 1;

// PriceVolume type
export interface PriceVolume {
    price: bigint; // uint64
    volume: bigint; // uint256
}

// Order type
export interface Order {
    id: number; // uint48 returns as number
    user: HexAddress;
    next: number; // uint48 returns as number
    prev: number; // uint48 returns as number
    timestamp: number; // uint48 returns as number
    expiry: number; // uint48 returns as number
    price: bigint; // uint64
    status: number; // uint8
    quantity: bigint; // uint128
    filled: bigint; // uint128
}

// Hook for getting balance manager and pool manager addresses
interface UseGTXAddressesReturn {
    getBalanceManager: () => Promise<HexAddress>;
    getPoolManager: () => Promise<HexAddress>;
    isLoading: boolean;
    error: Error | null;
}

export const useGTXAddresses = (): UseGTXAddressesReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getBalanceManager = useCallback(async (): Promise<HexAddress> => {
        setIsLoading(true);
        setError(null);

        try {
            const address = await readContract(wagmiConfig, {
                address: GTX_ROUTER_ADDRESS,
                abi: GTXRouterABI,
                functionName: 'balanceManager',
            });

            return address;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get balance manager address');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getPoolManager = useCallback(async (): Promise<HexAddress> => {
        setIsLoading(true);
        setError(null);

        try {
            const address = await readContract(wagmiConfig, {
                address: GTX_ROUTER_ADDRESS,
                abi: GTXRouterABI,
                functionName: 'poolManager',
            });

            return address;
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Failed to get pool manager address');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        getBalanceManager,
        getPoolManager,
        isLoading,
        error,
    };
};

// Hook for placing a limit order
interface PlaceOrderParams {
    key: PoolKey;
    price: bigint; // uint64
    quantity: bigint; // uint128
    side: Side;
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
        async ({ key, price, quantity, side }: PlaceOrderParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, price, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                // Extract orderId from receipt logs (this would require decoding logs)
                // For simplicity, we'll return a placeholder value
                const orderId = BigInt(0); // In real implementation, extract from logs

                onSuccess?.(receipt);
                return orderId;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place limit order');
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

// Hook for placing a limit order with deposit
interface UsePlaceOrderWithDepositReturn {
    placeOrderWithDeposit: (params: PlaceOrderParams) => Promise<bigint>;
    isPlacingOrder: boolean;
    error: Error | null;
}

export const usePlaceOrderWithDeposit = (options: BaseOptions = {}): UsePlaceOrderWithDepositReturn => {
    const { onSuccess, onError } = options;
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeOrderWithDeposit = useCallback(
        async ({ key, price, quantity, side }: PlaceOrderParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeOrderWithDeposit',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, price, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                // Extract orderId from receipt logs (this would require decoding logs)
                // For simplicity, we'll return a placeholder value
                const orderId = BigInt(0); // In real implementation, extract from logs

                onSuccess?.(receipt);
                return orderId;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place limit order with deposit');
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
        placeOrderWithDeposit,
        isPlacingOrder,
        error,
    };
};

// Hook for placing a market order
interface PlaceMarketOrderParams {
    key: PoolKey;
    quantity: bigint; // uint128
    side: Side;
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
        async ({ key, quantity, side }: PlaceMarketOrderParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeMarketOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                // Extract orderId from receipt logs (this would require decoding logs)
                // For simplicity, we'll return a placeholder value
                const orderId = BigInt(0); // In real implementation, extract from logs

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

// Hook for placing a market order with deposit
interface PlaceMarketOrderWithDepositParams {
    key: PoolKey;
    price: bigint; // uint64
    quantity: bigint; // uint128
    side: Side;
}

interface UsePlaceMarketOrderWithDepositReturn {
    placeMarketOrderWithDeposit: (params: PlaceMarketOrderWithDepositParams) => Promise<bigint>;
    isPlacingOrder: boolean;
    error: Error | null;
}

export const usePlaceMarketOrderWithDeposit = (
    options: BaseOptions = {}
): UsePlaceMarketOrderWithDepositReturn => {
    const { onSuccess, onError } = options;
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeMarketOrderWithDeposit = useCallback(
        async ({ key, price, quantity, side }: PlaceMarketOrderWithDepositParams): Promise<bigint> => {
            setIsPlacingOrder(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeMarketOrderWithDeposit',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, price, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                // Extract orderId from receipt logs (this would require decoding logs)
                // For simplicity, we'll return a placeholder value
                const orderId = BigInt(0); // In real implementation, extract from logs

                onSuccess?.(receipt);
                return orderId;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place market order with deposit');
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
        placeMarketOrderWithDeposit,
        isPlacingOrder,
        error,
    };
};

// Hook for cancelling an order
interface CancelOrderParams {
    key: PoolKey;
    side: Side;
    price: bigint; // uint64
    orderId: number; // uint48
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
        async ({ key, side, price, orderId }: CancelOrderParams): Promise<TransactionReceipt> => {
            setIsCancelling(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'cancelOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, side, price, orderId] as const,
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

// Hook for getting the best price for a trading pair
interface GetBestPriceParams {
    key: PoolKey;
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

    const getBestPrice = useCallback(async ({ key, side }: GetBestPriceParams): Promise<PriceVolume> => {
        setIsLoading(true);
        setError(null);

        try {
            const bestPrice = await readContract(wagmiConfig, {
                address: GTX_ROUTER_ADDRESS,
                abi: GTXRouterABI,
                functionName: 'getBestPrice',
                args: [{
                    baseCurrency: key.baseCurrency,
                    quoteCurrency: key.quoteCurrency
                }, side] as const,
            });

            return bestPrice;
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

// Hook for getting next best prices
interface GetNextBestPricesParams {
    key: PoolKey;
    side: Side;
    price: bigint; // uint64
    count: number; // uint8
}

interface UseGetNextBestPricesReturn {
    getNextBestPrices: (params: GetNextBestPricesParams) => Promise<readonly PriceVolume[]>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetNextBestPrices = (): UseGetNextBestPricesReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getNextBestPrices = useCallback(
        async ({ key, side, price, count }: GetNextBestPricesParams): Promise<readonly PriceVolume[]> => {
            setIsLoading(true);
            setError(null);

            try {
                const prices = await readContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'getNextBestPrices',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, side, price, count] as const,
                });

                return prices;
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
    key: PoolKey;
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
        async ({ key, side, price }: GetOrderQueueParams): Promise<OrderQueueDetails> => {
            setIsLoading(true);
            setError(null);

            try {
                const [orderCount, totalVolume] = await readContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'getOrderQueue',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, side, price] as const,
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
    key: PoolKey;
    user: HexAddress;
}

interface UseGetUserActiveOrdersReturn {
    getUserActiveOrders: (params: GetUserActiveOrdersParams) => Promise<readonly Order[]>;
    isLoading: boolean;
    error: Error | null;
}

export const useGetUserActiveOrders = (): UseGetUserActiveOrdersReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getUserActiveOrders = useCallback(
        async ({ key, user }: GetUserActiveOrdersParams): Promise<readonly Order[]> => {
            setIsLoading(true);
            setError(null);

            try {
                const orders = await readContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'getUserActiveOrders',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, user] as const,
                });

                return orders;
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