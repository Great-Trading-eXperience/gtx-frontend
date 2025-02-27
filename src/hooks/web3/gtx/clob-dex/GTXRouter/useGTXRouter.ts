import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useState } from "react";
import { useAccount } from "wagmi";
import gtxRouterABI from "@/abis/gtx/clob-dex/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";

// Type definitions for clarity
export type HexAddress = `0x${string}`;
export type PoolKey = {
  baseCurrency: HexAddress;
  quoteCurrency: HexAddress;
};
export type Side = 0 | 1; // 0 = BID, 1 = ASK

export const useGTXRouter = (routerAddress: HexAddress) => {
  const { address } = useAccount();
  
  // Track transaction steps
  const [steps, setSteps] = useState<
    Array<{
      step: number;
      status: "idle" | "loading" | "success" | "error";
      error?: string;
    }>
  >([
    { step: 1, status: "idle" }, // Place order
  ]);

  // Store the transaction hash for reference
  const [txHash, setTxHash] = useState<string | null>(null);

  // Mutation for regular limit order
  const placeOrderMutation = useMutation({
    mutationFn: async ({ 
      key, 
      price, 
      quantity, 
      side 
    }: { 
      key: PoolKey; 
      price: bigint; 
      quantity: bigint; 
      side: Side;
    }) => {
      try {
        // Reset steps
        setSteps([{ step: 1, status: "idle" }]);

        // Set step to loading
        setSteps((prev) => 
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        // Execute the transaction
        const hash = await writeContract(wagmiConfig, {
          abi: gtxRouterABI,
          address: routerAddress,
          functionName: "placeOrder",
          args: [key, price, quantity, side],
        });

        // Set the transaction hash
        setTxHash(hash);

        // Wait for receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 1 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Order placed successfully!");
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

        toast.error(error instanceof Error ? error.message : "Failed to place order. Please try again.");
        throw error;
      }
    },
  });

  // Mutation for order with deposit
  const placeOrderWithDepositMutation = useMutation({
    mutationFn: async ({ 
      key, 
      price, 
      quantity, 
      side 
    }: { 
      key: PoolKey; 
      price: bigint; 
      quantity: bigint; 
      side: Side;
    }) => {
      try {
        // Reset steps
        setSteps([{ step: 1, status: "idle" }]);

        // Set step to loading
        setSteps((prev) => 
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        // Execute the transaction
        const hash = await writeContract(wagmiConfig, {
          abi: gtxRouterABI,
          address: routerAddress,
          functionName: "placeOrderWithDeposit",
          args: [key, price, quantity, side],
        });

        // Set the transaction hash
        setTxHash(hash);

        // Wait for receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 1 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Order with deposit placed successfully!");
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

        toast.error(error instanceof Error ? error.message : "Failed to place order with deposit. Please try again.");
        throw error;
      }
    },
  });

  // Mutation for market order
  const placeMarketOrderMutation = useMutation({
    mutationFn: async ({ 
      key, 
      quantity, 
      side 
    }: { 
      key: PoolKey; 
      quantity: bigint; 
      side: Side;
    }) => {
      try {
        // Reset steps
        setSteps([{ step: 1, status: "idle" }]);

        // Set step to loading
        setSteps((prev) => 
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        // Execute the transaction
        const hash = await writeContract(wagmiConfig, {
          abi: gtxRouterABI,
          address: routerAddress,
          functionName: "placeMarketOrder",
          args: [key, quantity, side],
        });

        // Set the transaction hash
        setTxHash(hash);

        // Wait for receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 1 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Market order placed successfully!");
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

        toast.error(error instanceof Error ? error.message : "Failed to place market order. Please try again.");
        throw error;
      }
    },
  });

  // Mutation for market order with deposit
  const placeMarketOrderWithDepositMutation = useMutation({
    mutationFn: async ({ 
      key, 
      price, // Note: The contract oddly requires price for market orders with deposit
      quantity, 
      side 
    }: { 
      key: PoolKey; 
      price: bigint; 
      quantity: bigint; 
      side: Side;
    }) => {
      try {
        // Reset steps
        setSteps([{ step: 1, status: "idle" }]);

        // Set step to loading
        setSteps((prev) => 
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        // Execute the transaction
        const hash = await writeContract(wagmiConfig, {
          abi: gtxRouterABI,
          address: routerAddress,
          functionName: "placeMarketOrderWithDeposit",
          args: [key, price, quantity, side],
        });

        // Set the transaction hash
        setTxHash(hash);

        // Wait for receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 1 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Market order with deposit placed successfully!");
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

        toast.error(error instanceof Error ? error.message : "Failed to place market order with deposit. Please try again.");
        throw error;
      }
    },
  });

  return { 
    steps, 
    txHash,
    placeOrderMutation,
    placeOrderWithDepositMutation,
    placeMarketOrderMutation,
    placeMarketOrderWithDepositMutation
  };
};

// Example usage hook that combines all order placement functions
export const usePlaceOrder = (routerAddress: HexAddress) => {
  const { 
    placeOrderMutation,
    placeOrderWithDepositMutation,
    placeMarketOrderMutation,
    placeMarketOrderWithDepositMutation,
    steps,
    txHash
  } = useGTXRouter(routerAddress);

  // A unified function that chooses the right mutation based on parameters
  const placeOrder = ({
    key,
    price,
    quantity,
    side,
    isMarketOrder = false,
    withDeposit = false
  }: {
    key: PoolKey;
    price?: bigint;
    quantity: bigint;
    side: Side;
    isMarketOrder?: boolean;
    withDeposit?: boolean;
  }) => {
    if (isMarketOrder) {
      return withDeposit && price 
        ? placeMarketOrderWithDepositMutation.mutateAsync({ key, price, quantity, side })
        : placeMarketOrderMutation.mutateAsync({ key, quantity, side });
    } else {
      return price && withDeposit
        ? placeOrderWithDepositMutation.mutateAsync({ key, price, quantity, side })
        : placeOrderMutation.mutateAsync({ key, price: price!, quantity, side });
    }
  };

  const isLoading = 
    placeOrderMutation.isPending || 
    placeOrderWithDepositMutation.isPending || 
    placeMarketOrderMutation.isPending || 
    placeMarketOrderWithDepositMutation.isPending;

  const isError = 
    placeOrderMutation.isError || 
    placeOrderWithDepositMutation.isError || 
    placeMarketOrderMutation.isError || 
    placeMarketOrderWithDepositMutation.isError;

  const isSuccess = 
    placeOrderMutation.isSuccess || 
    placeOrderWithDepositMutation.isSuccess || 
    placeMarketOrderMutation.isSuccess || 
    placeMarketOrderWithDepositMutation.isSuccess;

  const error = 
    placeOrderMutation.error || 
    placeOrderWithDepositMutation.error || 
    placeMarketOrderMutation.error || 
    placeMarketOrderWithDepositMutation.error;

  return {
    placeOrder,
    steps,
    txHash,
    isLoading,
    isError,
    isSuccess,
    error
  };
};