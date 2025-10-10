import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

// BalanceManager ABI - only the getBalance function we need
const BALANCE_MANAGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "Currency",
        "name": "currency",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface UseBalanceManagerBalanceResult {
  formattedBalance: string | null;
  rawBalance: bigint | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useBalanceManagerBalance = (
  userAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  chainId: number,
  decimals: number = 18,
  enabled: boolean = true
): UseBalanceManagerBalanceResult => {
  const balanceManagerAddress = getContractAddress(chainId, ContractName.clobBalanceManager) as `0x${string}`;

  const {
    data: rawBalance,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: balanceManagerAddress,
    abi: BALANCE_MANAGER_ABI,
    functionName: 'getBalance',
    args: userAddress && tokenAddress ? [userAddress, tokenAddress] : undefined,
    chainId,
    query: {
      enabled: enabled && !!(userAddress && tokenAddress && balanceManagerAddress),
    }
  });

  let formattedBalance: string | null = null;
  if (!isLoading && !isError && rawBalance !== null && rawBalance !== undefined) {
    try {
      formattedBalance = formatUnits(rawBalance as bigint, decimals);
    } catch (e) {
      console.error("Error formatting BalanceManager balance:", e);
      formattedBalance = 'Formatting Error';
    }
  }

  return {
    formattedBalance,
    rawBalance: rawBalance as bigint | null,
    isLoading,
    isError,
    error,
    refetch,
  };
};