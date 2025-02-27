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