import { useMemo } from 'react';
import { AccountData } from '@/lib/market-api';
import { PoolsResponse, PoolsPonderResponse } from '@/graphql/gtx/clob';

export const useTransformedBalances = (
  marketAccountData: AccountData | null | undefined,
  poolsData: PoolsResponse | PoolsPonderResponse | undefined
) => {
  return useMemo(() => {
    if (!marketAccountData || !poolsData) return [];

    const currencyMap = new Map<string, { address: string; decimals: number }>();

    const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
    pools.forEach(pool => {
      if (pool.baseCurrency) {
        currencyMap.set(pool.baseCurrency.symbol.toLowerCase(), {
          address: pool.baseCurrency.address,
          decimals: pool.baseCurrency.decimals,
        });
      }
      if (pool.quoteCurrency) {
        currencyMap.set(pool.quoteCurrency.symbol.toLowerCase(), {
          address: pool.quoteCurrency.address,
          decimals: pool.quoteCurrency.decimals,
        });
      }
    });

    return marketAccountData.balances.map(balance => {
      const symbol = balance.asset.toLowerCase();
      const currencyInfo = currencyMap.get(symbol) || { address: '', decimals: 18 };

      return {
        id: symbol,
        currency: {
          address: currencyInfo.address,
          name: balance.asset,
          symbol: balance.asset,
          decimals: currencyInfo.decimals,
        },
        amount: balance.free,
        lockedAmount: balance.locked,
        user: '',
      };
    });
  }, [marketAccountData, poolsData]);
};
