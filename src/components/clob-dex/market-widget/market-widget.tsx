'use client'

import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url'
import { tradesQuery, poolsQuery } from '@/graphql/gtx/gtx.query'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { useEffect } from 'react'
import { formatUnits } from 'viem'
import { useMarketStore } from '@/store/market-store'
import { PairDropdown } from './pair-dropdown'

// Define interfaces for the trades query response
interface TradeItem {
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  pool: {
    baseCurrency: string;
    coin: string;
    id: string;
    lotSize: string;
    maxOrderAmount: string;
    orderBook: string;
    quoteCurrency: string;
    timestamp: number;
  };
}

interface TradesResponse {
  tradess: {
    items: TradeItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
}

// Define interfaces for the pools query response
interface PoolItem {
  baseCurrency: string;
  coin: string;
  id: string;
  lotSize: string;
  maxOrderAmount: string;
  orderBook: string;
  quoteCurrency: string;
  timestamp: number;
}

interface PoolsResponse {
  poolss: {
    items: PoolItem[];
    totalCount: number;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
  };
}

const formatVolume = (value: bigint, decimals: number = 6) => {
  const formatted = formatUnits(value, decimals)
  const num = parseFloat(formatted)
  
  const config = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
  
  if (num >= 1e9) {
    return (num / 1e9).toLocaleString('en-US', config) + 'B'
  } else if (num >= 1e6) {
    return (num / 1e6).toLocaleString('en-US', config) + 'M'
  } else if (num >= 1e3) {
    return (num / 1e3).toLocaleString('en-US', config) + 'K'
  } else {
    // More precise for smaller numbers
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }
}

const SkeletonLoader = () => (
  <div className="w-full h-16 bg-gray-100 dark:bg-[#1B2028] rounded-t-lg animate-pulse flex items-center px-4 space-x-8">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded w-32" />
    ))}
  </div>
)

export default function MarketDataWidget({ onPoolChange }: { onPoolChange?: (poolId: string) => void }) {
  // Use Zustand store for state management
  const { 
    selectedPoolId, 
    setSelectedPoolId, 
    marketData, 
    setMarketData,
    DEFAULT_PAIR
  } = useMarketStore()
  
  // Notify parent component when pool changes
  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId)
    
    // Also set the selected pool object in the store
    const selectedPoolObject = poolsData?.poolss.items.find(pool => pool.id === poolId)
    if (selectedPoolObject) {
      useMarketStore.getState().setSelectedPool(selectedPoolObject)
    }
    
    if (onPoolChange) {
      onPoolChange(poolId)
    }
  }

  // Fetch pools data
  const { data: poolsData, isLoading: poolsLoading } = useQuery<PoolsResponse>({
    queryKey: ['pools'],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, poolsQuery)
    },
    staleTime: 60000, // 1 minute - pools don't change often
  })

  // Set default selected pool when pools data is loaded
  useEffect(() => {
    if (poolsData?.poolss?.items && poolsData.poolss.items.length > 0 && !selectedPoolId) {
      // Find WETH/USDC pair based on DEFAULT_PAIR from the store
      const defaultPool = poolsData.poolss.items.find(
        pool => 
          pool.coin?.toLowerCase() === DEFAULT_PAIR.toLowerCase() || 
          (pool.baseCurrency?.toLowerCase() === 'weth' && pool.quoteCurrency?.toLowerCase() === 'usdc')
      );
      
      // As a backup, look for anything with WETH in it
      const wethFallbackPool = !defaultPool ? poolsData.poolss.items.find(
        pool => pool.coin?.toLowerCase().includes('weth')
      ) : null;
      
      // Set default if found, then try fallback, otherwise use first pool
      let poolToSelect = null;
      
      if (defaultPool) {
        poolToSelect = defaultPool;
      } else if (wethFallbackPool) {
        poolToSelect = wethFallbackPool;
      } else {
        poolToSelect = poolsData.poolss.items[0];
      }
      
      if (poolToSelect) {
        setSelectedPoolId(poolToSelect.id);
        // Also set the selectedPool object
        useMarketStore.getState().setSelectedPool(poolToSelect);
      }
    }
  }, [poolsData, selectedPoolId, setSelectedPoolId, DEFAULT_PAIR])

  // Fetch trades data
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradesResponse>({
    queryKey: ['trades', selectedPoolId],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, tradesQuery)
    },
    refetchInterval: 5000,
    staleTime: 0,
    enabled: !!selectedPoolId, // Only fetch trades when a pool is selected
  })

  // Process trade data to calculate market statistics
  useEffect(() => {
    if (!tradesData?.tradess?.items || tradesData.tradess.items.length === 0 || !selectedPoolId) return
    
    // Filter trades for selected pool
    const filteredTrades = tradesData.tradess.items.filter(trade => trade.poolId === selectedPoolId)
    
    if (filteredTrades.length === 0) {
      // Reset market data if no trades for selected pool
      setMarketData({
        price: null,
        priceChange24h: null,
        priceChangePercent24h: null,
        volume: null,
        pair: poolsData?.poolss.items.find(pool => pool.id === selectedPoolId)?.coin || null
      })
      return
    }
    
    // Sort trades by timestamp (newest first)
    const sortedItems = [...filteredTrades].sort(
      (a, b) => b.timestamp - a.timestamp
    )

    // Get current price from the most recent trade
    const currentTrade = sortedItems[0]
    const currentPrice = Number(formatUnits(BigInt(currentTrade.price), 12)) // Adjust decimals as needed
    
    // Find trade from 24 hours ago
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    const prevDayTrade = sortedItems.find(trade => 
      trade.timestamp <= twentyFourHoursAgo
    ) || sortedItems[sortedItems.length - 1] // Use oldest trade if none from 24h ago
    
    const prevDayPrice = Number(formatUnits(BigInt(prevDayTrade.price), 12)) // Adjust decimals as needed
    const priceChange = currentPrice - prevDayPrice
    const priceChangePercent = (priceChange / prevDayPrice) * 100

    // Calculate total volume
    const totalVolume = sortedItems.reduce((sum, trade) => {
      // Only include trades from last 24 hours
      if (trade.timestamp >= twentyFourHoursAgo) {
        return sum + BigInt(trade.quantity)
      }
      return sum
    }, BigInt(0))

    // Get trading pair
    const pair = poolsData?.poolss.items.find(pool => pool.id === selectedPoolId)?.coin || 'Unknown Pair'

    setMarketData({
      price: currentPrice,
      priceChange24h: priceChange,
      priceChangePercent24h: priceChangePercent,
      volume: totalVolume,
      pair: pair
    })
  }, [tradesData, selectedPoolId, poolsData, setMarketData])

  const formatNumber = (value: number | null, options: {
    decimals?: number
    prefix?: string
    suffix?: string
    compact?: boolean
  } = {}) => {
    if (value === null) return '...'
    const { decimals = 2, prefix = '', suffix = '', compact = false } = options

    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      notation: compact ? 'compact' : 'standard',
    })

    return `${prefix}${formatter.format(value)}${suffix}`
  }

  // Create a mapping of coin types to appropriate icons
  const getCoinIcon = (pair: string | null) => {
    if (!pair) return "/icon/eth-usdc.png"
    
    const lowerPair = pair.toLowerCase()
    if (lowerPair.includes("eth") || lowerPair.includes("weth")) {
      return "/icon/eth-usdc.png"
    } else if (lowerPair.includes("btc") || lowerPair.includes("wbtc")) {
      return "/icon/btc-usdc.png" 
    } else if (lowerPair.includes("pepe")) {
      return "/icon/pepe-usdc.png"
    } else if (lowerPair.includes("link")) {
      return "/icon/link-usdc.png"
    }
    
    // Default icon
    return "/icon/eth-usdc.png"
  }

  if (poolsLoading || tradesLoading) return <SkeletonLoader />

  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-t-lg shadow-md">
      {/* Market data display with integrated selector */}
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-2 w-72">
          {/* <img src={getCoinIcon(marketData.pair)} alt={marketData.pair || 'Trading Pair'} className="w-[50px] h-[30px]" /> */}
          <div className="flex flex-col">
            {/* Integrated trading pair selector using shadcn/ui */}
            <div className="flex items-center gap-2">
              {poolsData?.poolss.items ? (
                <div className="flex items-center gap-2">
                  <PairDropdown
                    pairs={poolsData.poolss.items}
                    selectedPairId={selectedPoolId || ''}
                    onPairSelect={handlePoolChange}
                  />
                  <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">Spot</span>
                </div>
              ) : (
                <div className="h-9 w-[180px] bg-gray-800/50 animate-pulse rounded"></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 justify-center">
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className='font-semibold text-[15px] pb-1 underline'>Price</div>
            <div className='text-gray-900 dark:text-white'>{formatNumber(marketData.price, { prefix: '$', decimals: 5 })}</div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className='font-semibold text-[15px] pb-1'>24h Change</div>
            <div className={
              marketData.priceChangePercent24h && marketData.priceChangePercent24h >= 0 
                ? 'text-green-600 dark:text-[#5BBB6F]' 
                : 'text-red-600 dark:text-[#FF6978]'
            }>
              {marketData.priceChange24h && marketData.priceChangePercent24h && (
                <>
                  {formatNumber(marketData.priceChange24h, { 
                    prefix: marketData.priceChange24h >= 0 ? '+' : '',
                    decimals: 5
                  })} /{' '}
                  {formatNumber(marketData.priceChangePercent24h, { 
                    prefix: marketData.priceChangePercent24h >= 0 ? '+' : '', 
                    suffix: '%',
                    decimals: 2
                  })}
                </>
              )}
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className='font-semibold text-[15px] pb-1'>24h Volume</div>
            <div className='text-gray-900 dark:text-white'>${formatVolume(marketData.volume ?? BigInt(0), 6)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}