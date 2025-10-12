export class ChainManager {
  private static CHAIN_CONFIGS: Record<number, { name: string; rpc: string }> = {
    4661: { name: 'Appchain', rpc: 'https://appchain.caff.testnet.espresso.network' },
    421614: { name: 'Arbitrum', rpc: 'https://testnet.riselabs.xyz' },
    1918988905: { name: 'Rari', rpc: 'https://testnet.rpc.rarichain.org/http' },
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
    return [4661, 421614].includes(chainId);
  }
}
