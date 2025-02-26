import { writeContract, readContract, waitForTransaction } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { HexAddress } from '@/types/web3/general/address';
import { PoolKey, PriceVolume, Side } from './useGTXRouter';

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