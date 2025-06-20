import faucetABI from '@/abis/faucet/FaucetABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, FAUCET_ADDRESS, getContractAddress } from '@/constants/contract/contract-address';
import { HexAddress } from '@/types/general/address';
import { simulateContract } from '@wagmi/core';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useChainId } from 'wagmi';

export const useRequestToken = (
) => {
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const chainId = useChainId();

    const {
        data: requestTokenHash,
        isPending: isRequestTokenPending,
        writeContract: writeRequestToken
    } = useWriteContract();

    const {
        isLoading: isRequestTokenConfirming,
        isSuccess: isRequestTokenConfirmed
    } = useWaitForTransactionReceipt({
        hash: requestTokenHash,
    });

    const handleRequestToken = async (receiverAddress: HexAddress, tokenAddress: HexAddress) => {
        try {
            const simulation = await simulateContract(wagmiConfig, {
                abi: faucetABI,
                address: getContractAddress(chainId, ContractName.faucet) as `0x${string}`,
                functionName: 'requestToken',
                args: [receiverAddress, tokenAddress],
                account: receiverAddress
            });

            const result = writeRequestToken({
                abi: faucetABI,
                address: getContractAddress(chainId, ContractName.faucet) as `0x${string}`,
                functionName: 'requestToken',
                args: [receiverAddress, tokenAddress],
            });

            toast.success('Token has been requested');
            setIsAlertOpen(true);
        } catch (error) {
            console.error('Transaction error:', error);
            toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
        }
    };

    return {
        isAlertOpen,
        setIsAlertOpen,
        requestTokenHash,
        isRequestTokenPending,
        isRequestTokenConfirming,
        handleRequestToken,
        isRequestTokenConfirmed
    };
};