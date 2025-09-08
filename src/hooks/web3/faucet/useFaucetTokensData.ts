import { getIndexerUrl } from "@/constants/urls/urls-config";
import { queryFaucetTokenss } from "@/graphql/faucet/faucet.query";
import { FaucetTokensData } from "@/types/faucet/add-token";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request"

interface UseFaucetTokensDataResult {
    faucetTokensData: FaucetTokensData;
    loading: boolean;
    error: boolean;
    hasErrors: boolean;
    refetchAll: () => Promise<void>;
}

export const useFaucetTokensData = (
    actualChainId: number,
) : UseFaucetTokensDataResult => {
    const {
        data,
        isLoading,
        isError,
        error: queryError,
        refetch,
    } = useQuery<FaucetTokensData>({
        queryKey: ["faucetTokensData", actualChainId],
        queryFn: async () => {
          const url = getIndexerUrl(actualChainId);
          if (!url) throw new Error('Indexer URL not found');
          return await request(url, queryFaucetTokenss, { chainId: Number(actualChainId) })
        },
        staleTime: Number.POSITIVE_INFINITY,
        retry: false,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    const refetchAll = async (): Promise<void> => {
        await refetch();
    };


    return {
        faucetTokensData: data || { faucetTokenss: {items : []} },
        loading: isLoading,
        error: isError,
        hasErrors: isError,
        refetchAll, 
    }
}