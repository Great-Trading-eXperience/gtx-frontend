import { useEffect, useState } from 'react';
import {
    PoolItem as GraphQLPoolItem,
    PoolsPonderResponse,
    PoolsResponse
} from '@/graphql/gtx/clob';
import { ProcessedPoolItem } from '@/types/gtx/clob';

interface UsePoolSelectionProps {
  poolsData: PoolsResponse | PoolsPonderResponse | undefined;
  pathname: string | null;
  selectedPoolId: string | null;
  setSelectedPoolId: (id: string) => void;
  setBaseDecimals: (decimals: number) => void;
  setQuoteDecimals: (decimals: number) => void;
  mounted: boolean;
}

export const usePoolSelection = ({
  poolsData,
  pathname,
  selectedPoolId,
  setSelectedPoolId,
  setBaseDecimals,
  setQuoteDecimals,
  mounted
}: UsePoolSelectionProps) => {
  const [selectedPool, setSelectedPool] = useState<ProcessedPoolItem>();
  const [symbol, setSymbol] = useState<string>('');

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

  useEffect(() => {
    if (!mounted || !poolsData) return;

    const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
    const processedPools = pools.map(processPool);

    // Extract pool ID from URL
    const urlParts = pathname?.split('/') || [];
    const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;

    // Find selected pool
    let selectedPoolItem = processedPools.find(p => p.id === (poolIdFromUrl || selectedPoolId));

    // Fallback to default pool
    if (!selectedPoolItem) {
      selectedPoolItem = processedPools.find(p => 
        p.coin?.toLowerCase() === 'weth/usdc' ||
        (p.baseSymbol?.toLowerCase() === 'weth' && p.quoteSymbol?.toLowerCase() === 'usdc')
      ) || processedPools[0];
    }

    if (selectedPoolItem) {
      setSelectedPoolId(selectedPoolItem.id);
      setSelectedPool(selectedPoolItem);
      setSymbol(selectedPoolItem.coin);
      setBaseDecimals(selectedPoolItem.baseDecimals ?? 18);
      setQuoteDecimals(selectedPoolItem.quoteDecimals ?? 6);
    }
  }, [mounted, poolsData, pathname, selectedPoolId]);

  return { selectedPool, symbol };
};