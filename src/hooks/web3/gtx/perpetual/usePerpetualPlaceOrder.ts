import PerpetualRouterABI from "@/abis/gtx/perpetual/PerpetualRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import {
    PERPETUAL_ORDER_VAULT_ADDRESS,
    PERPETUAL_ROUTER_ADDRESS,
} from "@/constants/contract-address";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { encodeFunctionData, parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";

// Define types
export type HexAddress = `0x${string}`;
export type OrderType = 0 | 1 | 2 | 3; // 0 = MarketIncrease, 1 = LimitIncrease, 2 = MarketDecrease, 3 = LimitDecrease
export type OrderParams = {
    market: HexAddress;
    collateralToken: HexAddress;
    isLong: boolean;
    sizeDeltaUsd: bigint;
    collateralAmount: bigint;
    leverage?: number;
    triggerPrice?: bigint;
    acceptablePriceImpact?: number; // percentage (1-100)
    autoCancel?: boolean;
};

export const usePerpetualPlaceOrder = () => {
    const { address } = useAccount();
    const [orderHash, setOrderHash] = useState<HexAddress | undefined>(undefined);

    const {
        mutateAsync: placeOrder,
        isPending: isOrderPending,
        isError: isOrderError,
        error: orderSimulateError,
    } = useMutation({
        mutationFn: async ({
            orderType,
            params
        }: {
            orderType: OrderType;
            params: OrderParams;
        }) => {
            if (!address) {
                throw new Error("Wallet not connected");
            }

            try {
                // Calculate executionFee (1 gwei as in the example or adjust as needed)
                const executionFee = parseUnits("1", 9); // 1 gwei

                // Calculate acceptable price based on trigger price and acceptable impact
                let acceptablePrice = params.triggerPrice || 0n;
                if (params.triggerPrice && params.acceptablePriceImpact) {
                    const impact = BigInt(params.acceptablePriceImpact);
                    
                    // For market orders, we adjust acceptablePrice based on order type and direction
                    if (orderType === 0) { // MarketIncrease
                        acceptablePrice = params.isLong
                            ? (params.triggerPrice * (100n + impact)) / 100n // Long: willing to pay more
                            : (params.triggerPrice * (100n - impact)) / 100n; // Short: willing to pay less
                    } else if (orderType === 2) { // MarketDecrease
                        acceptablePrice = params.isLong
                            ? (params.triggerPrice * (100n - impact)) / 100n // Long: willing to sell for less
                            : (params.triggerPrice * (100n + impact)) / 100n; // Short: willing to sell for more
                    } else if (orderType === 1) { // LimitIncrease
                        acceptablePrice = params.isLong
                            ? params.triggerPrice // Long: want to buy at this price or lower
                            : params.triggerPrice; // Short: want to sell at this price or higher
                    } else if (orderType === 3) { // LimitDecrease
                        acceptablePrice = params.isLong
                            ? params.triggerPrice // Long: want to sell at this price or higher
                            : params.triggerPrice; // Short: want to buy at this price or lower
                    }
                }

                // Create order parameters struct
                const createOrderParams = {
                    receiver: address as HexAddress,
                    cancellationReceiver: address as HexAddress,
                    callbackContract: "0x0000000000000000000000000000000000000000" as HexAddress,
                    uiFeeReceiver: "0x0000000000000000000000000000000000000000" as HexAddress,
                    market: params.market,
                    initialCollateralToken: params.collateralToken,
                    orderType: orderType,
                    sizeDeltaUsd: params.sizeDeltaUsd,
                    initialCollateralDeltaAmount: params.collateralAmount,
                    triggerPrice: params.triggerPrice || 0n,
                    acceptablePrice: acceptablePrice,
                    executionFee: executionFee,
                    validFromTime: 0n,
                    isLong: params.isLong,
                    autoCancel: params.autoCancel || false
                };

                // Add console log for order parameters
                console.log('Create Order Parameters:', {
                    ...createOrderParams,
                    // Convert BigInts to strings for better readability in console
                    sizeDeltaUsd: createOrderParams.sizeDeltaUsd.toString(),
                    initialCollateralDeltaAmount: createOrderParams.initialCollateralDeltaAmount.toString(),
                    triggerPrice: createOrderParams.triggerPrice.toString(),
                    acceptablePrice: createOrderParams.acceptablePrice.toString(),
                    executionFee: createOrderParams.executionFee.toString(),
                    validFromTime: createOrderParams.validFromTime.toString(),
                    orderType: createOrderParams.orderType.toString(),
                    // Include some additional context
                    orderTypeDescription: ['MarketIncrease', 'LimitIncrease', 'MarketDecrease', 'LimitDecrease'][orderType],
                    direction: params.isLong ? 'Long' : 'Short',
                });

                // Encode function calls for multicall
                const sendWntData = encodeFunctionData({
                    abi: PerpetualRouterABI,
                    functionName: 'sendWnt',
                    args: [PERPETUAL_ORDER_VAULT_ADDRESS, executionFee]
                });

                const sendTokensData = encodeFunctionData({
                    abi: PerpetualRouterABI,
                    functionName: 'sendTokens',
                    args: [params.collateralToken, PERPETUAL_ORDER_VAULT_ADDRESS, params.collateralAmount]
                });

                // For the Router's createOrder function (not the OrderHandler's)
                const createOrderData = encodeFunctionData({
                    abi: PerpetualRouterABI,
                    functionName: 'createOrder',
                    args: [createOrderParams]
                });

                // Prepare the multicall data
                const multicallData = [
                    sendWntData,
                    sendTokensData,
                    createOrderData
                ];

                // Execute multicall
                const hash = await writeContract(wagmiConfig, {
                    address: PERPETUAL_ROUTER_ADDRESS,
                    abi: PerpetualRouterABI,
                    functionName: 'multicall',
                    args: [multicallData]
                });

                setOrderHash(hash);
                toast.success('Perpetual order submitted. Waiting for confirmation...');

                const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

                if (receipt.status === 'success') {
                    toast.success('Perpetual order confirmed successfully!');
                } else {
                    toast.error('Transaction failed on-chain');
                    throw new Error('Transaction failed on-chain');
                }

                return receipt;
            } catch (error) {
                console.error('Perpetual order error:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to place perpetual order');
                throw error;
            }
        },
    });

    // Transaction confirmation state
    const {
        data: orderReceipt,
        isLoading: isOrderConfirming,
        isSuccess: isOrderConfirmed,
    } = useWaitForTransactionReceipt({
        hash: orderHash,
    });

    // Wrapper functions for different order types
    const placeMarketIncreaseOrder = async (params: OrderParams) => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        // Validation
        if (params.sizeDeltaUsd <= 0n || params.collateralAmount <= 0n) {
            toast.error('Size and collateral amount must be greater than zero');
            return;
        }

        return placeOrder({ orderType: 0, params });
    };

    const placeLimitIncreaseOrder = async (params: OrderParams) => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        // Validation for limit orders
        if (!params.triggerPrice || params.triggerPrice <= 0n) {
            toast.error('Trigger price must be provided for limit orders');
            return;
        }

        if (params.sizeDeltaUsd <= 0n || params.collateralAmount <= 0n) {
            toast.error('Size and collateral amount must be greater than zero');
            return;
        }

        return placeOrder({ orderType: 1, params });
    };

    const placeMarketDecreaseOrder = async (params: OrderParams) => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        // Validation
        if (params.sizeDeltaUsd <= 0n) {
            toast.error('Size must be greater than zero');
            return;
        }

        return placeOrder({ orderType: 2, params });
    };

    const placeLimitDecreaseOrder = async (params: OrderParams) => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        // Validation for limit orders
        if (!params.triggerPrice || params.triggerPrice <= 0n) {
            toast.error('Trigger price must be provided for limit orders');
            return;
        }

        if (params.sizeDeltaUsd <= 0n) {
            toast.error('Size must be greater than zero');
            return;
        }

        return placeOrder({ orderType: 3, params });
    };

    return {
        placeMarketIncreaseOrder,
        placeLimitIncreaseOrder,
        placeMarketDecreaseOrder,
        placeLimitDecreaseOrder,
        isOrderPending,
        isOrderConfirming,
        isOrderConfirmed,
        isOrderError,
        orderHash,
        orderSimulateError,
        orderReceipt
    };
};