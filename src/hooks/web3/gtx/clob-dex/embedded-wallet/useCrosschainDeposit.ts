import { usePrivy, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { ChainBalanceManagerABI } from '@/abis/gtx/clob/ChainBalanceManagerABI';
import { useState } from 'react';
import { useToast } from '@/components/clob-dex/place-order/toastContext';
import contractAddresses from '@/constants/contract/contract-address.json';

export function useCrosschainDeposit() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const APPCHAIN_CHAIN_ID = 4661;
  const { showToast, updateToast } = useToast();

  const deposit = async (amount: string, tokenAddress: `0x${string}`, recipientAddress: `0x${string}`) => {
    // Note: recipientAddress should be the embedded (privy) wallet address
    // The external wallet will be the sender of the transaction
    const toastId = showToast({
      type: 'loading',
      message: 'Processing crosschain deposit...',
    });

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Initializing crosschain deposit...');

      // Add more defensive checks
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available');
      }

      setCurrentStep('Searching for wallets...');
      console.log('Available wallets:', wallets);

      const external = wallets.find(w => {
        console.log('Checking wallet:', w);
        return (
          w &&
          w.walletClientType !== 'privy' &&
          w.chainId &&
          typeof w.chainId === 'string' &&
          w.chainId.startsWith(`eip155:${APPCHAIN_CHAIN_ID}`) &&
          w.address &&
          typeof w.address === 'string' &&
          w.address.startsWith('0x')
        );
      });

      const embedded = wallets.find(w => {
        return (
          w &&
          w.walletClientType === 'privy' &&
          w.address &&
          typeof w.address === 'string' &&
          w.address.startsWith('0x')
        );
      });

      console.log('External wallet:', external);
      console.log('Embedded wallet:', embedded);

      if (!external) {
        throw new Error('External wallet not found or not properly configured');
      }

      if (!embedded || !embedded.address) {
        throw new Error('Embedded wallet not found or missing address');
      }

      setCurrentStep('Wallets found, validating...');

      // Additional validation
      if (!external.getEthereumProvider) {
        throw new Error('External wallet does not support getEthereumProvider');
      }

      setCurrentStep('Preparing transaction data...');

      // Get contract addresses for the appchain
      const chainConfig = (contractAddresses as any)[APPCHAIN_CHAIN_ID.toString()];
      if (!chainConfig) {
        throw new Error(`Chain configuration not found for chain ID ${APPCHAIN_CHAIN_ID}`);
      }

      const chainBalanceManagerAddress = chainConfig.PROXY_CHAINBALANCEMANAGER;
      if (!chainBalanceManagerAddress || chainBalanceManagerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('ChainBalanceManager address not configured');
      }

      // Convert amount to proper units (assuming 6 decimals for USDC)
      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));

      // First, we need to approve the ChainBalanceManager to spend the tokens
      const approveData = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [chainBalanceManagerAddress, units],
      });

      // Then, we'll call the deposit function on ChainBalanceManager
      const depositData = encodeFunctionData({
        abi: ChainBalanceManagerABI,
        functionName: 'deposit',
        args: [tokenAddress, units, recipientAddress],
      });

      setCurrentStep('Connecting to wallet provider...');

      const provider = await external.getEthereumProvider();

      if (!provider) {
        throw new Error('Failed to get Ethereum provider from external wallet');
      }

      console.log('Provider obtained:', provider);

      // Check if provider has request method
      if (!provider.request || typeof provider.request !== 'function') {
        throw new Error('Provider does not have request method');
      }

      setCurrentStep('Switching to correct network...');

      // Switch chain to Appchain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${APPCHAIN_CHAIN_ID.toString(16)}` }],
      });

      setCurrentStep('Please approve token spending in your wallet...');

      // Send approve transaction first - external wallet approves ChainBalanceManager to spend tokens
      const approveTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // External wallet is the sender
            to: tokenAddress,
            value: '0x0',
            data: approveData,
          },
        ],
      });

      console.log('Approve transaction sent:', approveTxHash);
      setCurrentStep('Approval confirmed, now initiating crosschain deposit...');

      // Wait a moment for the approval to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentStep('Please confirm the crosschain deposit in your wallet...');

      // Send deposit transaction to ChainBalanceManager
      // External wallet calls deposit(), tokens go from external -> ChainBalanceManager -> recipient (embedded wallet)
      const depositTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // External wallet is the sender
            to: chainBalanceManagerAddress,
            value: '0x0',
            data: depositData, // Contains recipientAddress (embedded wallet) as the final destination
          },
        ],
      });

      setCurrentStep('Crosschain deposit submitted successfully!');
      updateToast(toastId, {
        type: 'success',
        message: 'Crosschain deposit successful! Tokens will arrive shortly.',
      });
      console.log('Crosschain deposit transaction sent:', depositTxHash);

      // Reset after a short delay
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);

      return depositTxHash;
    } catch (error) {
      console.error('Crosschain deposit error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      updateToast(toastId, {
        type: 'error',
        message: 'Crosschain deposit failed. Please try again.',
      });
      setCurrentStep('');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoading(false);
    setCurrentStep('');
    setError(null);
  };

  return {
    deposit,
    loading,
    currentStep,
    error,
    resetState,
  };
}