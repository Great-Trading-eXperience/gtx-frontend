'use client';

import { TradeItem } from '@/graphql/gtx/clob';
import { formatNumber } from '@/lib/utils';
import { Pool, useMarketStore } from '@/store/market-store';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { ClobDexComponentProps } from '../clob-dex';
import { PairDropdown } from './pair-dropdown';

const SkeletonLoader = () => (
  <div className="w-full h-16 bg-gray-100 dark:bg-[#1B2028] rounded-t-lg animate-pulse flex items-center px-4 space-x-8">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded w-32" />
    ))}
  </div>
);

export interface MarketDataWidgetProps extends ClobDexComponentProps {
  poolId: string | null;
  selectedPool?: ProcessedPoolItem;
  tradesData: TradeItem[];
  tradesLoading: boolean;
}

export default function MarketDataWidget({
  selectedPool,
  tradesData,
  tradesLoading,
}: MarketDataWidgetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [lastPathname, setLastPathname] = useState<string | null>(null);

  const {
    selectedPoolId,
    marketData,
    quoteDecimals,
    baseDecimals,
    setSelectedPoolId,
    setSelectedPool,
    setMarketData,
    syncWithUrl,
    getUrlFromPool,
    setBaseDecimals,
    setQuoteDecimals,
  } = useMarketStore();

  const poolsWithDecimals = useMemo<Pool[]>(() => {
    if (!selectedPool) return [];
    return [selectedPool];
  }, [selectedPool]);

  useEffect(() => {
    if (pathname !== lastPathname) {
      setLastPathname(pathname);

      if (poolsWithDecimals.length > 0) {
        const urlParts = pathname?.split('/') || [];
        if (urlParts.length >= 3) {
          const poolIdFromUrl = urlParts[2];
          const poolExists = poolsWithDecimals.some(pool => pool.id === poolIdFromUrl);

          if (poolExists && poolIdFromUrl !== selectedPoolId) {
            setSelectedPoolId(poolIdFromUrl);
            const poolObject = poolsWithDecimals.find(pool => pool.id === poolIdFromUrl);
            if (poolObject) {
              setSelectedPool(poolObject);
              setBaseDecimals(baseDecimals);
              setQuoteDecimals(quoteDecimals);
            }
          }
        }
      }
    }
  }, [
    pathname,
    lastPathname,
    poolsWithDecimals,
    baseDecimals,
    quoteDecimals,
    selectedPoolId,
    setSelectedPoolId,
    setSelectedPool,
    setBaseDecimals,
    setQuoteDecimals,
  ]);

  useEffect(() => {
    if (poolsWithDecimals.length > 0) {
      const poolId = syncWithUrl(pathname, poolsWithDecimals);
      if (poolId) {
        const pool = poolsWithDecimals.find(p => p.id === poolId);
        if (pool) {
          setSelectedPool(pool);
          setBaseDecimals(baseDecimals);
          setQuoteDecimals(quoteDecimals);
        }
      }
    }
  }, [
    pathname,
    poolsWithDecimals,
    baseDecimals,
    quoteDecimals,
    syncWithUrl,
    setSelectedPool,
    setBaseDecimals,
    setQuoteDecimals,
  ]);

  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId);

    if (poolsWithDecimals) {
      const selectedPoolObject = poolsWithDecimals.find(pool => pool.id === poolId);
      if (selectedPoolObject) {
        setSelectedPool(selectedPoolObject);
        setBaseDecimals(baseDecimals);
        setQuoteDecimals(quoteDecimals);
      }
    }

    router.push(getUrlFromPool(poolId));
  };

  useEffect(() => {
    if (!tradesData || tradesData.length === 0 || !selectedPoolId) return;

    const sortedItems = [...tradesData].sort((a, b) => b.timestamp - a.timestamp);

    const currentTrade = sortedItems[0];
    const currentPrice = Number(currentTrade.price);

    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const prevDayTrade =
      sortedItems.find(trade => trade.timestamp <= twentyFourHoursAgo) ||
      sortedItems[sortedItems.length - 1];

    const prevDayPrice = Number(prevDayTrade.price);
    const priceChange = currentPrice - prevDayPrice;
    const priceChangePercent = (priceChange / prevDayPrice) * 100;

    let high24h = 0;
    let low24h = Number.MAX_VALUE;

    const trades24h = sortedItems.filter(trade => trade.timestamp >= twentyFourHoursAgo);

    if (trades24h.length > 0) {
      trades24h.forEach(trade => {
        const price = Number(trade.price);
        if (price > high24h) high24h = price;
        if (price < low24h) low24h = price;
      });
    } else {
      high24h = currentPrice;
      low24h = currentPrice;
    }

    const totalVolume = sortedItems.reduce((sum, trade) => {
      if (trade.timestamp >= twentyFourHoursAgo) {
        return (
          sum +
          (BigInt(trade.quantity) * BigInt(trade.price)) / BigInt(10 ** baseDecimals)
        );
      }
      return sum;
    }, BigInt(0));

    const pair =
      poolsWithDecimals.find(pool => pool.id === selectedPoolId)?.coin || 'Unknown Pair';

    setMarketData({
      price: currentPrice,
      priceChange24h: priceChange,
      priceChangePercent24h: priceChangePercent,
      high24h: high24h,
      low24h: low24h,
      volume: totalVolume,
      pair: pair,
    });
  }, [tradesData, selectedPoolId, poolsWithDecimals, setMarketData]);

  if (tradesLoading) return <SkeletonLoader />;

  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-t-lg shadow-md">
      {/* Market data display with integrated selector */}
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-2 w-72">
          <div className="flex flex-col">
            {/* Integrated trading pair selector using shadcn/ui */}
            <div className="flex items-center gap-2">
              {poolsWithDecimals.length > 0 ? (
                <div className="flex items-center gap-2">
                  <PairDropdown
                    pairs={poolsWithDecimals}
                    selectedPairId={selectedPoolId || ''}
                    onPairSelect={handlePoolChange}
                  />
                  <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">
                    Spot
                  </span>
                </div>
              ) : (
                <div className="h-9 w-[180px] bg-gray-800/50 animate-pulse rounded"></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 justify-center">
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className="font-semibold text-[15px] pb-1 underline">Price</div>
            <div className="text-gray-900 dark:text-white">
              ${formatNumber(formatUnits(BigInt(marketData.price ?? 0), quoteDecimals))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className="font-semibold text-[15px] pb-1">24h High</div>
            <div className="text-green-600 dark:text-[#5BBB6F]">
              ${formatNumber(formatUnits(BigInt(marketData.high24h ?? 0), quoteDecimals))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className="font-semibold text-[15px] pb-1">24h Low</div>
            <div className="text-red-600 dark:text-[#FF6978]">
              ${formatNumber(formatUnits(BigInt(marketData.low24h ?? 0), quoteDecimals))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className="font-semibold text-[15px] pb-1">24h Volume</div>
            <div className="text-gray-900 dark:text-white">
              ${formatNumber(formatUnits(BigInt(marketData.volume ?? 0), quoteDecimals))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
