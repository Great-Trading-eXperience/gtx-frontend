import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { useState } from 'react';

/*
export function usePrivyDeposit() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const RISE_CHAIN_ID = 11155931;

  const deposit = async (amount: string) => {
    try {
      setLoading(true);

      // Add more defensive checks
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available');
      }

      console.log('Available wallets:', wallets);

      const external = wallets.find(
        w => {
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
        }
      );

      const embedded = wallets.find(
        w => {
          return (
            w &&
            w.walletClientType === 'privy' &&
            w.chainId &&
            typeof w.chainId === 'string' &&
            w.chainId.startsWith('eip155:11155931') &&
            w.address &&
            typeof w.address === 'string' &&
            w.address.startsWith('0x')
          );
        }
      );

      console.log('External wallet:', external);
      console.log('Embedded wallet:', embedded);

      if (!external) {
        throw new Error('External wallet not found or not properly configured');
      }

      if (!embedded || !embedded.address) {
        throw new Error('Embedded wallet not found or missing address');
      }

      // Additional validation
      if (!external.getEthereumProvider) {
        throw new Error('External wallet does not support getEthereumProvider');
      }

      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));
      const data = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [embedded.address, units],
      });

      const provider = await external.getEthereumProvider();
      
      if (!provider) {
        throw new Error('Failed to get Ethereum provider from external wallet');
      }

      console.log('Provider obtained:', provider);

      // Check if provider has request method
      if (!provider.request || typeof provider.request !== 'function') {
        throw new Error('Provider does not have request method');
      }

      // Switch chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${RISE_CHAIN_ID.toString(16)}` }],
      });

      // Send transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: external.address, // Add from address
            to: '0xa652aede05d70c1aff00249ac05a9d021f9d30c2',
            value: '0x0',
            data,
          },
        ],
      });

      console.log('Transaction sent:', txHash);
      return txHash;

    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { deposit, loading };
}
*/
export function usePrivyDeposit() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const RISE_CHAIN_ID = 11155931;

  const deposit = async (amount: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('Initializing deposit...');

      // Add more defensive checks
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available');
      }

      setCurrentStep('Searching for wallets...');
      console.log('Available wallets:', wallets);

      const external = wallets.find(
        w => {
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
        }
      );

      const embedded = wallets.find(
        w => {
          return (
            w &&
            w.walletClientType === 'privy' &&
            w.chainId &&
            typeof w.chainId === 'string' &&
            w.chainId.startsWith('eip155:11155931') &&
            w.address &&
            typeof w.address === 'string' &&
            w.address.startsWith('0x')
          );
        }
      );

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

      const units = BigInt(Math.floor(Number(amount) * 10 ** 6));
      const data = encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [embedded.address, units],
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
            to: '0xa652aede05d70c1aff00249ac05a9d021f9d30c2',
            value: '0x0',
            data,
          },
        ],
      });

      setCurrentStep('Transaction submitted successfully!');
      console.log('Transaction sent:', txHash);
      
      // Reset after a short delay
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);

      return txHash;

    } catch (error) {
      console.error('Deposit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
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
    resetState 
  };
}