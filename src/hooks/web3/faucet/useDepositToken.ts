import faucetABI from '@/abis/faucet/FaucetABI';
import TokenABI from '@/abis/tokens/TokenABI';
import { wagmiConfig } from '@/configs/wagmi';
import { FAUCET_ADDRESS } from '@/constants/contract-address';
import { HexAddress } from '@/types/general/address';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { readContract, getAccount } from '@wagmi/core';

export const useDepositToken = () => {
    const [allowance, setAllowance] = useState<bigint>(BigInt(0));
    const [isDepositAlertOpen, setIsDepositAlertOpen] = useState(false);
    const [approvalParams, setApprovalParams] = useState<{
        tokenAddress: HexAddress;
        amount: bigint;
    } | undefined>();
    const [simulationParams, setSimulationParams] = useState<{
        tokenAddress: HexAddress;
        amount: bigint;
    } | undefined>();

    // Simulation hook
    const {
        data: simulateData,
        isError: isDepositSimulationError,
        isLoading: isDepositSimulationLoading,
        refetch: refetchDepositSimulation,
        error: simulateError,
    } = useSimulateContract({
        address: FAUCET_ADDRESS as HexAddress,
        abi: faucetABI,
        functionName: 'depositToken',
        args: simulationParams ? [
            simulationParams.tokenAddress,
            simulationParams.amount
        ] : undefined,
    });

    // Rest of the hooks remain the same...
    const {
        data: depositHash,
        isPending: isDepositPending,
        writeContract: writeDeposit
    } = useWriteContract();

    const {
        isLoading: isDepositConfirming,
        isSuccess: isDepositConfirmed
    } = useWaitForTransactionReceipt({
        hash: depositHash,
    });

    const {
        data: approvalHash,
        isPending: isApprovalPending,
        writeContract: writeApproval
    } = useWriteContract();

    const {
        isLoading: isApprovalConfirming,
        isSuccess: isApprovalConfirmed
    } = useWaitForTransactionReceipt({
        hash: approvalHash,
    });

    const handleApprovalDeposit = async (tokenAddress: HexAddress, amount: bigint) => {
        try {
            const allowanceResult = await readContract(wagmiConfig, {
                address: tokenAddress,
                abi: TokenABI,
                functionName: 'allowance',
                args: [getAccount(wagmiConfig).address, FAUCET_ADDRESS],
            });

            setAllowance(allowanceResult as bigint);

            if (Number(allowanceResult) < Number(amount)) {
                toast.info('Requesting approval');
                setApprovalParams({ tokenAddress, amount });
                writeApproval({
                    address: tokenAddress,
                    abi: TokenABI,
                    functionName: 'approve',
                    args: [FAUCET_ADDRESS, amount],
                });
            } else {
                setSimulationParams({ tokenAddress, amount });
                setApprovalParams(undefined);
            }
        } catch (error) {            
            toast.error(error instanceof Error ? error.message : 'Approval failed. Please try again.');
        }
    };

    const handleDeposit = async () => {
        try {
            if (!approvalParams) {
                return;
            }

            const { tokenAddress, amount } = approvalParams;
            setSimulationParams({ tokenAddress, amount });
            setApprovalParams(undefined);
        } catch (error) {
            console.error('Transaction error:', error);
            toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
        }
    };

    // Effects remain the same but with proper type handling
    useEffect(() => {
        if (!simulationParams || isDepositSimulationLoading) {
            return;
        }
        refetchDepositSimulation();
    }, [simulationParams, isDepositSimulationLoading, refetchDepositSimulation]);

    useEffect(() => {
        if ((!isApprovalConfirmed || !approvalParams) && (!simulationParams || allowance < (simulationParams?.amount ?? BigInt(0)))) {
            return;
        }
        handleDeposit();
    }, [isApprovalConfirmed, approvalParams, simulationParams, allowance]);

    useEffect(() => {
        if (!isDepositConfirmed) {
            return;
        }
        toast.success('Token has been deposited');
        setIsDepositAlertOpen(true);
    }, [isDepositConfirmed]);

    useEffect(() => {
        if (!simulateError || !isDepositSimulationError || isDepositSimulationLoading) {
            return;
        }
        toast.error(simulateError.toString());
    }, [simulateError, isDepositSimulationError, isDepositSimulationLoading]);

    useEffect(() => {
        if (!simulateData || isDepositConfirming) {
            return;
        }
        writeDeposit(simulateData.request);
        setSimulationParams(undefined);
    }, [simulateData, isDepositConfirming, writeDeposit]);

    return {
        isDepositAlertOpen,
        setIsDepositAlertOpen,
        depositHash,
        isDepositPending,
        isApprovalPending,
        isDepositConfirming,
        isApprovalConfirming,
        handleApprovalDeposit,
        isDepositConfirmed,
        isDepositSimulationError,
        isDepositSimulationLoading,
        simulateError
    };
}