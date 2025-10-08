import TokenABI from "@/abis/tokens/TokenABI";
import { HexAddress } from "@/types/general/address";
import { useReadContracts } from "wagmi";

interface UseUserAndFaucetBalancesResult {
    userBalance: bigint | undefined;
    faucetBalance: bigint | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export const useUserAndFaucetBalances = (
    userAddress: HexAddress | undefined,
    faucetAddress: HexAddress | undefined,
    tokenAddress: HexAddress | undefined
): UseUserAndFaucetBalancesResult => {
    const { data, isLoading, error, refetch } = useReadContracts({
        contracts: [
          {
            address: tokenAddress,
            abi: TokenABI,
            functionName: 'balanceOf',
            args: [userAddress],
          },
          {
            address: tokenAddress,
            abi: TokenABI,
            functionName: 'balanceOf',
            args: [faucetAddress],
          },
        ],
    });

    const isBigInt = (value: unknown): value is bigint => {
        return typeof value === 'bigint';
    };

    const userBalance = data?.[0]?.result && isBigInt(data[0].result) 
        ? data[0].result 
        : undefined;

    const faucetBalance = data?.[1]?.result && isBigInt(data[1].result) 
        ? data[1].result 
        : undefined;

    return {
        userBalance,
        faucetBalance,
        loading: isLoading,
        error: error as Error | null,
        refetch
    };
};