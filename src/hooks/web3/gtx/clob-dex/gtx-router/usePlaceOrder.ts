import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt } from 'viem';
import { GTX_ROUTER_ADDRESS } from '@/constants/contract-address';
import GTXRouterABI from '@/abis/gtx/clob-dex/GTXRouterABI';
import { waitForTransaction } from '@wagmi/core';
import { HexAddress } from '@/types/web3/general/address';

// Common types
interface BaseOptions {
    onSuccess?: (receipt: TransactionReceipt) => void;
    onError?: (error: Error) => void;
}

type Side = 0 | 1; // Assuming 0 = Buy, 1 = Sell

// Match the ABI struct type exactly
interface PoolKey {
    baseCurrency: HexAddress;
    quoteCurrency: HexAddress;
}

// usePlaceOrder hook
interface PlaceOrderParams {
    key: PoolKey;
    price: bigint;    // uint64
    quantity: bigint; // uint128
    side: Side;
}

interface UsePlaceOrderReturn {
    placeOrder: (params: PlaceOrderParams) => Promise<TransactionReceipt>;
    isPlacing: boolean;
    error: Error | null;
}

export const usePlaceOrder = (options: BaseOptions = {}): UsePlaceOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeOrder = useCallback(
        async ({ key, price, quantity, side }: PlaceOrderParams): Promise<TransactionReceipt> => {
            setIsPlacing(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, price, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place order');
                setError(error);
                onError?.(error);
                throw error;
            } finally {
                setIsPlacing(false);
            }
        },
        [onSuccess, onError]
    );

    return {
        placeOrder,
        isPlacing,
        error,
    };
};