import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getCoreChain, isFeatureEnabled } from '@/constants/features/features-config';
import { useBalanceManagerBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceManagerBalance';
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import type { HexAddress } from '@/types/general/address';

interface UseTradingBalanceProps {
  address?: HexAddress;
  tokenAddress?: HexAddress;
  chainId: number;
  decimals: number;
  enabled?: boolean;
}

export function useTradingBalance({
  address,
  tokenAddress,
  chainId,
  decimals,
  enabled = true,
}: UseTradingBalanceProps) {
  const queryClient = useQueryClient();
  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  const balanceChainId = crosschainEnabled ? getCoreChain() : chainId;

  const enableBalanceManager = enabled && crosschainEnabled;
  const enableTokenBalance = enabled && !crosschainEnabled;

  // Only call the hook we need based on crosschain setting
  const balanceManagerBalance = useBalanceManagerBalance(
    address as `0x${string}`,
    tokenAddress,
    balanceChainId,
    decimals,
    enableBalanceManager
  );

  const tokenBalance = useTokenBalance(
    tokenAddress,
    address as `0x${string}`,
    chainId,
    enableTokenBalance
  );

  const activeBalance = crosschainEnabled ? balanceManagerBalance : tokenBalance;

  const refresh = useCallback(async () => {
    if (crosschainEnabled) {
      await balanceManagerBalance.refetch();
    } else {
      await tokenBalance.refetchBalance();
    }

    // Invalidate related queries
    queryClient.invalidateQueries({
      queryKey: ['trading-balance', address, tokenAddress, chainId],
    });
  }, [
    crosschainEnabled,
    balanceManagerBalance,
    tokenBalance,
    queryClient,
    address,
    tokenAddress,
    chainId,
  ]);

  return {
    balance: activeBalance.formattedBalance,
    isLoading: activeBalance.isLoading,
    error: activeBalance.error,
    refresh,
    chainId: balanceChainId,
  };
}
