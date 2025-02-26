import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { HexAddress } from '@/types/web3/general/address';
import { Order, PoolKey, PriceVolume, Side } from './useGTXRouter';

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