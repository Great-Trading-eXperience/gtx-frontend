import faucetABI from '@/abis/faucet/FaucetABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { HexAddress } from '@/types/general/address';
import { simulateContract } from '@wagmi/core';
import { useState } from 'react';
import { toast } from 'sonner';
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

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
            
            // Handle gas fund errors specifically
            if (error instanceof Error) {
                const errorStr = error.toString();
                if (errorStr.includes('insufficient funds for gas') || errorStr.includes('insufficient funds') || errorStr.includes('InsufficientFunds') || errorStr.includes('gas required exceeds allowance')) {
                    toast.error('Insufficient gas funds. Please add more native tokens to your wallet to pay for transaction fees.');
                } else {
                    toast.error(error.message || 'Transaction failed. Please try again.');
                }
            } else {
                toast.error('Transaction failed. Please try again.');
            }
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