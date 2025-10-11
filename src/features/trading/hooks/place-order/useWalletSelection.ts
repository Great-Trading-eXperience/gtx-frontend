import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { isFeatureEnabled } from '@/constants/features/features-config';
import type { HexAddress } from '@/types/general/address';

export type WalletType = 'external' | 'embedded' | 'none';

export interface WalletSelection {
  walletType: WalletType;
  address: HexAddress | undefined;
  chainId: number;
  isConnected: boolean;
  useEmbeddedWallet: boolean;
}

interface UseWalletSelectionProps {
  privyAddress?: HexAddress;
  chainId?: number;
  defaultChainId: number;
  walletPreference?: 'external' | 'embedded';
}

export function useWalletSelection({
  privyAddress,
  chainId,
  defaultChainId,
  walletPreference = 'embedded',
}: UseWalletSelectionProps): WalletSelection {
  const { isConnected, address: wagmiAddress } = useAccount();
  const { isFullyAuthenticated } = usePrivyAuth();
  const wagmiChainId = useChainId();

  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  const currentChainId = chainId || wagmiChainId || defaultChainId;

  const selection = useMemo(() => {
    const effectiveIsConnected = isConnected || isFullyAuthenticated;

    let walletType: WalletType = 'none';
    let address: HexAddress | undefined;

    if (
      crosschainEnabled &&
      walletPreference === 'external' &&
      isConnected &&
      wagmiAddress
    ) {
      walletType = 'external';
      address = wagmiAddress;
    } else if (
      crosschainEnabled &&
      walletPreference === 'embedded' &&
      isFullyAuthenticated &&
      privyAddress
    ) {
      walletType = 'embedded';
      address = privyAddress;
    } else if (!crosschainEnabled && isFullyAuthenticated && privyAddress) {
      walletType = 'embedded';
      address = privyAddress;
    } else if (isConnected && wagmiAddress) {
      walletType = 'external';
      address = wagmiAddress;
    }

    return {
      walletType,
      address,
      chainId: currentChainId,
      isConnected: effectiveIsConnected,
      useEmbeddedWallet: walletType === 'embedded',
    };
  }, [
    crosschainEnabled,
    walletPreference,
    isConnected,
    wagmiAddress,
    isFullyAuthenticated,
    privyAddress,
    currentChainId,
  ]);

  return selection;
}
