'use client';

import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';
import DataTable from './datatable';

export default function MarketList() {
  const [showWatchlist, setShowWatchlist] = useState(false);
  
  const { marketData, marketDataLoading, marketDataHasError, marketDataError } =
  useMarkets();
  
  const handleRowClick = (poolId: string) => {
    console.log(`Navigating to spot trading for pool: ${poolId}`);
    window.location.href = `/trading/${poolId}`
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <div className="px-6 py-12 mx-auto bg-black max-w-7xl">
        <div className="flex flex-col gap-8 relative z-10">
          <h2 className="text-white text-4xl font-bold tracking-tight text-start">
            Market Overview
            <br />
            <span className="text-white/70 text-base font-normal mt-2 block">
              Explore the latest market data and trading activity across all supported
              tokens.
            </span>
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-black/60 border border-white/20 p-1 rounded-xl w-fit">
            <button
              onClick={() => setShowWatchlist(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showWatchlist
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              All Markets
            </button>
            <button
              onClick={() => setShowWatchlist(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showWatchlist
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Watchlist
            </button>
          </div>

          {/* Market Table */}
          <DataTable
            data={marketData}
            onRowClick={handleRowClick}
            showWatchlist={showWatchlist}
            loading={marketDataLoading}
          />
        </div>
      </div>
    </div>
  );
}
