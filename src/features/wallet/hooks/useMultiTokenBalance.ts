/*
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import { useBalanceManagerBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceManagerBalance';
import { BalanceHookResult, Token } from '../types/wallet.types';

export function useMultiTokenBalances(
  tokens: Token[],
  embeddedAddress: string,
  externalAddress: string,
  embeddedChainId: number,
  externalChainId: number,
  isCrosschainEnabled: boolean
): BalanceHookResult[] {
  return tokens.map(token => {
    const sourceAddress = token.sourceAddresses || token.address;

    // Embedded wallet balances
    const tokenBal = useTokenBalance(
      token.address as `0x${string}`,
      embeddedAddress as `0x${string}`,
      embeddedChainId
    );
    const managerBal = useBalanceManagerBalance(
      embeddedAddress as `0x${string}`,
      token.address as `0x${string}`,
      embeddedChainId,
      token.decimals
    );

    // External wallet balances
    const externalBal = useTokenBalance(
      sourceAddress as `0x${string}`,
      externalAddress as `0x${string}`,
      externalChainId
    );
    const externalManagerBal = useBalanceManagerBalance(
      externalAddress as `0x${string}`,
      sourceAddress as `0x${string}`,
      externalChainId,
      token.decimals
    );

    return {
      token,
      tokenBalance: tokenBal.formattedBalance,
      managerBalance: managerBal.formattedBalance,
      externalBalance: externalBal.formattedBalance,
      externalManagerBalance: externalManagerBal.formattedBalance,
      displayBalance: isCrosschainEnabled
        ? managerBal.formattedBalance
        : tokenBal.formattedBalance,
      symbol: tokenBal.tokenSymbol || token.symbol,
      refetch: () => {
        tokenBal.refetchBalance();
        externalBal.refetchBalance();
        managerBal.refetch();
        externalManagerBal.refetch();
      },
    };
  });
}
*/

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
  tokens: Token[],
  embeddedAddress: string,
  externalAddress: string,
  embeddedChainId: number,
  externalChainId: number,
  isCrosschainEnabled: boolean
): BalanceHookResult[] {
  const embeddedBalanceManagerAddress = getContractAddress(
    embeddedChainId,
    ContractName.clobBalanceManager
  ) as `0x${string}`;

  const externalBalanceManagerAddress = getContractAddress(
    externalChainId,
    ContractName.clobBalanceManager
  ) as `0x${string}`;

  console.log(
    embeddedChainId,
    embeddedBalanceManagerAddress,
    externalChainId,
    externalBalanceManagerAddress
  );

  // Build all contract calls at once
  const contracts = useMemo(() => {
    return tokens.flatMap(token => {
      const sourceAddress = token.sourceAddresses || token.address;

      return [
        // Embedded token balance
        {
          address: token.address as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [embeddedAddress as `0x${string}`],
          chainId: embeddedChainId,
        },
        // Embedded manager balance
        {
          address: embeddedBalanceManagerAddress,
          abi: BALANCE_MANAGER_ABI,
          functionName: 'getBalance',
          args: [embeddedAddress as `0x${string}`, token.address as `0x${string}`],
          chainId: embeddedChainId,
        },
        // External token balance
        {
          address: sourceAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [externalAddress as `0x${string}`],
          chainId: externalChainId,
        },
        // External manager balance
        {
          address: externalBalanceManagerAddress,
          abi: BALANCE_MANAGER_ABI,
          functionName: 'getBalance',
          args: [externalAddress as `0x${string}`, sourceAddress as `0x${string}`],
          chainId: externalChainId,
        },
      ];
    });
  }, [tokens, embeddedAddress, externalAddress, embeddedChainId, externalChainId]);

  const { data, isLoading, refetch } = useReadContracts({ contracts });

  console.log('data from contract', data);

  // Process results
  return useMemo(() => {
    if (!data) return [];

    return tokens.map((token, index) => {
      const baseIndex = index * 4;

      const tokenBalance = data[baseIndex]?.result
        ? formatUnits(data[baseIndex].result as bigint, token.decimals)
        : null;
      const managerBalance = data[baseIndex + 1]?.result
        ? formatUnits(data[baseIndex + 1].result as bigint, token.decimals)
        : null;
      const externalBalance = data[baseIndex + 2]?.result
        ? formatUnits(data[baseIndex + 2].result as bigint, token.decimals)
        : null;
      const externalManagerBalance = data[baseIndex + 3]?.result
        ? formatUnits(data[baseIndex + 3].result as bigint, token.decimals)
        : null;

      return {
        token,
        tokenBalance,
        managerBalance,
        externalBalance,
        externalManagerBalance,
        displayBalance: isCrosschainEnabled ? managerBalance : tokenBalance,
        symbol: token.symbol,
        refetch,
      };
    });
  }, [data, tokens, isCrosschainEnabled, refetch]);
}
