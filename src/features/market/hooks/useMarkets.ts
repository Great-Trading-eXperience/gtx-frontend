import { useQuery } from "@tanstack/react-query";

interface UseMarketDataResult {
    marketData: any, // will be check first
    marketDataLoading: boolean,
    marketDataHasError: boolean,
    marketDataError: Error | null,
}

export function useMarkets():UseMarketDataResult {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['markets'],
        queryFn: async () => {
            const response = await fetch('https://indexer-rise.gtxdex.xyz/api/markets');
            if (!response.ok) {
                throw new Error('Failed to fetch markets')
            }
            return response.json()
        },
        refetchInterval: 2000,
        staleTime: 0,
        gcTime: 60000,
    });

    return {
        marketData: data,
        marketDataLoading: isLoading,
        marketDataHasError: isError,
        marketDataError: error,
    }
}