import { encodeFunctionData } from 'viem';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { useState, useCallback } from 'react';
import { useToast } from '@/_components/toastContext';
import { ConnectedWallet, useWallets } from '@privy-io/react-auth';

interface DepositParams {
  amount: string;
  currencyAddress: `0x${string}`;
  embeddedAddress: string;
  externalWallet: ConnectedWallet;
  externalChainId: number;
  decimals: number;
}

interface DepositHookReturn {
  deposit: (params: DepositParams) => Promise<string>;
  loading: boolean;
  error: string | null;
  resetState: () => void;
}

export function usePrivyDeposit(): DepositHookReturn {
  const { wallets } = useWallets();
  const { showToast, updateToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(
    async ({
      amount,
      currencyAddress,
      embeddedAddress,
      externalWallet,
      externalChainId,
      decimals,
    }: DepositParams): Promise<string> => {
      const toastId = showToast({
        type: 'loading',
        message: 'Processing deposit...',
      });

      try {
        setLoading(true);
        setError(null);

        if (!externalWallet?.getEthereumProvider) {
          throw new Error('External wallet not found or invalid');
        }

        // Prepare transaction data
        const units = BigInt(Math.floor(Number(amount) * 10 ** decimals));
        const data = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [embeddedAddress as `0x${string}`, units],
        });

        // Get provider
        const provider = await externalWallet.getEthereumProvider();

        if (!provider?.request) {
          throw new Error('Invalid Ethereum provider');
        }

        // Switch to correct chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${externalChainId.toString(16)}` }],
        });

        // Send transaction
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: externalWallet.address,
              to: currencyAddress,
              value: '0x0',
              data,
            },
          ],
        });

        updateToast(toastId, {
          type: 'success',
          message: 'Deposit successful!',
        });

        return txHash as string;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
        setError(errorMessage);

        updateToast(toastId, {
          type: 'error',
          message: errorMessage,
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
