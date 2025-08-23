import GTXRouterABI from "@/abis/gtx/clob/GTXRouterABI";
import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useEffectiveChainId } from "@/utils/chain-override";

export const useCancelOrder = () => {
  const { address } = useAccount();
  const [cancelOrderHash, setCancelOrderHash] = useState<HexAddress | undefined>(undefined);
  const [errorAlreadyShown, setErrorAlreadyShown] = useState(false); // Flag to track if error was shown
  const currentChainId = useChainId();
  const chainId = useEffectiveChainId(currentChainId); // Use forced chain if configured

  const {
    mutateAsync: cancelOrder,
    isPending: isCancelOrderPending,
    isError: isCancelOrderError,
    error: cancelOrderError,
    reset: resetMutation,
  } = useMutation({
    mutationFn: async ({
      pool,
      orderId,
    }: {
      pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress };
      orderId: number;
    }) => {
      // Reset the error shown flag at the start of each mutation
      setErrorAlreadyShown(false);

      try {
        if (!address) {
          toast.error('Wallet not connected');
          setErrorAlreadyShown(true);
          throw new Error('Wallet not connected');
        }

        // Log the parameters we're about to use for cancellation
        console.log("Cancellation Parameters:", {
          contractAddress: getContractAddress(chainId, ContractName.clobRouter),
          orderToCancel: {
            pool: {
              baseCurrency: pool.baseCurrency,
              quoteCurrency: pool.quoteCurrency,
              orderBook: pool.orderBook
            },
            orderId,
            callerAddress: address
          },
          chainId
        });

        // Set to track if we should proceed despite simulation errors
        let proceedDespiteSimulationError = false;
        let simulationErrorMessage = "";

        // First simulate the transaction
        try {
          console.log("Simulating cancelOrder with:", {
            address: getContractAddress(chainId, ContractName.clobRouter),
            functionName: 'cancelOrder',
            args: [pool, orderId]
          });

          const simulation = await simulateContract(wagmiConfig, {
            address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
            abi: GTXRouterABI,
            functionName: 'cancelOrder',
            args: [
              pool,
              orderId
            ] as const,
          });

          console.log("Cancel order simulation result:", simulation.result);
          console.log("Full simulation response:", simulation);
        } catch (simulationError) {
          console.error("Simulation error:", simulationError);
          console.log("Simulation error details:", JSON.stringify(simulationError, null, 2));

          // Handle simulation errors more specifically
          if (simulationError instanceof Error) {
            const errorMessage = simulationError.message;
            simulationErrorMessage = errorMessage;

            // Check for specific error signatures
            if (errorMessage.includes('0x1d9d97a1')) {
              // Based on your logs, we'll attempt to proceed with the transaction anyway
              console.log("Detected error 0x1d9d97a1 but proceeding with transaction");
              proceedDespiteSimulationError = true;
              toast.info('Attempting to cancel order...');
            } else if (errorMessage.includes('OrderNotFound') || errorMessage.includes('0xe0fba687')) {
              toast.error('Order not found or already processed');
              setErrorAlreadyShown(true);
              throw new Error('Order not found or already processed');
            } else if (errorMessage.includes('UnauthorizedCancellation') || errorMessage.includes('0x85e147d1')) {
              toast.error('You are not authorized to cancel this order');
              setErrorAlreadyShown(true);
              throw new Error('You are not authorized to cancel this order');
            } else {
              // For other unknown errors, we'll still try the transaction
              console.log("Unknown simulation error, attempting to proceed anyway");
              proceedDespiteSimulationError = true;
              toast.info('Attempting to cancel order despite simulation error...');
            }
          } else {
            // For non-Error objects, we'll also try to proceed
            proceedDespiteSimulationError = true;
            toast.info('Attempting to cancel order...');
          }

          if (!proceedDespiteSimulationError) {
            throw simulationError;
          }
        }

        // Execute the transaction if simulation passes or we decide to proceed
        console.log("Executing cancelOrder with:", {
          address: getContractAddress(chainId, ContractName.clobRouter),
          functionName: 'cancelOrder',
          args: [pool, orderId]
        });

        let hash;
        try {
          hash = await writeContract(wagmiConfig, {
            address: getContractAddress(chainId, ContractName.clobRouter) as HexAddress,
            abi: GTXRouterABI,
            functionName: 'cancelOrder',
            args: [
              pool,
              orderId
            ] as const,
          });

          console.log("Transaction hash:", hash);
          setCancelOrderHash(hash);
          toast.success('Cancel order submitted. Waiting for confirmation...');
        } catch (txError) {
          console.error("Transaction error:", txError);

          // If we tried to proceed despite simulation errors and still failed, now we should show the original error
          if (proceedDespiteSimulationError) {
            toast.error(`Failed to cancel order: ${simulationErrorMessage || 'Unknown error'}`);
            setErrorAlreadyShown(true);
            throw new Error(simulationErrorMessage || 'Failed to cancel order');
          }

          // Otherwise handle new transaction errors
          if (txError instanceof Error) {
            toast.error(`Transaction error: ${txError.message}`);
            setErrorAlreadyShown(true);
          } else {
            toast.error('Failed to submit transaction');
            setErrorAlreadyShown(true);
          }
          throw txError;
        }

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 'success') {
          toast.success('Order cancelled successfully!');
        } else {
          toast.error('Order cancellation failed on-chain');
          setErrorAlreadyShown(true);
          throw new Error('Order cancellation failed on-chain');
        }

        return receipt;
      } catch (error) {
        console.error('Cancel order error:', error);

        // Only show error messages if we haven't already shown one
        if (!errorAlreadyShown) {
          if (error instanceof Error) {
            const errorMessage = error.message;
            console.log("Error message:", errorMessage);

            // Check for specific error signatures
            if (errorMessage.includes('0x1d9d97a1')) {
              toast.error('This order cannot be cancelled. It may be already filled, expired, or cancelled.');
            } else if (errorMessage.includes('OrderNotFound') || errorMessage.includes('0xe0fba687')) {
              toast.error('Order not found or already processed');
            } else if (errorMessage.includes('UnauthorizedCancellation') || errorMessage.includes('0x85e147d1')) {
              toast.error('You are not authorized to cancel this order');
            } else {
              toast.error(errorMessage);
            }
          } else {
            toast.error('Failed to cancel order');
          }
        }

        throw error;
      }
    },
  });

  // Transaction confirmation states
  const {
    data: cancelOrderReceipt,
    isLoading: isCancelOrderConfirming,
    isSuccess: isCancelOrderConfirmed,
  } = useWaitForTransactionReceipt({
    hash: cancelOrderHash,
  });

  // Add reset function to clear all state values
  const resetCancelOrderState = () => {
    // Reset the transaction hash
    setCancelOrderHash(undefined);

    // Reset error already shown flag
    setErrorAlreadyShown(false);

    // Reset the react-query mutation state
    resetMutation();

    console.log("Cancel order state has been reset");
  };

  // Wrapper function with validation
  const handleCancelOrder = async (
    pool: { baseCurrency: HexAddress; quoteCurrency: HexAddress; orderBook: HexAddress },
    orderId: number
  ) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    if (orderId <= 0) {
      toast.error('Invalid order ID');
      return;
    }

    console.log("handleCancelOrder called with:", {
      pool,
      orderId,
      walletAddress: address
    });

    return cancelOrder({ pool, orderId });
  };

  return {
    handleCancelOrder,
    isCancelOrderPending,
    isCancelOrderConfirming,
    isCancelOrderConfirmed,
    cancelOrderHash,
    cancelOrderError,
    resetCancelOrderState, // Export the reset function
  };
};