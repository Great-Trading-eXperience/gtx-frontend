import { writeContract, readContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { BALANCE_MANAGER_ADDRESS } from '@/constants/contract-address';
import BalanceManagerABI from '@/abis/gtx/clob-dex/BalanceManagerABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

interface BalanceOperationParams {
    currency: HexAddress;
    amount: bigint;
}

interface DepositParams extends BalanceOperationParams {
    user?: HexAddress;
}

// useDeposit hook
interface UseDepositReturn {
    deposit: (params: DepositParams) => Promise<TransactionReceipt>;
    isDepositing: boolean;
    error: Error | null;
}

export const useDeposit = (options: BaseOptions = {}): UseDepositReturn => {
    const { onSuccess, onError } = options;
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deposit = useCallback(
        async ({ currency, amount, user }: DepositParams): Promise<TransactionReceipt> => {
            setIsDepositing(true);
            setError(null);

            try {
                if (user) {
                    const hash = await writeContract(wagmiConfig, {
                        address: BALANCE_MANAGER_ADDRESS,
                        abi: BalanceManagerABI,
                        functionName: 'deposit',
                        args: [currency, amount, user] as const,
                    });

                    const receipt = await waitForTransaction(wagmiConfig, {
                        hash,
                    });

                    onSuccess?.(receipt);
                    return receipt;
                } else {
                    const hash = await writeContract(wagmiConfig, {
                        address: BALANCE_MANAGER_ADDRESS,
                        abi: BalanceManagerABI,
                        functionName: 'deposit',
                        args: [currency, amount] as const,
                    });

                    const receipt = await waitForTransaction(wagmiConfig, {
                        hash,
                    });

                    onSuccess?.(receipt);
                    return receipt;
                }
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to deposit');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsDepositing(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        deposit,
        isDepositing,
        error,
    };
};

