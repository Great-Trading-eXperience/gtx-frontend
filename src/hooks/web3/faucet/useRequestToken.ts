import faucetABI from '@/abis/faucet/FaucetABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { HexAddress } from '@/types/general/address';
import { useEffectiveChainId } from '@/utils/chain-override';
import { simulateContract } from '@wagmi/core';
import { useState } from 'react';
import { toast } from 'sonner';
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

export const useRequestToken = (
) => {
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const currentChainId = useChainId();
    const chainId = useEffectiveChainId(currentChainId); // Use forced chain if configured

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