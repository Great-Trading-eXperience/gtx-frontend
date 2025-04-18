import { readContract} from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';
import { HexAddress } from '@/types/general/address';

// Balance checking hook
interface BalanceParams {
    user: HexAddress;
    currency: HexAddress;
}

interface UseBalanceReturn {
    getBalance: (params: BalanceParams) => Promise<bigint>;
    isLoading: boolean;
    error: Error | null;
    refetch: (params: BalanceParams) => Promise<bigint>;
}

export const useBalance = (): UseBalanceReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getBalance = useCallback(
        async ({ user, currency }: BalanceParams): Promise<bigint> => {
            setIsLoading(true);
            setError(null);

            try {
                const balance = await readContract(wagmiConfig, {
                    address: BALANCE_MANAGER_ADDRESS,
                    abi: BalanceManagerABI,
                    functionName: 'getBalance',
                    args: [user, currency] as const,
                });

                return balance;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to get balance');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        getBalance,
        isLoading,
        error,
        refetch: getBalance,
    };
};