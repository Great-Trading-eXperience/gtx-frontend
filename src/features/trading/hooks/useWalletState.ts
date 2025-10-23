import { useWallets } from '@privy-io/react-auth';

export function useWalletState() {
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const externalWallet = wallets.find(w => w.walletClientType !== 'privy');

  const parseChainId = (chainId: string | undefined): number | undefined => {
    if (!chainId) return undefined;
    return parseInt(chainId.replace('eip155:', ''));
  };

  // maybe in here need a chain validator, embedded in core, and external on side

  return {
    embeddedWallet,
    externalWallet,
    embeddedAddress: embeddedWallet?.address || 'Not Created',
    externalAddress: externalWallet?.address || 'Not Connected',
    embeddedChainId: parseChainId(embeddedWallet?.chainId) || 31337,
    externalChainId: parseChainId(externalWallet?.chainId) || 31338,
  };
}
