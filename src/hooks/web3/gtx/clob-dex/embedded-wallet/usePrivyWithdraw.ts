import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { useState } from 'react';
import { useToast } from '@/components/clob-dex/place-order/toastContext';

export function usePrivyWithdraw() {
  const { user } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const RISE_CHAIN_ID = 11155931;
  const { showToast, updateToast } = useToast();

  const withdraw = async (
    externalAddress: string,
    amount: string,
    currencyAddress: `0x${string}`
  ) => {
    const toastId = showToast({
      type: 'loading',
      message: 'Processing withdraw...',
    });

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Initializing withdrawal...');

      // Validate inputs
      if (!externalAddress || !externalAddress.startsWith('0x')) {
        throw new Error('Invalid external address provided');
      }

      if (!amount || Number(amount) <= 0) {
        throw new Error('Invalid amount provided');
      }

      setCurrentStep('Searching for embedded wallet...');

      // Find embedded wallet with better validation
      const embedded = user?.linkedAccounts?.find(a => {
        console.log('Checking linked account:', a);
        return (
          (a.type === 'wallet' || a.type === 'smart_wallet') &&
          a.address &&
          typeof a.address === 'string' &&
          a.address.startsWith('0x')
        );
      }) as { address: string };

      console.log('Found embedded wallet:', embedded);

      if (!embedded || !embedded.address) {
        throw new Error('No embedded wallet found or wallet address missing');
      }

      setCurrentStep('Validating wallet configuration...');

      // Additional validation for embedded wallet
      if (typeof embedded.address !== 'string') {
        throw new Error('Embedded wallet address is not valid');
      }

      setCurrentStep('Preparing transaction data...');

      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));

      console.log('Transaction details:', {
        from: embedded.address,
        to: externalAddress,
        amount: amount,
        units: units.toString(),
        tokenContract: currencyAddress,
      });

      const data = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [externalAddress, units],
      });

      setCurrentStep('Please confirm the transaction in your wallet...');

      const txResult = await sendTransaction(
        {
          to: currencyAddress,
          value: 0n,
          data,
          chainId: RISE_CHAIN_ID,
        },
        {
          address: embedded.address,
        }
      );

      setCurrentStep('Transaction submitted successfully!');
      updateToast(toastId, {
        type: 'success',
        message: 'Withdraw successful!',
      });
      console.log('Withdrawal transaction result:', txResult);

      // Reset after a short delay
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);

      return txResult;
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during withdrawal';
      setError(errorMessage);
      updateToast(toastId, {
        type: 'error',
        message: 'Withdraw failed. Please try again.',
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
    withdraw,
    loading,
    currentStep,
    error,
    resetState,
  };
}
