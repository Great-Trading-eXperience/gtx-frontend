import { readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { PoolKey, Side } from '../useGTXRouter';

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