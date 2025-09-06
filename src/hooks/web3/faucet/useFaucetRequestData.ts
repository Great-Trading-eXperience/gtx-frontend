import { getIndexerUrl } from "@/constants/urls/urls-config";
import { queryRequestTokenss } from "@/graphql/faucet/faucet.query";
import { FaucetRequestsData } from "@/types/faucet/request-token";
import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";

interface UseFaucetRequestDataResult {
    faucetRequestsData: FaucetRequestsData | null | undefined;
    loading: boolean;
    error: boolean;
    hasErrors: boolean;
    refetchAll: () => Promise<void>;
}

export const useFaucetRequestData = (
    actualChainId: number,
    mounted: boolean,
): UseFaucetRequestDataResult => {
    const {
        data,
        isLoading,
        isError,
        error: queryError,
        refetch,
    } = useQuery<FaucetRequestsData>({
        queryKey: ['faucetRequestsData', actualChainId],
        queryFn: async () => {
            const url = getIndexerUrl(actualChainId);
            if (!url) throw new Error('Indexer URL not found');
            return await request(url, queryRequestTokenss, { chainId: Number(actualChainId) });
        },
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: false,
        enabled: mounted,
    });

    const refetchAll = async (): Promise<void> => {
        await refetch();
    };


    return {
        faucetRequestsData: data || null,
        loading: isLoading,
        error: isError,
        hasErrors: isError,
        refetchAll, 
    }
}