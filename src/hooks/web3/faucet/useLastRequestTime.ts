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
        if (!enabled) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsStale(false);

        try {
            const result = await readContract(wagmiConfig, {
                address: getContractAddress(chainId, ContractName.faucet) as `0x${string}`,
                abi: FaucetABI,
                functionName: 'getLastRequestTime',
                args: [],
            });

            setLastRequestTime(result as bigint);
        } catch (err: unknown) {
            const error = err instanceof Error
                ? err
                : new Error('Failed to fetch lastRequestTime');

            setError(error);
            console.error('Error fetching M0 lastRequestTime:', error);
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    const refreshLastRequestTime = useCallback(async () => {
        await fetchLastRequestTime();
    }, [fetchLastRequestTime]);

    useEffect(() => {
        setIsStale(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (enabled) {
            fetchLastRequestTime();
            intervalId = setInterval(() => {
                refreshLastRequestTime();
            }, 5000);
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
