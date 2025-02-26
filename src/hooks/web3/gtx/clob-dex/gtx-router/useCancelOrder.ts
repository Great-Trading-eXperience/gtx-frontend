import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';
import { BaseOptions, PoolKey, Side } from './useGTXRouter';

// Hook for cancelling an order
interface CancelOrderParams {
    key: PoolKey;
    side: Side;
    price: bigint; // uint64
    orderId: number; // uint48
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
        async ({ key, side, price, orderId }: CancelOrderParams): Promise<TransactionReceipt> => {
            setIsCancelling(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'cancelOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, side, price, orderId] as const,
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