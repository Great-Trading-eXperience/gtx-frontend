import faucetABI from '@/abis/faucet/FaucetABI';
import { wagmiConfig } from '@/configs/wagmi';
import { FAUCET_ADDRESS } from '@/constants/contract-address';
import { HexAddress } from '@/types/general/address';
import { simulateContract } from '@wagmi/core';
import { useState } from 'react';
import { toast } from 'sonner';
import { encodeFunctionData } from 'viem';
import { usePublicClient, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from 'wagmi';

export const useRequestToken = (
) => {
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

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
            // const resultSimulation = await readContract(wagmiConfig, {
            //     address: FAUCET_ADDRESS as HexAddress,
            //     abi: faucetABI,
            //     functionName: 'requestToken',
            //     args: [receiverAddress, tokenAddress],
            // });

            // console.log({
            //     resultSimulation
            // })

            // Simulate the transaction first
            // const resultSimulation2 =  await simulateContract(wagmiConfig, {
            //     abi: faucetABI,
            //     address: FAUCET_ADDRESS as HexAddress,
            //     functionName: 'requestToken',
            //     args: [receiverAddress, tokenAddress],
            // });

            // console.log({
            //     resultSimulation2
            // })

            // const result = writeRequestToken({

            // If simulation succeeds, send the actual transaction
            // Debug the transaction first using debug_traceCall
            // Since we can't use debug_traceCall, we'll rely on simulateContract 
            // which provides more detailed error information if the call fails
            const simulation = await simulateContract(wagmiConfig, {
                abi: faucetABI,
                address: FAUCET_ADDRESS as HexAddress,
                functionName: 'requestToken',
                args: [receiverAddress, tokenAddress],
                account: receiverAddress // Simulate from the receiver's address
            });

            // console.log('Simulation details:', {
            //     result: simulation.result,
            //     request: simulation.request
            // });


            const result = writeRequestToken({
                abi: faucetABI,
                address: FAUCET_ADDRESS as HexAddress,
                functionName: 'requestToken',
                args: [receiverAddress, tokenAddress],
            });
            console.log({
                result
            })

            // If debug trace looks good, proceed with actual transaction
            // const { request } = await simulateContract(wagmiConfig, {
            //     abi: faucetABI,
            //     address: FAUCET_ADDRESS as HexAddress,
            //     functionName: 'requestToken',
            //     args: [receiverAddress, tokenAddress],
            // });

            // request will contain the JSON-RPC data
            // console.log('RPC request:', request);
            // // if you still need to send it later:
            // // const result = await writeRequestToken(request);

            const calldata = encodeFunctionData({
                abi: faucetABI,
                functionName: 'requestToken',
                args: [receiverAddress, tokenAddress],
            });
            // Convert hex string to Uint8Array
            const calldataBytes = new Uint8Array(
                (calldata.match(/.{1,2}/g) || [])
                    .map(byte => parseInt(byte, 16))
            );

            const jsonRpcRequest = {
                jsonrpc: '2.0',
                method: 'eth_sendTransaction',
                params: [calldata],
                id: 1
            };


            const hexString = "0x7f2e06e3000000000000000000000000af4f62ebe8732a090e402335706d44d642ce130d000000000000000000000000e2ba2cb6c3c02ebc2e758f43136d21ad94a07d70";

            // Remove the "0x" prefix if present
            const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;

            // Convert hex string to Uint8Array
            const uint8Array = new Uint8Array(
                (cleanHex.match(/.{1,2}/g) ?? [])
                    .map(byte => parseInt(byte, 16))
            );

            console.log(uint8Array);

            console.log('Curl command:');
            console.log(`curl -X POST ${wagmiConfig.chains[0].rpcUrls.default.http[0]} \\
                -H "Content-Type: application/json" \\
                -d '${JSON.stringify(jsonRpcRequest)}'`);

            // const account = await getAccount(wagmiConfig);

            // if (!publicClient) {
            //     throw new Error('Public client not found');
            // }

            // // if (!publicClient.account) {
            // //     throw new Error('Public client account not found');
            // // }

            // // Get the nonce
            // const nonce = await publicClient.getTransactionCount({
            //     address: account.address as HexAddress
            // });

            // if (!walletClient) {
            //     throw new Error('Wallet client not found');
            // }

            // // Create and sign transaction
            // const transaction = {
            //     nonce: nonce,
            //     to: FAUCET_ADDRESS as `0x${string}`,
            //     data: calldata,
            //     gasLimit: parseGwei('100000').toString(),
            //     maxFeePerGas: parseGwei('20').toString(),
            //     maxPriorityFeePerGas: parseGwei('2').toString(),
            //     value: parseGwei('0').toString(),
            //     chainId: wagmiConfig.chains[0].id,
            //     accessList: []
            // };

            // console.log('transaction', {
            //     transaction
            // })

            // console.log([
            //     `0x${transaction.chainId.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.nonce.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.maxPriorityFeePerGas.toString()}`,
            //     `0x${transaction.maxFeePerGas.toString()}`,
            //     `0x${transaction.gasLimit.toString()}`,
            //     transaction.to,
            //     `0x${transaction.value.toString()}`,
            //     transaction.data,
            //     transaction.accessList
            // ])

            // const encodedTransaction = toRlp([
            //     `0x${transaction.chainId.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.nonce.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.maxPriorityFeePerGas.toString()}`,
            //     `0x${transaction.maxFeePerGas.toString()}`,
            //     `0x${transaction.gasLimit.toString()}`,
            //     transaction.to,
            //     `0x${transaction.value.toString()}`,
            //     transaction.data,
            //     transaction.accessList
            // ])

            // console.log(encodedTransaction,
            //    [`0x${transaction.chainId.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.nonce.toString(16).padStart(2, '0')}`,
            //     `0x${transaction.maxPriorityFeePerGas.toString()}`,
            //     `0x${transaction.maxFeePerGas.toString()}`,
            //     `0x${transaction.gasLimit.toString()}`,
            //     transaction.to,
            //     `0x${transaction.value.toString()}`,
            //     transaction.data,
            //     transaction.accessList], {
            //     encodedTransaction
            // })

            // // 4. Hash the encoded transaction
            // const transactionHash = keccak256(encodedTransaction)

            // console.log('transactionHash',{
            //     transactionHash
            // })

            // try {
            //     const signature = await walletClient.signMessage({
            //         message: transactionHash,
            //         account: account.address as HexAddress
            //     })

            //     console.log('signature')
            //     console.log(signature)

            //     // Get the raw signed transaction
            //     // const signedTx = await publicClient.account.signTransaction(transaction);

            //     // Format the JSON-RPC request
            //     const jsonRpcRequest = {
            //         jsonrpc: '2.0',
            //         method: 'eth_sendRawTransaction',
            //         params: [signature],
            //         id: 1
            //     };

            //     console.log('Curl command:');
            //     console.log(`curl -X POST ${wagmiConfig.chains[0].rpcUrls.default.http[0]} \\
            //         -H "Content-Type: application/json" \\
            //         -d '${JSON.stringify(jsonRpcRequest)}'`);
            // } catch (error) {
            //     console.error('Transaction error:', error);
            //     toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
            // }

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