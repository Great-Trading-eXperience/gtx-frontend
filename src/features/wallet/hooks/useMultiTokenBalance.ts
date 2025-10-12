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
    const sourceAddress = token.sourceAddresses?.[externalChainId] || token.address;

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
