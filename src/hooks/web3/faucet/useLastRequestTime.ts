import FaucetABI from "@/abis/faucet/FaucetABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { readContract } from "@wagmi/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChainId } from "wagmi";

interface UseLastRequestTimeOptions {
    debounceTime?: number;
    enabled?: boolean;
}

interface UseLastRequestTimeResult {
    lastRequestTime: bigint | undefined;
    loading: boolean;
    error: Error | null;
    refreshLastRequestTime: () => Promise<void>;
    isStale: boolean;
}

export const useLastRequestTime = (
    userAddress?: HexAddress,
    options: UseLastRequestTimeOptions = {}
): UseLastRequestTimeResult => {
    const { debounceTime = 1000, enabled = true } = options;

    const chainId = useChainId();

    const [lastRequestTime, setLastRequestTime] = useState<bigint | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);

    const debounceTimeRef = useRef(debounceTime);

    useEffect(() => {
        debounceTimeRef.current = debounceTime;
    }, [debounceTime]);

    const fetchLastRequestTime = useCallback(async () => {
        if (!enabled || !userAddress) {
            setLoading(false);
            return;
        }

        console.log('[useLastRequestTime] Fetching last request time for address:', userAddress);

        setLoading(true);
        setError(null);
        setIsStale(false);

        try {
            const result = await readContract(wagmiConfig, {
                address: getContractAddress(chainId, ContractName.faucet) as `0x${string}`,
                abi: FaucetABI,
                functionName: 'getLastRequestTime',
                args: [],
                account: userAddress,
            });

            console.log('[useLastRequestTime] Result for address', userAddress, ':', result);
            setLastRequestTime(result as bigint);
        } catch (err: unknown) {
            const error = err instanceof Error
                ? err
                : new Error('Failed to fetch lastRequestTime');

            setError(error);
            console.error('[useLastRequestTime] Error fetching lastRequestTime for address', userAddress, ':', error);
        } finally {
            setLoading(false);
        }
    }, [enabled, userAddress, chainId]);

    const refreshLastRequestTime = useCallback(async () => {
        await fetchLastRequestTime();
    }, [fetchLastRequestTime]);

    useEffect(() => {
        setIsStale(true);
    }, [userAddress]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (enabled) {
            fetchLastRequestTime();
            intervalId = setInterval(() => {
                refreshLastRequestTime();
            }, 30000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchLastRequestTime, refreshLastRequestTime, enabled]);

    return {
        lastRequestTime,
        loading,
        error,
        refreshLastRequestTime,
        isStale,
    };
};
