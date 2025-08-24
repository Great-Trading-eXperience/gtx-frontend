import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { useState } from 'react';
import { useToast } from '@/components/clob-dex/place-order/toastContext';

export function usePrivyDeposit() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const RISE_CHAIN_ID = 11155931;
  const { showToast, updateToast } = useToast();

  const deposit = async (amount: string, currencyAddress: `0x${string}`) => {
    console.log('🔵 usePrivyDeposit: Regular deposit hook called');
    console.log('🔵 usePrivyDeposit: Amount:', amount, 'Currency:', currencyAddress);
    
    const toastId = showToast({
      type: 'loading',
      message: 'Processing deposit...',
    });

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Initializing regular deposit...');
      console.log('🔵 usePrivyDeposit: Starting regular deposit process');

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
          w.chainId.startsWith('eip155:11155931') &&
          w.address &&
          typeof w.address === 'string' &&
          w.address.startsWith('0x')
        );
      });

      // Get the embedded wallet following the same pattern as usePrivyPlaceOrder
      const embedded = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
      const embeddedAddress = embedded?.address;

      console.log('External wallet:', external);
      console.log('Embedded wallet:', embedded);
      console.log('Embedded address:', embeddedAddress);

      if (!external) {
        throw new Error('External wallet not found or not properly configured');
      }

      if (!embedded || !embeddedAddress) {
        throw new Error('Embedded wallet not found or missing address');
      }

      setCurrentStep('Wallets found, validating...');

      // Additional validation
      if (!external.getEthereumProvider) {
        throw new Error('External wallet does not support getEthereumProvider');
      }

      setCurrentStep('Preparing transaction data...');

      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));
      const data = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [embeddedAddress, units],
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

      // Switch chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${RISE_CHAIN_ID.toString(16)}` }],
      });

      setCurrentStep('Please confirm the transaction in your wallet...');

      // Send transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // Add from address
            to: currencyAddress,
            value: '0x0',
            data,
          },
        ],
      });

      setCurrentStep('Transaction submitted successfully!');
      updateToast(toastId, {
        type: 'success',
        message: 'Deposit successful!',
      });
      console.log('🔵 usePrivyDeposit: Regular deposit transaction sent:', txHash);
      console.log('🔵 usePrivyDeposit: Regular deposit completed successfully');

      // Reset after a short delay
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);

      return txHash;
    } catch (error) {
      console.error('🔵 usePrivyDeposit: Regular deposit error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      updateToast(toastId, {
        type: 'error',
        message: 'Deposit failed. Please try again.',
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
