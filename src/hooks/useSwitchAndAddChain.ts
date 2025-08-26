import { useSwitchChain, useChainId } from 'wagmi';
import { Chain } from 'viem';

export const useSwitchAndAddChain = () => {
  //   const { chain } = useNetwork();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const switchAndAddChain = async (targetChain: Chain) => {
    // Check if the wallet is already connected to the target chain
    if (chainId === targetChain.id) {
      return { success: true, message: `Already connected to ${targetChain.name}` };
    }

    try {
      // Attempt to switch to the chain if it's already configured in the wallet
      await switchChainAsync({ chainId: targetChain.id });
      return { success: true, message: `Switched to ${targetChain.name} successfully` };
    } catch (error: any) {
      // If the chain is not found (error.code === 4902), try to add it
      if (error.code === 4902 && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChain.id.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: targetChain.rpcUrls.default.http,
                blockExplorerUrls: [targetChain.blockExplorers?.default.url],
              },
            ],
          });
          return {
            success: true,
            message: `${targetChain.name} added and switched successfully`,
          };
        } catch (addError: any) {
          if (addError.code === 4001) {
            throw new Error('User rejected the request');
          }
          throw new Error(`Failed to add chain: ${addError.message}`);
        }
      } else {
        // Handle other types of errors
        throw new Error(`Failed to switch chain: ${error.message}`);
      }
    }
  };

  return { switchAndAddChain };
};
