import { useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { BalanceHookResult, Token } from '../types/wallet.types';
import ERC20ABI from '@/abis/tokens/TokenABI';
import { formatUnits } from 'viem';

const BALANCE_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        internalType: 'Currency',
        name: 'currency',
        type: 'address',
      },
    ],
    name: 'getBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useMultiTokenBalances(
  realTokens: Token[],
  syntheticTokens: Token[],
  embeddedAddress: string,
  externalAddress: string,
  embeddedChainId: number,
  externalChainId: number
  // isCrosschainEnabled: boolean
): BalanceHookResult[] {
  const embeddedBalanceManagerAddress = getContractAddress(
    embeddedChainId,
    ContractName.clobBalanceManager
  ) as `0x${string}`;

  // Prepare real token contracts
  const contractRealTokens = useMemo(() => {
    return realTokens.map(token => ({
      address: token.address as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [externalAddress as `0x${string}`],
      chainId: externalChainId,
    }));
  }, [realTokens, externalAddress, externalChainId]);

  // Prepare synthetic token contracts
  const contractSyntheticTokens = useMemo(() => {
    return syntheticTokens.map(token => ({
      address: embeddedBalanceManagerAddress,
      abi: BALANCE_MANAGER_ABI,
      functionName: 'getBalance',
      args: [embeddedAddress as `0x${string}`, token.address as `0x${string}`],
      chainId: embeddedChainId,
    }));
  }, [syntheticTokens, embeddedAddress, embeddedChainId, embeddedBalanceManagerAddress]);

  // Fetch real token balances
  const {
    data: realTokenData,
    isLoading: realTokenLoading,
    refetch: realTokenRefetch,
  } = useReadContracts({
    contracts: contractRealTokens,
  });

  // Fetch synthetic token balances
  const {
    data: syntheticTokenData,
    isLoading: syntheticTokenLoading,
    refetch: syntheticTokenRefetch,
  } = useReadContracts({
    contracts: contractSyntheticTokens,
  });

  // Process and combine results
  return useMemo(() => {
    // Return empty array while loading
    if (realTokenLoading || syntheticTokenLoading) return [];
    if (!realTokenData || !syntheticTokenData) return [];

    const results: BalanceHookResult[] = [];

    // Process real tokens
    realTokens.forEach((token, index) => {
      const balanceData = realTokenData[index];
      const externalBalance = balanceData?.result
        ? formatUnits(balanceData.result as bigint, token.decimals)
        : '0';

      results.push({
        token,
        tokenBalance: '0', // Real tokens don't have embedded wallet balance
        managerBalance: '0',
        externalBalance,
        externalManagerBalance: externalBalance,
        displayBalance: externalBalance,
        symbol: token.symbol,
        refetch: () => {
          realTokenRefetch();
        },
      });
    });

    // Process synthetic tokens
    syntheticTokens.forEach((token, index) => {
      const balanceData = syntheticTokenData[index];
      const managerBalance = balanceData?.result
        ? formatUnits(balanceData.result as bigint, token.decimals)
        : '0';

      results.push({
        token,
        tokenBalance: managerBalance,
        managerBalance,
        externalBalance: '0',
        externalManagerBalance: '0',
        displayBalance: managerBalance,
        symbol: token.symbol,
        refetch: () => {
          syntheticTokenRefetch();
        },
      });
    });

    return results;
  }, [
    realTokenData,
    syntheticTokenData,
    realTokens,
    syntheticTokens,
    realTokenLoading,
    syntheticTokenLoading,
    realTokenRefetch,
    syntheticTokenRefetch,
  ]);
}
