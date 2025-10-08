import FaucetABI from "@/abis/faucet/FaucetABI";
import { HexAddress } from "@/types/general/address";
import { useReadContract } from "wagmi";
import type { Address } from "viem";


interface UseFaucetCooldownResult {
    faucetCooldown: bigint | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
    isFetching: boolean;
    isStale: boolean;
    isSuccess: boolean;
    isError: boolean;
}

export const useFaucetCooldown = (
    faucetAddress: HexAddress | undefined
): UseFaucetCooldownResult => {
    const {
        data: faucetCooldown,
        isLoading,
        error,
        refetch,
        isFetching,
        isStale,
        isSuccess,
        isError,
    } = useReadContract({
        address: faucetAddress as Address,
        abi: FaucetABI,
        functionName: 'getCooldown',
        args: [],
        query: {
            staleTime: Number.POSITIVE_INFINITY,
            retry: false,
            refetchInterval: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    });

    return {
        faucetCooldown,
        loading: isLoading,
        error: error as Error | null,
        refetch,
        isFetching,
        isStale,
        isSuccess,
        isError,
    };
};