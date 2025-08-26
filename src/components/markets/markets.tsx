import { Input } from '@/components/ui/input';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  poolsPonderQuery,
  PoolsPonderResponse,
  poolsQuery,
  PoolsResponse,
} from '@/graphql/gtx/clob';
import {
  MarketData,
  processPools
} from '@/lib/market-data';
import { getUseSubgraph } from '@/utils/env';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { CheckCircle, Clock, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { DotPattern } from '../magicui/dot-pattern';
import { MarketListSkeleton } from './market-list-skeleton';
import MarketSearchDialog from './market-search-dialog';

interface MarketListProps {
  initialMarketData?: MarketData[];
}

export default function MarketList({ initialMarketData = [] }: MarketListProps) {
  const router = useRouter();
  const [markets, setMarkets] = useState<MarketData[]>(initialMarketData);
  const [isLoading, setIsLoading] = useState(true); // Always start with loading true
  const [isProcessingPools, setIsProcessingPools] = useState(
    initialMarketData.length === 0
  );
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  
  const POOLS_PER_PAGE = 20;

  const chainId = useChainId();
  const defaultChain = Number(DEFAULT_CHAIN);

  // Use useEffect for timer to prevent running on every render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  // If initialMarketData is provided, we can skip the initial loading state
  const shouldFetchData = initialMarketData.length === 0;

  // Fetch pools data with pagination and better error handling
  const { data: poolsData, error: poolsError, isLoading: isQueryLoading } = useQuery<
    PoolsPonderResponse | PoolsResponse
  >({
    queryKey: ['pools', String(chainId ?? defaultChain), 'paginated'],
    queryFn: async () => {
      console.log('[RPC-DEBUG] 📊 Markets - Fetching pools data');
      const currentChainId = Number(chainId ?? defaultChain);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      
      // Fetch limited data for initial fast loading
      if (getUseSubgraph()) {
        const limitedQuery = poolsPonderQuery.replace('query GetPools', 'query GetPools($limit: Int)').replace('items {', 'limit: $limit\n      items {');
        return await request(url, limitedQuery, { limit: POOLS_PER_PAGE });
      } else {
        return await request(url, poolsQuery);
      }
    },
    refetchInterval: 60000,
    staleTime: 120000,
    enabled: shouldFetchData,
    retry: (failureCount, error) => {
      console.log(`[RPC-DEBUG] 📊 Markets query retry ${failureCount + 1}:`, error?.message);
      
      // Don't retry on 429 or timeout errors
      if (error?.message?.includes('429') || error?.message?.includes('timeout')) {
        console.log('[RPC-DEBUG] 🚫 Markets - Not retrying due to rate limit/timeout');
        return false;
      }
      
      return failureCount < 1; // Only 1 retry
    },
    retryDelay: 2000, // 2 second delay between retries
  });

  // Process data in useEffect to prevent render loops
  useEffect(() => {
    if (poolsData && markets.length === 0) {
      console.log('[RPC-DEBUG] 📊 Processing pools data in useEffect');
      processPools(poolsData).then(pools => {
        const limitedPools = getUseSubgraph() ? pools : pools.slice(0, POOLS_PER_PAGE);
        
        if (limitedPools.length > 0) {
          // Create market data directly
          const marketData = limitedPools.map(pool => {
            return {
              id: pool.id,
              name: pool.baseSymbol,
              pair: pool.quoteSymbol,
              starred: false,
              iconInfo: { hasImage: false, imagePath: null, bg: '#000000' },
              age: new Date(pool.timestamp * 1000).toLocaleDateString(),
              timestamp: pool.timestamp,
              price: '0.00', // Will be updated with real data
              volume: pool.volume || '0',
              liquidity: pool.maxOrderAmount || '0',
            };
          });
          
          setMarkets(marketData);
        }
        setIsProcessingPools(false);
      }).catch(error => {
        console.error('Error processing pools:', error);
        setIsProcessingPools(false);
      });
    }
  }, [poolsData, markets.length, getUseSubgraph, POOLS_PER_PAGE]); // Dependencies

  // Handle errors in useEffect
  useEffect(() => {
    if (poolsError) {
      console.error('[RPC-DEBUG] ❌ Error fetching pools:', poolsError);
      if (isProcessingPools) {
        setIsProcessingPools(false);
      }
    }
  }, [poolsError, isProcessingPools]); // Only run when poolsError changes

  // Trades data loading removed for performance - focusing on fast pool loading

  // Data processing is now handled in query onSuccess callbacks

  // Filter markets dynamically without useEffect
  const getFilteredMarkets = () => {
    if (markets.length === 0) return [];

    let filtered = markets;

    // Apply watchlist filter if enabled
    if (showWatchlist) {
      filtered = filtered.filter(item => item.starred);
    }

    return filtered;
  };

  // Removed original loading state logic - now using 2-second forced skeleton

  // Prepare data for market search dialog
  const getSearchDialogData = () => {
    // Always use the most current market data to ensure starred status is in sync
    return markets.map(market => ({
      id: market.id,
      name: market.name,
      pair: market.pair,
      age: market.age,
      timestamp: market.timestamp,
      volume: market.volume,
      liquidity: market.liquidity,
      verified: Math.random() > 0.7, // Randomize for demo
      iconBg: '#000000', // Black background for all icons
      hasTokenImage: market.iconInfo?.hasImage || false,
      tokenImagePath: market.iconInfo?.imagePath || null,
      starred: market.starred,
    }));
  };

  // Handle market selection from the dialog
  const handleMarketSelect = (marketId: string) => {
    const selectedMarket = markets.find(m => m.id === marketId);
    if (selectedMarket) {
      console.log(`Selected market: ${selectedMarket.name}/${selectedMarket.pair}`);
      // Navigate to the spot page with the pool ID
      router.push(`/spot/${marketId}`);
    }
  };

  // Handle row click to navigate to spot trading page
  const handleRowClick = (poolId: string) => {
    router.push(`/spot/${poolId}`);
  };

  // Toggle star/favorite status for a market
  const toggleStarred = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setMarkets(prev =>
      prev.map(market =>
        market.id === id ? { ...market, starred: !market.starred } : market
      )
    );
  };

  // Add a function to handle toggling starred status from the search dialog
  const handleToggleStarredFromDialog = (marketId: string) => {
    setMarkets(prev =>
      prev.map(market =>
        market.id === marketId ? { ...market, starred: !market.starred } : market
      )
    );
  };

  // Search dialog now uses dynamic data without useEffect

  return (
    <div className="px-6 py-12 mx-auto bg-black max-w-7xl">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <DotPattern />
      </div>
      <div className="flex flex-col gap-8 relative z-10">
        <h2 className="text-white text-4xl font-bold tracking-tight text-start">
          Market Overview
          <br />
          <span className="text-white/70 text-base font-normal mt-2 block">
            Explore the latest market data and trading activity across all supported
            tokens.
          </span>
        </h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-7xl mx-auto w-full justify-between items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
            <Input
              placeholder="Search markets"
              className="pl-12 bg-black/50 border-white/20 text-white h-12 rounded-xl focus:ring-white/40 focus:border-white/40"
              onClick={() => setIsSearchDialogOpen(true)}
              readOnly
            />
          </div>
          <div className="flex items-center gap-2 bg-black/60 border border-white/20 p-1 rounded-xl">
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
        </div>

        {/* Market Table */}
        <div className="overflow-x-auto bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-7xl mx-auto w-full">
          {isLoading || isProcessingPools ? (
            <MarketListSkeleton rowCount={5} />
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Market
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Age
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 font-medium uppercase tracking-wider text-xs text-white/70 bg-white/5">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredMarkets().length > 0 ? (
                  getFilteredMarkets().map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-white/10 cursor-pointer transition-colors duration-200 border-b border-white/5 last:border-0"
                      onClick={() => handleRowClick(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              className="w-6 h-6 flex items-center justify-center border border-white/20 rounded-md hover:bg-white/20 transition-colors"
                              onClick={e => {
                                e.stopPropagation(); // Prevent row click when copying address
                                navigator.clipboard.writeText(item.id);
                                setCopiedToken({
                                  id: item.id,
                                  name: item.name,
                                });
                                setTimeout(() => setCopiedToken(null), 2000); // Clear after 2 seconds
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <div className="absolute left-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-xs rounded-md py-1.5 px-2.5 whitespace-nowrap z-10">
                              Copy token {item.name}
                            </div>
                          </div>
                          <button
                            className="text-white/50 hover:text-yellow-400 transition-colors"
                            onClick={e => toggleStarred(item.id, e)}
                            aria-label={
                              item.starred ? 'Remove from watchlist' : 'Add to watchlist'
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={item.starred ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              className={`w-5 h-5 ${
                                item.starred ? 'text-yellow-400' : 'text-white/40'
                              }`}
                              strokeWidth={item.starred ? '0' : '2'}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              />
                            </svg>
                          </button>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/30"
                            style={{ backgroundColor: '#000000' }}
                          >
                            {item.iconInfo?.hasImage && item.iconInfo?.imagePath ? (
                              <Image
                                src={item.iconInfo.imagePath || '/placeholder.svg'}
                                alt={item.name}
                                className="w-full h-full object-contain"
                                width={32}
                                height={32}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-black text-white">
                                <span className="font-bold text-xs">
                                  {item.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{item.name}</span>
                            <span className="text-white/60">/ {item.pair}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className="flex items-center gap-2 text-white/80"
                          title={new Date(item.timestamp * 1000).toLocaleString()}
                        >
                          <Clock className="w-4 h-4 text-white/60" />
                          {item.age}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-white font-mono">${item.price}</td>
                      <td className="px-6 py-5 text-white/90 font-mono">
                        ${item.volume}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/50">
                      {showWatchlist
                        ? 'Your watchlist is empty. Star some markets to add them here.'
                        : 'No markets found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Market Search Dialog */}
        <MarketSearchDialog
          isOpen={isSearchDialogOpen}
          onClose={() => setIsSearchDialogOpen(false)}
          marketData={getSearchDialogData()} 
          onSelectMarket={handleMarketSelect}
          onToggleStarred={handleToggleStarredFromDialog}
        />
      </div>
      {/* Copy Notification */}
      {copiedToken && (
        <div className="fixed bottom-6 right-6 bg-white/15 text-white px-5 py-3 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50 border border-white/30">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="font-medium">
            Copied {copiedToken.name} token to clipboard
          </span>
        </div>
      )}
    </div>
  );
}
