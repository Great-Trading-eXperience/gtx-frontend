import ERC20ABI from '@/abis/tokens/TokenABI';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

interface UseTokenBalanceResult {
  formattedBalance: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetchBalance: () => void;
}

export const useTokenBalance = (
  tokenAddress: `0x${string}` | undefined,
  walletAddress: `0x${string}` | undefined,
  chainId?: number
): UseTokenBalanceResult => {
  const {
    data: decimals,
    isLoading: isLoadingDecimals,
    isError: isErrorDecimals,
    error: errorDecimals,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'decimals',
    chainId,
    query: {
      enabled: !!(tokenAddress && walletAddress),
    }
  });

  const {
    data: rawBalance,
    isLoading: isLoadingBalance,
    isError: isErrorBalance,
    error: errorBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    chainId,
    query: {
      enabled: !!(tokenAddress && walletAddress),
    }
  });

  const { data: tokenNameData } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'name',
    chainId,
    query: {
      enabled: !!(tokenAddress && walletAddress),
    }
  });

  const { data: tokenSymbolData } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'symbol',
    chainId,
    query: {
      enabled: !!(tokenAddress && walletAddress),
    }
  });

  const isLoading = isLoadingDecimals || isLoadingBalance;

  let combinedError: Error | null = null;
  if (isErrorDecimals) {
    combinedError = errorDecimals;
  } else if (isErrorBalance) {
    combinedError = errorBalance;
  }

  const isError = isErrorDecimals || isErrorBalance;

  let formattedBalance: string | null = null;
  if (!isLoading && !isError && rawBalance !== null && rawBalance !== undefined && typeof decimals === 'number') {
    try {
      formattedBalance = formatUnits(rawBalance as bigint, decimals);
    } catch (e) {
      console.error("Error formatting balance:", e);
      formattedBalance = 'Formatting Error';
      if (!combinedError) {
        combinedError = e instanceof Error ? e : new Error("Failed to format balance.");
      }
    }
  }

  return {
    formattedBalance,
    tokenName: (tokenNameData as string) || null,
    tokenSymbol: (tokenSymbolData as string) || null,
    isLoading,
    isError,
    error: combinedError,
    refetchBalance,
  };
};