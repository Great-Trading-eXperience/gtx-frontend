import TokenABI from "@/abis/tokens/TokenABI";
import { wagmiConfig } from "@/configs/wagmi";
import { HexAddress } from "@/types/general/address";
import { readContract } from "@wagmi/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChainId } from "wagmi";

interface UseBalanceOptions {
    debounceTime?: number;
    enabled?: boolean;
}

interface UseBalanceResult {
    balance: bigint | undefined;
    loading: boolean;
    error: Error | null;
    refreshBalance: () => Promise<void>;
    isStale: boolean;
}

export const useBalance = (
    userAddress: HexAddress,
    tokenAddress: HexAddress,
    options: UseBalanceOptions = {}
): UseBalanceResult => {
    const { debounceTime = 1000, enabled = true } = options;
    const chainId = useChainId();

    const [balance, setBalance] = useState<bigint | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);

    const debounceTimeRef = useRef(debounceTime);

    useEffect(() => {
        debounceTimeRef.current = debounceTime;
    }, [debounceTime]);

    const fetchBalance = useCallback(async () => {
        const logPrefix = '[ERC20_BALANCE]';
        
        console.log(`${logPrefix} Starting balance fetch:`, {
            userAddress,
            tokenAddress,
            chainId,
            enabled
        });

        if (!userAddress || !tokenAddress || !enabled) {
            console.log(`${logPrefix} Skipping balance fetch - missing required params:`, {
                hasUserAddress: !!userAddress,
                hasTokenAddress: !!tokenAddress,
                enabled
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsStale(false);

        console.log(`${logPrefix} Calling readContract with:`, {
            tokenAddress,
            userAddress,
            chainId,
            functionName: 'balanceOf'
        });

        try {
            const result = await readContract(wagmiConfig, {
                address: tokenAddress,
                abi: TokenABI,
                functionName: 'balanceOf',
                args: [userAddress],
            });

            console.log(`${logPrefix} Successfully fetched balance:`, {
                tokenAddress,
                userAddress,
                chainId,
                balance: result?.toString(),
                rawResult: result
            });

            setBalance(result as bigint);
        } catch (err: unknown) {
            const error = err instanceof Error
                ? err
                : new Error('Failed to fetch balance');

            console.error(`${logPrefix} Error fetching balance:`, {
                tokenAddress,
                userAddress,
                chainId,
                errorName: error.name,
                errorMessage: error.message,
                fullError: error
            });

            setError(error);
        } finally {
            setLoading(false);
        }
    }, [userAddress, tokenAddress, enabled, chainId]);

    const refreshBalance = useCallback(async () => {
        await fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        setIsStale(true);
    }, [userAddress, tokenAddress]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (enabled) {
            fetchBalance();
            intervalId = setInterval(() => {
                refreshBalance();
            }, 30000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchBalance, refreshBalance, enabled]);

    return {
        balance,
        loading,
        error,
        refreshBalance,
        isStale,
    };
};
