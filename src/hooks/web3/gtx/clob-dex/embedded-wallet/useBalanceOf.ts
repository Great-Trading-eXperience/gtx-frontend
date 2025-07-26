import ERC20ABI from '@/abis/tokens/TokenABI';
import { parseUnits, formatUnits } from 'viem';
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
  walletAddress: `0x${string}` | undefined
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
    args: [walletAddress as `0x${string}`],
  });

  const { data: tokenNameData } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'name',
  });

  const { data: tokenSymbolData } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'symbol',
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
      formattedBalance = formatUnits(rawBalance, decimals);
    } catch (e) {
      console.error("Error formatting balance:", e);
      formattedBalance = 'Formatting Error';
      // Optionally, set a specific error for formatting issues
      if (!combinedError) {
        combinedError = e instanceof Error ? e : new Error("Failed to format balance.");
      }
    }
  }

  return {
    formattedBalance,
    tokenName: tokenNameData || null,
    tokenSymbol: tokenSymbolData || null,
    isLoading,
    isError,
    error: combinedError,
    refetchBalance,
  };
};