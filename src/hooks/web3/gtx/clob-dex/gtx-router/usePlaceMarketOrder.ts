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

// usePlaceMarketOrder hook
interface PlaceMarketOrderParams {
    key: PoolKey;
    quantity: bigint; // uint128
    side: Side;
}

interface UsePlaceMarketOrderReturn {
    placeMarketOrder: (params: PlaceMarketOrderParams) => Promise<TransactionReceipt>;
    isPlacing: boolean;
    error: Error | null;
}

export const usePlaceMarketOrder = (options: BaseOptions = {}): UsePlaceMarketOrderReturn => {
    const { onSuccess, onError } = options;
    const [isPlacing, setIsPlacing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const placeMarketOrder = useCallback(
        async ({ key, quantity, side }: PlaceMarketOrderParams): Promise<TransactionReceipt> => {
            setIsPlacing(true);
            setError(null);

            try {
                const hash = await writeContract(wagmiConfig, {
                    address: GTX_ROUTER_ADDRESS,
                    abi: GTXRouterABI,
                    functionName: 'placeMarketOrder',
                    args: [{
                        baseCurrency: key.baseCurrency,
                        quoteCurrency: key.quoteCurrency
                    }, quantity, side] as const,
                });

                const receipt = await waitForTransaction(wagmiConfig, {
                    hash,
                });

                onSuccess?.(receipt);
                return receipt;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error('Failed to place market order');
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
        placeMarketOrder,
        isPlacing,
        error,
    };
};
