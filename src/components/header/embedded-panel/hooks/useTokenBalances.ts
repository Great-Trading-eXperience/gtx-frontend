import { useBalanceManagerBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceManagerBalance';
import { useTokenBalance } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalanceOf';
import { FEATURE_FLAGS } from '@/constants/features/features-config';
import { HexAddress } from '@/types/gtx/clob';

interface Token {
  address: HexAddress;
  symbol: string;
  decimals: number;
  isQuote: boolean;
}

interface UseTokenBalancesProps {
  tokens: Token[];
  embeddedWalletAddress: string;
  externalWalletAddress: string;
  embeddedWalletChainId: number;
  chainId: number;
  balanceDisplayChainId: number;
  isOpen: boolean;
}

export const useTokenBalances = ({
  tokens,
  embeddedWalletAddress,
  externalWalletAddress,
  embeddedWalletChainId,
  chainId,
  balanceDisplayChainId,
  isOpen
}: UseTokenBalancesProps) => {
  // Get up to 5 tokens for balance hooks (to respect React hooks rules)
  const token0 = tokens[0];
  const token1 = tokens[1];
  const token2 = tokens[2];
  const token3 = tokens[3];
  const token4 = tokens[4];

  // Create hooks for token 0 (GTX wallet balances)
  const token0Balance = useTokenBalance(
    token0?.address,
    embeddedWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId,
    isOpen
  );
  const token0BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token0?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token0?.decimals || 18,
    isOpen
  );
  
  // Create hooks for token 0 (External wallet balances)
  const token0SourceAddress = (token0 as any)?.sourceAddresses?.[chainId] || token0?.address;
  const token0ExternalBalance = useTokenBalance(
    token0SourceAddress,
    externalWalletAddress as `0x${string}`,
    chainId || balanceDisplayChainId,
    isOpen
  );
  
  const token0ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    token0SourceAddress,
    chainId || balanceDisplayChainId,
    token0?.decimals || 18,
    isOpen
  );

  // Similar pattern for tokens 1-4 (abbreviated for brevity)
  const token1Balance = useTokenBalance(
    token1?.address,
    embeddedWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId,
    isOpen
  );
  const token1BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token1?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token1?.decimals || 18,
    isOpen
  );
  
  const token1SourceAddress = (token1 as any)?.sourceAddresses?.[chainId] || token1?.address;
  const token1ExternalBalance = useTokenBalance(
    token1SourceAddress,
    externalWalletAddress as `0x${string}`,
    chainId || balanceDisplayChainId,
    isOpen
  );
  
  const token1ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    token1SourceAddress,
    chainId || balanceDisplayChainId,
    token1?.decimals || 18,
    isOpen
  );

  // Continue pattern for tokens 2-4...
  const token2Balance = useTokenBalance(
    token2?.address,
    embeddedWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId,
    isOpen
  );
  const token2BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token2?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token2?.decimals || 18,
    isOpen
  );
  
  const token2SourceAddress = (token2 as any)?.sourceAddresses?.[chainId] || token2?.address;
  const token2ExternalBalance = useTokenBalance(
    token2SourceAddress,
    externalWalletAddress as `0x${string}`,
    chainId || balanceDisplayChainId,
    isOpen
  );
  
  const token2ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    token2SourceAddress,
    chainId || balanceDisplayChainId,
    token2?.decimals || 18,
    isOpen
  );

  const token3Balance = useTokenBalance(
    token3?.address,
    embeddedWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId,
    isOpen
  );
  const token3BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token3?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token3?.decimals || 18,
    isOpen
  );
  
  const token3SourceAddress = (token3 as any)?.sourceAddresses?.[chainId] || token3?.address;
  const token3ExternalBalance = useTokenBalance(
    token3SourceAddress,
    externalWalletAddress as `0x${string}`,
    chainId || balanceDisplayChainId,
    isOpen
  );
  
  const token3ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    token3SourceAddress,
    chainId || balanceDisplayChainId,
    token3?.decimals || 18,
    isOpen
  );

  const token4Balance = useTokenBalance(
    token4?.address,
    embeddedWalletAddress as `0x${string}`,
    embeddedWalletChainId || balanceDisplayChainId,
    isOpen
  );
  const token4BalanceManager = useBalanceManagerBalance(
    embeddedWalletAddress as `0x${string}`,
    token4?.address,
    embeddedWalletChainId || balanceDisplayChainId,
    token4?.decimals || 18,
    isOpen
  );
  
  const token4SourceAddress = (token4 as any)?.sourceAddresses?.[chainId] || token4?.address;
  const token4ExternalBalance = useTokenBalance(
    token4SourceAddress,
    externalWalletAddress as `0x${string}`,
    chainId || balanceDisplayChainId,
    isOpen
  );
  
  const token4ExternalBalanceManager = useBalanceManagerBalance(
    externalWalletAddress as `0x${string}`,
    token4SourceAddress,
    chainId || balanceDisplayChainId,
    token4?.decimals || 18,
    isOpen
  );

  // Aggregate token balances
  const tokenBalances = [
    token0 && {
      token: token0,
      tokenBalance: token0Balance.formattedBalance,
      balanceManagerBalance: token0BalanceManager.formattedBalance,
      externalBalance: token0ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token0ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token0BalanceManager.formattedBalance 
        : token0Balance.formattedBalance,
      symbol: token0Balance.tokenSymbol || token0.symbol,
      refetch: () => {
        token0Balance.refetchBalance();
        token0ExternalBalance.refetchBalance();
        token0ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token0BalanceManager.refetch();
        }
      }
    },
    token1 && {
      token: token1,
      tokenBalance: token1Balance.formattedBalance,
      balanceManagerBalance: token1BalanceManager.formattedBalance,
      externalBalance: token1ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token1ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token1BalanceManager.formattedBalance 
        : token1Balance.formattedBalance,
      symbol: token1Balance.tokenSymbol || token1.symbol,
      refetch: () => {
        token1Balance.refetchBalance();
        token1ExternalBalance.refetchBalance();
        token1ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token1BalanceManager.refetch();
        }
      }
    },
    token2 && {
      token: token2,
      tokenBalance: token2Balance.formattedBalance,
      balanceManagerBalance: token2BalanceManager.formattedBalance,
      externalBalance: token2ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token2ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token2BalanceManager.formattedBalance 
        : token2Balance.formattedBalance,
      symbol: token2Balance.tokenSymbol || token2.symbol,
      refetch: () => {
        token2Balance.refetchBalance();
        token2ExternalBalance.refetchBalance();
        token2ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token2BalanceManager.refetch();
        }
      }
    },
    token3 && {
      token: token3,
      tokenBalance: token3Balance.formattedBalance,
      balanceManagerBalance: token3BalanceManager.formattedBalance,
      externalBalance: token3ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token3ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token3BalanceManager.formattedBalance 
        : token3Balance.formattedBalance,
      symbol: token3Balance.tokenSymbol || token3.symbol,
      refetch: () => {
        token3Balance.refetchBalance();
        token3ExternalBalance.refetchBalance();
        token3ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token3BalanceManager.refetch();
        }
      }
    },
    token4 && {
      token: token4,
      tokenBalance: token4Balance.formattedBalance,
      balanceManagerBalance: token4BalanceManager.formattedBalance,
      externalBalance: token4ExternalBalance.formattedBalance,
      externalBalanceManagerBalance: token4ExternalBalanceManager.formattedBalance,
      displayBalance: FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED 
        ? token4BalanceManager.formattedBalance 
        : token4Balance.formattedBalance,
      symbol: token4Balance.tokenSymbol || token4.symbol,
      refetch: () => {
        token4Balance.refetchBalance();
        token4ExternalBalance.refetchBalance();
        token4ExternalBalanceManager.refetch();
        if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
          token4BalanceManager.refetch();
        }
      }
    }
  ].filter(Boolean); // Remove null entries

  // Unified refetch function for all balances
  const refetchAllBalances = () => {
    tokenBalances.forEach(tb => tb.refetch());
  };

  return {
    tokenBalances,
    refetchAllBalances
  };
};