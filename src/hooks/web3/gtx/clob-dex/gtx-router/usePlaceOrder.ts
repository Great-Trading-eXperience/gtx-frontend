import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Pool Key type (used in many functions)
interface PoolKey {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
}

// Side type (0 = Buy, 1 = Sell)
type Side = 0 | 1;

// PriceVolume type
interface PriceVolume {
    price: bigint; // uint64
    volume: bigint; // uint256
}

// Order type
interface Order {
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