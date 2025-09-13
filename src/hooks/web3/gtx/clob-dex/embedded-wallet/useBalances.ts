import { getIndexerUrl } from "@/constants/urls/urls-config"
import { BalancessResponse, useBalancesQuery } from "@/graphql/gtx/clob"
import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"

export const useBalances = (
    userAddress: string,
    actualChainId: number
) => {
    const { data, isLoading, error, refetch } = useQuery<BalancessResponse>({
        queryKey: ['balancess', userAddress],
        queryFn: async () => {
            const url = getIndexerUrl(actualChainId);
            if (!url) throw new Error('Indexer URL not found');
            return await request(url, useBalancesQuery, { userAddress: userAddress });
        },
        staleTime: Number.POSITIVE_INFINITY,
        retry: false,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const refetchAll = async (): Promise<void> => {
        await refetch();
    };

    return {
        balances: data?.balancess?.items || [],
        loading: isLoading,
        error: !!error,
        hasErrors: !!error,
        refetchAll,
    }
}