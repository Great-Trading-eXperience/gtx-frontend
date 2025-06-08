import { wagmiConfig } from "@/configs/wagmi";
import { ContractName, getContractAddress } from "@/constants/contract/contract-address";
import { HexAddress } from "@/types/general/address";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import BalanceManagerABI from "@/abis/gtx/clob/BalanceManagerABI";

export const useWithdraw = () => {
    const { address } = useAccount();
    const [withdrawalHash, setWithdrawalHash] = useState<HexAddress | undefined>(undefined);
    const chainId = useChainId();

    const {
        mutateAsync: withdraw,
        isPending: isWithdrawPending,
        isError: isWithdrawError,
        error: withdrawError,
        reset: resetMutation,
    } = useMutation({
        mutationFn: async ({
            currency,
            amount,
            tokenSymbol,
            tokenDecimals
        }: {
            currency: HexAddress;
            amount: bigint;
            tokenSymbol: string;
            tokenDecimals: number;
        }) => {
            try {
                if (!address) {
                    toast.error('Wallet not connected');
                    throw new Error('Wallet not connected');
                }

                if (amount <= 0n) {
                    toast.error('Amount must be greater than zero');
                    throw new Error('Amount must be greater than zero');
                }

                // First check if the user has enough balance in the contract
                try {
                    console.log("Checking user balance in contract...");
                    const balanceResult = await readContract(wagmiConfig, {
                        address: getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress,
                        abi: BalanceManagerABI,
                        functionName: 'getBalance',
                        args: [address as HexAddress, currency],
                    });

                    // Explicitly cast the balance to bigint
                    const balance = BigInt(balanceResult as string || '0');
                    console.log(`User balance in contract: ${balance}, Amount to withdraw: ${amount}`);

                    // If balance is insufficient, stop immediately with helpful message
                    if (balance < amount) {
                        const formattedBalance = formatUnits(balance, tokenDecimals);
                        const formattedAmount = formatUnits(amount, tokenDecimals);

                        const errorMessage = `Insufficient balance to withdraw. You have ${formattedBalance} ${tokenSymbol}, but trying to withdraw ${formattedAmount} ${tokenSymbol}.`;
                        toast.error(errorMessage);
                        throw new Error(errorMessage);
                    }
                } catch (balanceError) {
                    console.error("Error checking balance:", balanceError);
                    if (balanceError instanceof Error && !balanceError.message.includes('Insufficient balance')) {
                        toast.error('Failed to check balance. Please try again.');
                        throw balanceError;
                    }
                    // If it's an insufficient balance error, we've already shown a toast
                    throw balanceError;
                }

                // Log the withdrawal parameters
                console.log("Withdrawal Parameters:", {
                    contractAddress: getContractAddress(chainId, ContractName.clobBalanceManager),
                    currency,
                    amount,
                    userAddress: address,
                    formattedAmount: formatUnits(amount, tokenDecimals)
                });

                // First simulate the transaction
                try {
                    console.log("Simulating withdrawal...");
                    const simulation = await simulateContract(wagmiConfig, {
                        address: getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress,
                        abi: BalanceManagerABI,
                        functionName: 'withdraw',
                        args: [
                            currency,
                            amount
                        ] as const,
                    });

                    console.log("Withdrawal simulation result:", simulation.result);
                } catch (simulationError) {
                    console.error("Simulation error:", simulationError);

                    // Handle specific error cases
                    if (simulationError instanceof Error) {
                        const errorMessage = simulationError.message;

                        if (errorMessage.includes('InsufficientBalance') || errorMessage.includes('insufficient')) {
                            toast.error(`Insufficient balance to withdraw ${formatUnits(amount, tokenDecimals)} ${tokenSymbol}`);
                            throw new Error(`Insufficient balance to withdraw ${formatUnits(amount, tokenDecimals)} ${tokenSymbol}`);
                        } else if (errorMessage.includes('ZeroAmount')) {
                            toast.error('Withdrawal amount cannot be zero');
                            throw new Error('Withdrawal amount cannot be zero');
                        } else {
                            toast.error('Failed to simulate withdrawal. Please try again.');
                            throw simulationError;
                        }
                    }
                    throw simulationError;
                }

                // Execute the withdrawal transaction
                console.log("Executing withdrawal...");
                const hash = await writeContract(wagmiConfig, {
                    address: getContractAddress(chainId, ContractName.clobBalanceManager) as HexAddress,
                    abi: BalanceManagerABI,
                    functionName: 'withdraw',
                    args: [
                        currency,
                        amount
                    ] as const,
                });

                console.log("Withdrawal transaction hash:", hash);
                setWithdrawalHash(hash);
                toast.success('Withdrawal submitted. Waiting for confirmation...');

                // Wait for transaction confirmation
                const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
                console.log("Withdrawal receipt:", receipt);

                if (receipt.status === 'success') {
                    toast.success(`Successfully withdrew ${formatUnits(amount, tokenDecimals)} ${tokenSymbol}`);
                } else {
                    toast.error('Withdrawal failed on-chain');
                    throw new Error('Withdrawal failed on-chain');
                }

                return receipt;
            } catch (error) {
                console.error('Withdrawal error:', error);

                // Only show error toast if it wasn't already shown in more specific handlers
                if (error instanceof Error &&
                    !error.message.includes('Insufficient balance') &&
                    !error.message.includes('ZeroAmount')) {
                    toast.error(error.message || 'Failed to process withdrawal');
                }

                throw error;
            }
        },
    });

    // Transaction confirmation states
    const {
        data: withdrawalReceipt,
        isLoading: isWithdrawalConfirming,
        isSuccess: isWithdrawalConfirmed,
        status: withdrawalStatus,
    } = useWaitForTransactionReceipt({
        hash: withdrawalHash,
    });

    // Add reset function to clear all state values
    const resetWithdrawState = () => {
        // Reset the transaction hash
        setWithdrawalHash(undefined);

        // Reset the react-query mutation state
        resetMutation();

        // We can't directly reset the transaction receipt hook state,
        // but setting withdrawalHash to undefined will cause it to stop tracking
        // and reset on its next render cycle

        console.log("Withdraw state has been reset");
    };

    // Wrapper function with validation
    const handleWithdraw = async (
        currency: HexAddress,
        amount: bigint,
        tokenSymbol: string,
        tokenDecimals: number = 18
    ) => {
        if (!address) {
            toast.error('Wallet not connected');
            return;
        }

        if (amount <= 0n) {
            toast.error('Amount must be greater than zero');
            return;
        }

        console.log(`Withdrawing ${formatUnits(amount, tokenDecimals)} ${tokenSymbol}...`);
        return withdraw({ currency, amount, tokenSymbol, tokenDecimals });
    };

    return {
        handleWithdraw,
        isWithdrawPending,
        isWithdrawalConfirming,
        isWithdrawalConfirmed,
        withdrawalHash,
        withdrawError,
        resetWithdrawState,
    };
};