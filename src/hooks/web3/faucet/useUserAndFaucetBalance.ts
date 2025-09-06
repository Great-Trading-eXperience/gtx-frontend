import TokenABI from "@/abis/tokens/TokenABI";
import { wagmiConfig } from "@/configs/wagmi";
import { HexAddress } from "@/types/general/address";
import { readContract } from "@wagmi/core";
import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChainId } from "wagmi";

interface UseUserAndFaucetBalancesOptions {
    enabled?: boolean;
    staleTime?: number;
    retry?: number;
    refetchInterval?: number;
}

interface UseUserAndFaucetBalancesResult {
    userBalance: bigint | undefined;
    faucetBalance: bigint | undefined;
    loading: boolean;
    error: boolean;
    hasErrors: boolean;
    refetchAll: () => Promise<void>;
}

const fetchTokenBalance = async (
    userAddress: HexAddress,
    tokenAddress: HexAddress,
    chainId: number
): Promise<bigint> => {
    const result = await readContract(wagmiConfig, {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'balanceOf',
        args: [userAddress],
        chainId,
    });

    return result as bigint;
};

export const useUserAndFaucetBalances = (
    userAddress: HexAddress | undefined,
    faucetAddress: HexAddress | undefined,
    tokenAddress: HexAddress | undefined,
    options: UseUserAndFaucetBalancesOptions = {}
): UseUserAndFaucetBalancesResult => {
    const {
        enabled = true,
        staleTime = 15 * 1000, // 15 seconds
        retry = 2,
        refetchInterval = 30 * 1000, // 30 seconds
    } = options;

    const chainId = useChainId();

    // Create addresses array for queries
    const addresses = useMemo(() => {
        const result: HexAddress[] = [];
        if (userAddress) result.push(userAddress);
        if (faucetAddress) result.push(faucetAddress);
        return result;
    }, [userAddress, faucetAddress]);

    // Create parallel queries for both balances
    const queries = useQueries({
        queries: addresses.map((address) => ({
            queryKey: ['tokenBalance', address, tokenAddress, chainId],
            queryFn: () => fetchTokenBalance(address, tokenAddress!, chainId),
            enabled: enabled && !!address && !!tokenAddress,
            staleTime,
            retry,
            refetchInterval,
            refetchOnWindowFocus: true,
        } as UseQueryOptions<bigint, Error>))
    });

    // Process results - simple destructuring based on address order
    const userQuery = userAddress ? queries[addresses.indexOf(userAddress)] : undefined;
    const faucetQuery = faucetAddress ? queries[addresses.indexOf(faucetAddress)] : undefined;

    // Calculate loading and error states
    const loading = queries.some(query => query.isLoading);
    const hasErrors = queries.some(query => query.isError);
    const error = hasErrors;

    // Refetch function
    const refetchAll = async (): Promise<void> => {
        await Promise.all(queries.map(query => query.refetch()));
    };

    return {
        userBalance: userQuery?.data,
        faucetBalance: faucetQuery?.data,
        loading,
        error,
        hasErrors,
        refetchAll,
    };
};