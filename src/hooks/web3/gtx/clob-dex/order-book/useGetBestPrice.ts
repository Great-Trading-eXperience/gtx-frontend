import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { ORDERBOOK_ADDRESS } from '@/constants/contract-address';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Types for Order-related operations
type Side = 0 | 1; // Assuming 0 = Buy, 1 = Sell

interface PriceVolume {
    price: bigint;
    volume: bigint;
}

// useGetBestPrice hook
interface UseGetBestPriceReturn {
    getBestPrice: (side: Side) => Promise<PriceVolume>;
    isLoading: boolean;
    error: Error | null;
    refetch: (side: Side) => Promise<PriceVolume>;
}

export const useGetBestPrice = (): UseGetBestPriceReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getBestPrice = useCallback(async (side: Side): Promise<PriceVolume> => {
        setIsLoading(true);
        setError(null);

        try {
            const bestPrice = await readContract(wagmiConfig, {
                address: ORDERBOOK_ADDRESS,
                abi: OrderBookABI,
                functionName: 'getBestPrice',
                args: [side] as const,
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
        refetch: getBestPrice,
    };
};