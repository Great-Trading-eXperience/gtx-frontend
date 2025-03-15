import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount } from "wagmi";
import routerABI from "@/abis/gtx/perpetual/RouterABI"; 
import { wagmiConfig } from "@/configs/wagmi";
import { encodeFunctionData } from "viem";

// Type definitions for clarity
export type HexAddress = `0x${string}`;

// Order types matching the contract
export enum OrderType {
  MarketIncrease = 0,
  LimitIncrease = 1,
  MarketDecrease = 2,
  LimitDecrease = 3,
  StopLossDecrease = 4,
  Liquidation = 5,
  StopIncrease = 6
}

// Parameters for creating an order based on contract structure
export type CreateOrderParams = {
  receiver: HexAddress;
  cancellationReceiver: HexAddress;
  callbackContract: HexAddress;
  uiFeeReceiver: HexAddress;
  market: HexAddress;
  initialCollateralToken: HexAddress;
  orderType: OrderType;
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  validFromTime: bigint;
  isLong: boolean;
  autoCancel: boolean;
};

// Order structure matching the contract
export type Order = {
  account: HexAddress;
  receiver: HexAddress;
  cancellationReceiver: HexAddress;
  callbackContract: HexAddress;
  uiFeeReceiver: HexAddress;
  marketToken: HexAddress;
  initialCollateralToken: HexAddress;
  orderType: OrderType;
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  updatedAtTime: bigint;
  validFromTime: bigint;
  isLong: boolean;
  isFrozen: boolean;
};

export const usePerpetualOrder = (
  routerAddress: HexAddress,
  orderVaultAddress: HexAddress
) => {
  const { address } = useAccount();
  
  // Track transaction steps
  const [steps, setSteps] = useState<
    Array<{
      step: number;
      status: "idle" | "loading" | "success" | "error";
      error?: string;
    }>
  >([
    { step: 1, status: "idle" }, // Send execution fee
    { step: 2, status: "idle" }, // Send collateral
    { step: 3, status: "idle" }, // Create order
  ]);

  // Store the transaction hash for reference
  const [txHash, setTxHash] = useState<string | null>(null);

  // Mutation for creating a position
  const createOrderMutation = useMutation({
    mutationFn: async ({ 
      params,
      collateralAmount,
      executionFeeAmount
    }: { 
      params: CreateOrderParams;
      collateralAmount: bigint;
      executionFeeAmount: bigint;
    }) => {
      try {
        // Reset steps
        setSteps([
          { step: 1, status: "idle" },
          { step: 2, status: "idle" },
          { step: 3, status: "idle" }
        ]);

        // Set first step to loading
        setSteps((prev) => 
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        // Use type assertions to ensure TypeScript understands the correct types
        // Here we explicitly cast function names to match what's in your ABI
        const sendWntData = encodeFunctionData({
          abi: routerABI, 
          functionName: 'sendWnt' as any,
          args: [orderVaultAddress, executionFeeAmount]
        });
        
        const sendTokensData = encodeFunctionData({
          abi: routerABI,
          functionName: 'sendTokens' as any,
          args: [params.initialCollateralToken, orderVaultAddress, collateralAmount]
        });
        
        const createOrderData = encodeFunctionData({
          abi: routerABI,
          functionName: 'createOrder' as any,
          args: [params] as any
        });

        // Execute the transaction as a multicall with properly encoded data
        const hash = await writeContract(wagmiConfig, {
          abi: routerABI,
          address: routerAddress,
          functionName: 'multicall',
          args: [[sendWntData, sendTokensData, createOrderData]]
        });

        // Set the transaction hash
        setTxHash(hash);

        // Update steps as we go
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 1 ? { ...item, status: "success" } : 
            item.step === 2 ? { ...item, status: "loading" } : item
          )
        );
        
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 2 ? { ...item, status: "success" } : 
            item.step === 3 ? { ...item, status: "loading" } : item
          )
        );

        // Wait for receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 3 ? { ...item, status: "success" } : item
            )
          );
          
          // Determine message based on order type
          let successMessage = "Order created successfully!";
          switch (params.orderType) {
            case OrderType.MarketIncrease:
              successMessage = "Market long position opened!";
              break;
            case OrderType.LimitIncrease:
              successMessage = "Limit order placed successfully!";
              break;
            case OrderType.MarketDecrease:
              successMessage = "Market position closed!";
              break;
            case OrderType.LimitDecrease:
              successMessage = "Take profit order placed!";
              break;
            case OrderType.StopLossDecrease:
              successMessage = "Stop loss order placed!";
              break;
          }
          
          toast.success(successMessage);
        } else {
          throw new Error("Transaction failed");
        }

        return receipt;
      } catch (error) {
        console.error("Transaction error:", error);

        // Update steps with error
        setSteps((prev) =>
          prev.map((step) => {
            if (step.status === "loading") {
              return {
                ...step,
                status: "error",
                error: error instanceof Error ? error.message : "An error occurred",
              };
            }
            return step;
          })
        );

        toast.error(error instanceof Error ? error.message : "Failed to create order. Please try again.");
        throw error;
      }
    },
  });

  // Helper function to create market long position
  const createMarketLongPosition = async ({
    market,
    collateralToken,
    collateralAmount,
    sizeDeltaUsd,
    executionFee = BigInt(1e9),
    leverageMultiplier = 10n, // Default 10x leverage
    slippagePercentage = 5n,  // Default 5% slippage
    triggerPrice = 0n         // Use 0 for market orders or set for limit orders
  }: {
    market: HexAddress;
    collateralToken: HexAddress;
    collateralAmount: bigint;
    sizeDeltaUsd: bigint;
    executionFee?: bigint;
    leverageMultiplier?: bigint;
    slippagePercentage?: bigint;
    triggerPrice?: bigint;
  }) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    // Calculate acceptable price with slippage for a long position
    const acceptablePrice = triggerPrice > 0n
      ? (triggerPrice * (100n + slippagePercentage)) / 100n
      : (triggerPrice * (100n + slippagePercentage)) / 100n || 0n;

    // Create order parameters
    const params: CreateOrderParams = {
      receiver: address as HexAddress,
      cancellationReceiver: address as HexAddress,
      callbackContract: "0x0000000000000000000000000000000000000000" as HexAddress,
      uiFeeReceiver: "0x0000000000000000000000000000000000000000" as HexAddress,
      market,
      initialCollateralToken: collateralToken,
      orderType: OrderType.MarketIncrease,
      sizeDeltaUsd,
      initialCollateralDeltaAmount: collateralAmount,
      triggerPrice,
      acceptablePrice,
      executionFee,
      validFromTime: 0n,
      isLong: true,
      autoCancel: false
    };

    return createOrderMutation.mutateAsync({
      params,
      collateralAmount,
      executionFeeAmount: executionFee
    });
  };

  // Helper function to create market short position
  const createMarketShortPosition = async ({
    market,
    collateralToken,
    collateralAmount,
    sizeDeltaUsd,
    executionFee = BigInt(1e9),
    leverageMultiplier = 10n, // Default 10x leverage
    slippagePercentage = 5n,  // Default 5% slippage
    triggerPrice = 0n         // Use 0 for market orders or set for limit orders
  }: {
    market: HexAddress;
    collateralToken: HexAddress;
    collateralAmount: bigint;
    sizeDeltaUsd: bigint;
    executionFee?: bigint;
    leverageMultiplier?: bigint;
    slippagePercentage?: bigint;
    triggerPrice?: bigint;
  }) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    // Calculate acceptable price with slippage for a short position (reverse direction)
    const acceptablePrice = triggerPrice > 0n
      ? (triggerPrice * (100n - slippagePercentage)) / 100n
      : (triggerPrice * (100n - slippagePercentage)) / 100n || 0n;

    // Create order parameters
    const params: CreateOrderParams = {
      receiver: address as HexAddress,
      cancellationReceiver: address as HexAddress,
      callbackContract: "0x0000000000000000000000000000000000000000" as HexAddress,
      uiFeeReceiver: "0x0000000000000000000000000000000000000000" as HexAddress,
      market,
      initialCollateralToken: collateralToken,
      orderType: OrderType.MarketIncrease,
      sizeDeltaUsd,
      initialCollateralDeltaAmount: collateralAmount,
      triggerPrice,
      acceptablePrice,
      executionFee,
      validFromTime: 0n,
      isLong: false, // False for short position
      autoCancel: false
    };

    return createOrderMutation.mutateAsync({
      params,
      collateralAmount,
      executionFeeAmount: executionFee
    });
  };

  return {
    createOrderMutation,
    createMarketLongPosition,
    createMarketShortPosition,
    steps,
    txHash
  };
};