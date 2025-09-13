import FaucetABI from "@/abis/faucet/FaucetABI";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useReadContract } from "wagmi";
import { useChainId } from "wagmi";
import type { Address } from "viem";


interface UseLastRequestTimeResult {
    lastRequestTime: bigint | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
    isFetching: boolean;
    isStale: boolean;
    isSuccess: boolean;
    isError: boolean;
}

export const useLastRequestTime = (
    userAddress?: HexAddress,
    faucetAddress?: HexAddress
): UseLastRequestTimeResult => {
    const {
        data: lastRequestTime,
        isLoading,
        error,
        refetch,
        isFetching,
        isStale,
        isSuccess,
        isError,
    } = useReadContract({
        address: faucetAddress,
        abi: FaucetABI,
        functionName: 'getLastRequestTime',
        args: [],
        account: userAddress as Address,
        query: {
            staleTime: Number.POSITIVE_INFINITY,
            retry: false,
            refetchInterval: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    });

    return {
        lastRequestTime,
        loading: isLoading,
        error: error as Error | null,
        refetch,
        isFetching,
        isStale,
        isSuccess,
        isError,
    };
};