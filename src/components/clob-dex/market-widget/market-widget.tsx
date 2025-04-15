'use client'

import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url'
import { poolsQuery, tradesQuery } from '@/graphql/gtx/gtx.query'
import { useMarketStore } from '@/store/market-store'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { formatUnits } from 'viem'
import { PairDropdown } from './pair-dropdown'
import { useChainId } from 'wagmi'
import React from 'react'
import { Pool } from '@/store/market-store'

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
  baseCurrency: string
  coin: string
  id: string
  lotSize: string
  maxOrderAmount: string
  orderBook: string
  quoteCurrency: string
  timestamp: number
}

interface PoolsResponse {
  poolss: {
    items: PoolItem[]
    totalCount: number
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
  }
}

const formatVolume = (value: number, decimals: number = 6) => {
  const num = parseFloat(value.toString())
  
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

export default function MarketWidget() {
  const chainId = useChainId()
  const defaultChain = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)
  const pathname = usePathname()
  const router = useRouter()
  const [lastPathname, setLastPathname] = useState<string | null>(null)

  const {
    selectedPoolId,
    setSelectedPoolId,
    setSelectedPool,
    marketData,
    setMarketData,
    syncWithUrl,
    getUrlFromPool,
    setBaseDecimals,
    setQuoteDecimals,
    quoteDecimals
  } = useMarketStore()

  const { data: poolsData, isLoading: poolsLoading } = useQuery<PoolsResponse>({
    queryKey: ['pools', String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request(url, poolsQuery)
    },
    refetchInterval: 1000,
  })

  // Transform the pool items to include decimals before using them
  const poolsWithDecimals = useMemo<Pool[]>(() => {
    if (!poolsData?.poolss?.items) return []
    return poolsData.poolss.items.map(pool => ({
      ...pool,
      baseDecimals: 18, // Default ERC20 decimals
      quoteDecimals: 6, // Default USDC decimals
    }))
  }, [poolsData])

  // Track URL changes and update pool selection
  useEffect(() => {
    if (pathname !== lastPathname) {
      setLastPathname(pathname)
      
      if (poolsWithDecimals.length > 0) {
        const urlParts = pathname?.split('/') || []
        if (urlParts.length >= 3) {
          const poolIdFromUrl = urlParts[2]
          const poolExists = poolsWithDecimals.some(pool => pool.id === poolIdFromUrl)
          
          if (poolExists && poolIdFromUrl !== selectedPoolId) {
            setSelectedPoolId(poolIdFromUrl)
            const poolObject = poolsWithDecimals.find(pool => pool.id === poolIdFromUrl)
            if (poolObject) {
              setSelectedPool(poolObject)
              setBaseDecimals(poolObject.baseDecimals)
              setQuoteDecimals(poolObject.quoteDecimals)
            }
          }
        }
      }
    }
  }, [pathname, lastPathname, poolsWithDecimals, selectedPoolId, setSelectedPoolId, setSelectedPool, setBaseDecimals, setQuoteDecimals])

  // Initial sync with URL
  useEffect(() => {
    if (poolsWithDecimals.length > 0) {
      const poolId = syncWithUrl(pathname, poolsWithDecimals)
      if (poolId) {
        const pool = poolsWithDecimals.find((p) => p.id === poolId)
        if (pool) {
          setSelectedPool(pool)
          setBaseDecimals(pool.baseDecimals)
          setQuoteDecimals(pool.quoteDecimals)
        }
      }
    }
  }, [pathname, poolsWithDecimals, syncWithUrl, setSelectedPool, setBaseDecimals, setQuoteDecimals])

  // Handle pool change from dropdown
  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId)
    
    // Set the selected pool object
    if (poolsWithDecimals) {
      const selectedPoolObject = poolsWithDecimals.find(pool => pool.id === poolId)
      if (selectedPoolObject) {
        setSelectedPool(selectedPoolObject)
        setBaseDecimals(selectedPoolObject.baseDecimals)
        setQuoteDecimals(selectedPoolObject.quoteDecimals)
      }
    }
    
    // Update URL
    router.push(getUrlFromPool(poolId))
  }

  // Fetch trades data
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradesResponse>({
    queryKey: ['trades', String(chainId ?? defaultChain)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChain)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request(url, tradesQuery)
    },
    refetchInterval: 1000,
    staleTime: 0,
    refetchOnWindowFocus: true,
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
        high24h: null,
        low24h: null,
        volume: null,
        pair: poolsWithDecimals.find(pool => pool.id === selectedPoolId)?.coin || null
      })
      return
    }
    
    // Sort trades by timestamp (newest first)
    const sortedItems = [...filteredTrades].sort(
      (a, b) => b.timestamp - a.timestamp
    )

    // Get current price from the most recent trade
    const currentTrade = sortedItems[0]
    const currentPrice = Number(currentTrade.price) // Adjust decimals as needed
    
    // Find trade from 24 hours ago
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    const prevDayTrade = sortedItems.find(trade => 
      trade.timestamp <= twentyFourHoursAgo
    ) || sortedItems[sortedItems.length - 1] // Use oldest trade if none from 24h ago
    
    const prevDayPrice = Number(prevDayTrade.price) // Adjust decimals as needed
    const priceChange = currentPrice - prevDayPrice
    const priceChangePercent = (priceChange / prevDayPrice) * 100

    // Calculate 24h high and low
    let high24h = 0
    let low24h = Number.MAX_VALUE
    
    // Only include trades from last 24 hours
    const trades24h = sortedItems.filter(trade => trade.timestamp >= twentyFourHoursAgo)
    
    if (trades24h.length > 0) {
      // Find highest and lowest prices
      trades24h.forEach(trade => {
        const price = Number(trade.price)
        if (price > high24h) high24h = price
        if (price < low24h) low24h = price
      })
    } else {
      // If no trades in last 24h, use current price
      high24h = currentPrice
      low24h = currentPrice
    }

    // Calculate total volume
    const totalVolume = sortedItems.reduce((sum, trade) => {
      // Only include trades from last 24 hours
      if (trade.timestamp >= twentyFourHoursAgo) {
        return sum + BigInt(trade.quantity)
      }
      return sum
    }, BigInt(0))

    // Get trading pair
    const pair = poolsWithDecimals.find(pool => pool.id === selectedPoolId)?.coin || 'Unknown Pair'

    setMarketData({
      price: currentPrice,
      priceChange24h: priceChange,
      priceChangePercent24h: priceChangePercent,
      high24h: high24h,
      low24h: low24h,
      volume: totalVolume,
      pair: pair
    })
  }, [tradesData, selectedPoolId, poolsWithDecimals, setMarketData])

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

  if (poolsLoading || tradesLoading) return <SkeletonLoader />

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
            <div className='text-gray-900 dark:text-white'>{formatNumber(Number(formatUnits(BigInt(marketData.price ?? 0), quoteDecimals)), { prefix: '$' })}</div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className='font-semibold text-[15px] pb-1'>24h High</div>
            <div className='text-green-600 dark:text-[#5BBB6F]'>
              {formatNumber(Number(formatUnits(BigInt(marketData.high24h ?? 0), quoteDecimals)), { 
                prefix: '$',
                decimals: 2
              })}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className='font-semibold text-[15px] pb-1'>24h Low</div>
            <div className='text-red-600 dark:text-[#FF6978]'>
              {formatNumber(Number(formatUnits(BigInt(marketData.low24h ?? 0), quoteDecimals)), { 
                prefix: '$',
                decimals: 2
              })}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className='font-semibold text-[15px] pb-1'>24h Volume</div>
            <div className='text-gray-900 dark:text-white'>${formatVolume(Number(formatUnits(marketData.volume ?? BigInt(0), quoteDecimals)), 2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}