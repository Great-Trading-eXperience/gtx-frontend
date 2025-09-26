import { useQuery } from "@tanstack/react-query";
import { getIndexerUrl } from "@/constants/urls/urls-config";
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address";

interface UseMarketDataResult {
    marketData: any, // will be check first
    marketDataLoading: boolean,
    marketDataHasError: boolean,
    marketDataError: Error | null,
}

export function useMarkets(chainId?: number): UseMarketDataResult {
    const currentChainId = chainId ?? Number(DEFAULT_CHAIN);
    
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['markets', String(currentChainId)],
        queryFn: async () => {
            const url = getIndexerUrl(currentChainId);
            if (!url) throw new Error('Indexer URL not found');
            
            const response = await fetch(`${url}/api/markets`);
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