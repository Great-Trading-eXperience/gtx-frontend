import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useMarketStore } from '@/store/market-store';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { PoolItem as GraphQLPoolItem } from '@/graphql/gtx/clob';
import { PoolsResponse, PoolsPonderResponse } from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';

const processPool = (pool: GraphQLPoolItem): ProcessedPoolItem => {
  const { baseCurrency, quoteCurrency, ...other } = pool;
  return {
    ...other,
    baseTokenAddress: baseCurrency.address,
    quoteTokenAddress: quoteCurrency.address,
    baseSymbol: baseCurrency.symbol,
    quoteSymbol: quoteCurrency.symbol,
    baseDecimals: baseCurrency.decimals,
    quoteDecimals: quoteCurrency.decimals,
  };
};

export const useSelectedPool = (
  poolsData: PoolsResponse | PoolsPonderResponse | undefined
) => {
  const pathname = usePathname();
  const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } =
    useMarketStore();
  const [selectedPool, setSelectedPool] = useState<ProcessedPoolItem>();
  const [symbol, setSymbol] = useState<string>('');

  const processedPools = useMemo(() => {
    if (!poolsData) return [];

    const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
    return pools.map(pool => processPool(pool));
  }, [poolsData]);

  useEffect(() => {
    if (!poolsData || processedPools.length === 0) return;

    const urlParts = pathname?.split('/') || [];
    const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;

    let selectedPoolItem = processedPools.find(
      p => p.id === (poolIdFromUrl || selectedPoolId)
    );

    if (!selectedPoolItem) {
      selectedPoolItem =
        processedPools.find(
          p =>
            p.coin?.toLowerCase() === 'weth/usdc' ||
            p.coin?.toLowerCase() === 'mweth/musdc' ||
            (p.baseSymbol?.toLowerCase() === 'weth' &&
              p.quoteSymbol?.toLowerCase() === 'usdc') ||
            (p.baseSymbol?.toLowerCase() === 'mweth' &&
              p.quoteSymbol?.toLowerCase() === 'musdc')
        ) || processedPools[0];
    }

    if (selectedPoolItem) {
      setSelectedPoolId(selectedPoolItem.id);
      setSelectedPool(selectedPoolItem);
      setSymbol(selectedPoolItem.coin);
      setBaseDecimals(selectedPoolItem.baseDecimals ?? 18);
      setQuoteDecimals(selectedPoolItem.quoteDecimals ?? 6);
    }
  }, [poolsData, processedPools, pathname, selectedPoolId]);

  return { selectedPool, symbol, processedPools };
};
