import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { ChainBalanceManagerABI } from '@/abis/gtx/clob/ChainBalanceManagerABI';
import { useState, useCallback } from 'react';
import { useToast } from '@/components/toastContext';
import { getContractAddress, ContractName } from '@/constants/contract/contract-address';
import {
  isCrosschainSupportedChain,
  getSupportedCrosschainDepositChainNames,
} from '@/constants/features/features-config';
import { ConnectedWallet } from '@privy-io/react-auth';

interface CrosschainDepositParams {
  amount: string;
  tokenAddress: `0x${string}`;
  recipientAddress: `0x${string}`; // Embedded wallet address
  externalWallet: ConnectedWallet; // Privy wallet object
  sourceChainId: number;
  decimals: number;
}

interface CrosschainDepositHookReturn {
  deposit: (params: CrosschainDepositParams) => Promise<string>;
  loading: boolean;
  error: string | null;
  resetState: () => void;
}

export function useCrosschainDeposit(): CrosschainDepositHookReturn {
  const { showToast, updateToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(
    async ({
      amount,
      tokenAddress,
      recipientAddress,
      externalWallet,
      sourceChainId,
      decimals,
    }: CrosschainDepositParams): Promise<string> => {
      const toastId = showToast({
        type: 'loading',
        message: 'Processing crosschain deposit...',
      });

      try {
        setLoading(true);
        setError(null);

        // Validate chain support
        if (!isCrosschainSupportedChain(sourceChainId)) {
          const supportedChains = getSupportedCrosschainDepositChainNames().join(', ');
          throw new Error(`Chain not supported. Please switch to: ${supportedChains}`);
        }

        // Validate wallet
        if (!externalWallet?.getEthereumProvider) {
          throw new Error('External wallet not found or invalid');
        }

        // Get ChainBalanceManager address
        const chainBalanceManagerAddress = getContractAddress(
          sourceChainId,
          ContractName.chainBalanceManager
        );

        if (
          !chainBalanceManagerAddress ||
          chainBalanceManagerAddress === '0x0000000000000000000000000000000000000000'
        ) {
          throw new Error(
            `ChainBalanceManager not configured for chain ${sourceChainId}`
          );
        }

        // Get provider and token decimals
        const provider = await externalWallet.getEthereumProvider();

        if (!provider?.request) {
          throw new Error('Invalid Ethereum provider');
        }

        const units = BigInt(Math.floor(Number(amount) * 10 ** decimals));

        console.log('chain balance manager ', chainBalanceManagerAddress);
        console.log('amount ', units);

        // Prepare transaction data
        const approveData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'approve',
          args: [chainBalanceManagerAddress, units],
        });

        const depositData = encodeFunctionData({
          abi: ChainBalanceManagerABI,
          functionName: 'deposit',
          args: [tokenAddress, units, recipientAddress],
        });

        console.log('token address ', tokenAddress)
        console.log('recipient address ', recipientAddress)

        // Switch to source chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${sourceChainId.toString(16)}` }],
        });

        // Step 1: Approve token spending
        const approveTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: externalWallet.address,
              to: tokenAddress,
              value: '0x0',
              data: approveData,
            },
          ],
        });

        console.log('[CROSSCHAIN] Approve tx:', approveTxHash);

        // Wait for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Execute crosschain deposit
        const depositTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: externalWallet.address,
              to: chainBalanceManagerAddress,
              value: '0x0',
              data: depositData,
            },
          ],
        });

        updateToast(toastId, {
          type: 'success',
          message: 'Crosschain deposit successful! Tokens will arrive shortly.',
        });

        console.log('[CROSSCHAIN] Deposit tx:', depositTxHash);

        return depositTxHash as string;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Crosschain deposit failed';
        setError(errorMessage);

        // Handle specific error types
        const errorStr = err?.toString() || '';
        const isGasError =
          errorStr.includes('insufficient funds') ||
          errorStr.includes('InsufficientFunds') ||
          errorStr.includes('gas required exceeds');

        updateToast(toastId, {
          type: 'error',
          message: isGasError
            ? 'Insufficient gas funds. Please add more native tokens.'
            : errorMessage,
        });

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showToast, updateToast]
  );

  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    deposit,
    loading,
    error,
    resetState,
  };
}
