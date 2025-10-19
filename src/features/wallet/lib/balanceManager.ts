export class ChainManager {
  private static CHAIN_CONFIGS: Record<number, { name: string; rpc: string }> = {
    31337: { name: 'Core Devnet', rpc: '/core-devnet' },
    31338: { name: 'Side Devnet', rpc: '/side-devnet' },
  };

  static getChainName(chainId: number): string {
    return this.CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`;
  }

  static async switchChain(wallet: any, targetChainId: number): Promise<void> {
    if (!wallet) throw new Error('Wallet not found');

    try {
      await wallet.switchChain(targetChainId);
    } catch (error: any) {
      // If chain doesn't exist, add it first
      if (error.code === 4902 || error.message?.includes('Unrecognized')) {
        await this.addChain(wallet, targetChainId);
        await wallet.switchChain(targetChainId);
      } else {
        throw error;
      }
    }
  }

  private static async addChain(wallet: any, chainId: number): Promise<void> {
    const config = this.CHAIN_CONFIGS[chainId];
    if (!config) throw new Error(`Chain ${chainId} not configured`);

    const provider = await wallet.getEthereumProvider();
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: [config.rpc],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        },
      ],
    });
  }

  static isCrosschainSupported(chainId: number): boolean {
    return [31337, 31338].includes(chainId);
  }
}
