import { Asset, BalanceHookResult, PoolItem, Token } from '../types/wallet.types';

export class TokenManager {
  static getUniqueTokens(pools: PoolItem[]): Token[] {
    const tokenMap = new Map<string, Token>();

    pools.forEach(pool => {
      [pool.quoteCurrency, pool.baseCurrency].forEach(token => {
        if (token && !tokenMap.has(token.address)) {
          tokenMap.set(token.address, {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            name: token.name,
          });
        }
      });
    });

    return Array.from(tokenMap.values());
  }

  static createAssets(balances: BalanceHookResult[]): Asset[] {
    return balances.map(balance => ({
      token: {
        address: balance.token.address,
        symbol: balance.token.symbol,
        decimals: balance.token.decimals,
        name: balance.token.name,
      },
      balance: balance.tokenBalance ?? '0',
      displayBalance: balance.displayBalance ?? '0',
      symbol: balance.symbol,
      managerBalance: balance.managerBalance ?? '0',
      externalBalance: balance.externalBalance ?? '0',
      externalManagerBalance: balance.externalManagerBalance ?? '0',
    }));
  }

  static formatTokenForDisplay(token: Token, index: number) {
    const colorMap = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
    ];
    return {
      ...token,
      color: colorMap[index % colorMap.length],
      initial: token.symbol.charAt(0).toUpperCase(),
    };
  }
}
