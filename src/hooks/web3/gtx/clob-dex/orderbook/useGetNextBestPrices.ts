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
