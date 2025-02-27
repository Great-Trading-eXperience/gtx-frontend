import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { writeContract, waitForTransactionReceipt, readContract } from "wagmi/actions";
import { useState } from "react";
import { useAccount } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import { encodeFunctionData, erc20Abi } from "viem";
import balanceManagerABI from "@/abis/gtx/clob-dex/BalanceManagerABI"; // Path to your ABI
import { sendTransaction } from "wagmi/actions";
import { Side } from "@/types/web3/gtx/gtx";

// Type definitions
export type HexAddress = `0x${string}`;

export const useBalanceManager = (balanceManagerAddress: HexAddress) => {
  const { address } = useAccount();
  
  // Track transaction steps
  const [steps, setSteps] = useState<
    Array<{
      step: number;
      status: "idle" | "loading" | "success" | "error";
      error?: string;
    }>
  >([
    { step: 1, status: "idle" }, // Approve token (if needed)
    { step: 2, status: "idle" }, // Deposit to balance manager
  ]);

  // Store the transaction hash for reference
  const [txHash, setTxHash] = useState<string | null>(null);

  // Mutation for depositing tokens
  const depositMutation = useMutation({
    mutationFn: async ({ 
      currency, 
      amount 
    }: { 
      currency: HexAddress; 
      amount: bigint;
    }) => {
      try {
        // Reset steps
        setSteps([
          { step: 1, status: "idle" },
          { step: 2, status: "idle" },
        ]);

        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Step 1: Check allowance and approve if needed
        setSteps((prev) =>
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        const allowance = await readContract(wagmiConfig, {
          abi: erc20Abi,
          address: currency,
          functionName: "allowance",
          args: [address, balanceManagerAddress],
        });

        if (allowance < amount) {
          // Approve tokens
          const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [balanceManagerAddress, amount],
          });

          const approveHash = await sendTransaction(wagmiConfig, {
            to: currency,
            data: approveData,
          });

          const approveReceipt = await waitForTransactionReceipt(wagmiConfig, { 
            hash: approveHash 
          });

          if (approveReceipt.status !== "success") {
            throw new Error("Failed to approve tokens");
          }
        }

        // Mark approval step as successful
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 1 ? { ...item, status: "success" } : item
          )
        );

        // Step 2: Deposit tokens
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 2 ? { ...item, status: "loading" } : item
          )
        );

        const depositHash = await writeContract(wagmiConfig, {
          abi: balanceManagerABI,
          address: balanceManagerAddress,
          functionName: "deposit",
          args: [currency, amount],
        });

        setTxHash(depositHash);

        const depositReceipt = await waitForTransactionReceipt(wagmiConfig, { 
          hash: depositHash 
        });

        if (depositReceipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 2 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Tokens deposited successfully!");
        } else {
          throw new Error("Deposit transaction failed");
        }

        return depositReceipt;
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

        toast.error(error instanceof Error ? error.message : "Failed to deposit tokens. Please try again.");
        throw error;
      }
    },
  });

  // Mutation for depositing tokens for another user
  const depositForUserMutation = useMutation({
    mutationFn: async ({ 
      currency, 
      amount, 
      user 
    }: { 
      currency: HexAddress; 
      amount: bigint;
      user: HexAddress;
    }) => {
      try {
        // Reset steps
        setSteps([
          { step: 1, status: "idle" },
          { step: 2, status: "idle" },
        ]);

        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Step 1: Check allowance and approve if needed
        setSteps((prev) =>
          prev.map((item) => 
            item.step === 1 ? { ...item, status: "loading" } : item
          )
        );

        const allowance = await readContract(wagmiConfig, {
          abi: erc20Abi,
          address: currency,
          functionName: "allowance",
          args: [address, balanceManagerAddress],
        });

        if (allowance < amount) {
          // Approve tokens
          const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [balanceManagerAddress, amount],
          });

          const approveHash = await sendTransaction(wagmiConfig, {
            to: currency,
            data: approveData,
          });

          const approveReceipt = await waitForTransactionReceipt(wagmiConfig, { 
            hash: approveHash 
          });

          if (approveReceipt.status !== "success") {
            throw new Error("Failed to approve tokens");
          }
        }

        // Mark approval step as successful
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 1 ? { ...item, status: "success" } : item
          )
        );

        // Step 2: Deposit tokens for another user
        setSteps((prev) =>
          prev.map((item) =>
            item.step === 2 ? { ...item, status: "loading" } : item
          )
        );

        const depositHash = await writeContract(wagmiConfig, {
          abi: balanceManagerABI,
          address: balanceManagerAddress,
          functionName: "deposit",
          args: [currency, amount, user],
        });

        setTxHash(depositHash);

        const depositReceipt = await waitForTransactionReceipt(wagmiConfig, { 
          hash: depositHash 
        });

        if (depositReceipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 2 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Tokens deposited for user successfully!");
        } else {
          throw new Error("Deposit transaction failed");
        }

        return depositReceipt;
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

        toast.error(error instanceof Error ? error.message : "Failed to deposit tokens for user. Please try again.");
        throw error;
      }
    },
  });

  // Mutation for withdrawing tokens
  const withdrawMutation = useMutation({
    mutationFn: async ({ 
      currency, 
      amount 
    }: { 
      currency: HexAddress; 
      amount: bigint;
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

        // Execute the withdrawal transaction
        const hash = await writeContract(wagmiConfig, {
          abi: balanceManagerABI,
          address: balanceManagerAddress,
          functionName: "withdraw",
          args: [currency, amount],
        });

        setTxHash(hash);

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === "success") {
          setSteps((prev) =>
            prev.map((item) =>
              item.step === 1 ? { ...item, status: "success" } : item
            )
          );
          toast.success("Tokens withdrawn successfully!");
        } else {
          throw new Error("Withdrawal transaction failed");
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

        toast.error(error instanceof Error ? error.message : "Failed to withdraw tokens. Please try again.");
        throw error;
      }
    },
  });

  // Query for getting user balance
  const getBalance = async (currency: HexAddress, user: HexAddress = address as HexAddress) => {
    if (!user) return BigInt(0);
    
    try {
      const balance = await readContract(wagmiConfig, {
        abi: balanceManagerABI,
        address: balanceManagerAddress,
        functionName: "getBalance",
        args: [user, currency],
      });
      
      return balance;
    } catch (error) {
      console.error("Failed to get balance:", error);
      return BigInt(0);
    }
  };

  // Query for getting locked balance
  const getLockedBalance = async (
    currency: HexAddress, 
    operator: HexAddress,
    user: HexAddress = address as HexAddress
  ) => {
    if (!user) return BigInt(0);
    
    try {
      const lockedBalance = await readContract(wagmiConfig, {
        abi: balanceManagerABI,
        address: balanceManagerAddress,
        functionName: "getLockedBalance",
        args: [user, operator, currency],
      });
      
      return lockedBalance;
    } catch (error) {
      console.error("Failed to get locked balance:", error);
      return BigInt(0);
    }
  };

  return {
    steps,
    txHash,
    depositMutation,
    depositForUserMutation,
    withdrawMutation,
    getBalance,
    getLockedBalance,
  };
};

// Combined hook for place order with automatic deposit
// export const usePlaceOrderWithBalance = (
//   routerAddress: HexAddress,
//   balanceManagerAddress: HexAddress
// ) => {
//   const { address } = useAccount();
//   const { placeOrder, steps: orderSteps, txHash: orderTxHash, isLoading: orderLoading, isError: orderError } = usePlaceOrder(routerAddress);
//   const { depositMutation, steps: depositSteps, txHash: depositTxHash } = useBalanceManager(balanceManagerAddress);
  
//   // Combine steps from both operations
//   const combinedSteps = [
//     { step: 1, status: depositSteps[0].status, error: depositSteps[0].error },
//     { step: 2, status: depositSteps[1].status, error: depositSteps[1].error },
//     { step: 3, status: orderSteps[0].status, error: orderSteps[0].error },
//   ];

//   // Combined mutation for depositing and then placing an order
//   const placeOrderWithBalanceCheck = useMutation({
//     mutationFn: async ({ 
//       key,
//       price,
//       quantity,
//       side,
//       isMarketOrder = false,
//       currency,
//       amount
//     }: { 
//       key: PoolKey;
//       price?: bigint;
//       quantity: bigint;
//       side: Side;
//       isMarketOrder?: boolean;
//       currency: HexAddress;
//       amount: bigint;
//     }) => {
//       try {
//         // First deposit funds
//         await depositMutation.mutateAsync({ currency, amount });
        
//         // Then place the order
//         if (isMarketOrder) {
//           return await placeOrder({ key, quantity, side, isMarketOrder });
//         } else {
//           return await placeOrder({ key, price: price!, quantity, side, isMarketOrder });
//         }
//       } catch (error) {
//         console.error("Failed to place order with balance check:", error);
//         throw error;
//       }
//     }
//   });

//   return {
//     placeOrderWithBalanceCheck,
//     combinedSteps,
//     depositTxHash,
//     orderTxHash,
//     isLoading: placeOrderWithBalanceCheck.isPending,
//     isError: placeOrderWithBalanceCheck.isError,
//     error: placeOrderWithBalanceCheck.error
//   };
// };
