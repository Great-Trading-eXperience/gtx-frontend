import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { ORDERBOOK_ADDRESS } from '@/constants/contract-address';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

// Types for Order-related operations
type Side = 0 | 1; // Assuming 0 = Buy, 1 = Sell

// useCancelOrder hook
interface CancelOrderParams {
    side: Side;
    price: bigint;    // uint64
    orderId: number;  // uint48
    user: HexAddress;
}

interface UseCancelOrderReturn {
    cancelOrder: (params: CancelOrderParams) => Promise<TransactionReceipt>;
    isCancelling: boolean;
    error: Error | null;
}

export const useCancelOrder = (options: BaseOptions = {}): UseCancelOrderReturn => {
    const { onSuccess, onError } = options;
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const cancelOrder = useCallback(
        async ({ side, price, orderId, user }: CancelOrderParams): Promise<TransactionReceipt> => {
            setIsCancelling(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: ORDERBOOK_ADDRESS,
                    abi: OrderBookABI,
                    functionName: 'cancelOrder',
                    args: [side, price, orderId, user] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to cancel order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsCancelling(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        cancelOrder,
        isCancelling,
        error,
    };
};