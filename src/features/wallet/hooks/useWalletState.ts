import { useWallets } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';

export function useWalletState() {
  const { wallets } = useWallets();
  const chainId = useChainId();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const externalWallet = wallets.find(w => w.walletClientType !== 'privy');

  const parseChainId = (chainId: string | undefined): number | undefined => {
    if (!chainId) return undefined;
    return parseInt(chainId.replace('eip155:', ''));
  };

  return {
    embeddedWallet,
    externalWallet,
    embeddedAddress: embeddedWallet?.address || 'Not Created',
    externalAddress: externalWallet?.address || 'Not Connected',
    embeddedChainId: parseChainId(embeddedWallet?.chainId),
    externalChainId: parseChainId(externalWallet?.chainId),
    connectedChainId: chainId,
  };
}
