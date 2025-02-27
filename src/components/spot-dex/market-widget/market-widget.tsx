'use client'

import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url'
import { matchOrderEvents } from '@/graphql/liquidbook/liquidbook.query'
import { MatchOrderEventResponse } from '@/types/web3/liquidbook/matchOrderEvents'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { useEffect, useState } from 'react'
import { calculatePrice } from '../../../../helper'
import { formatUnits } from 'viem'

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

interface MarketData {
  price: number | null
  priceChange24h: number | null
  priceChangePercent24h: number | null
  volume: bigint | null
}

const SkeletonLoader = () => (
  <div className="w-full h-16 bg-gray-100 dark:bg-[#1B2028] rounded-t-lg animate-pulse flex items-center px-4 space-x-8">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded w-32" />
    ))}
  </div>
)

export default function MarketDataWidget() {
  const [marketData, setMarketData] = useState<MarketData>({
    price: null,
    priceChange24h: null,
    priceChangePercent24h: null,
    volume: null
  })

  const { data, isLoading, error } = useQuery<MatchOrderEventResponse>({
    queryKey: ['matchOrderEvents'],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, matchOrderEvents)
    },
    refetchInterval: 500,
    staleTime: 0,
  })

  useEffect(() => {
    if (data?.matchOrderEvents?.items) {
      const sortedItems = [...data.matchOrderEvents.items].sort(
        (a, b) => b.timestamp - a.timestamp
      )

      if (sortedItems.length > 0) {
        const currentTick = sortedItems[0]
        const currentPrice = calculatePrice(currentTick.tick.toString())
        
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
        const prevDayTick = sortedItems.find(tick => 
          tick.timestamp * 1000 <= twentyFourHoursAgo
        ) || sortedItems[sortedItems.length - 1]
        
        const prevDayPrice = calculatePrice(prevDayTick.tick.toString())
        const priceChange = currentPrice - prevDayPrice
        const priceChangePercent = (priceChange / prevDayPrice) * 100

        setMarketData({
          price: currentPrice,
          priceChange24h: priceChange,
          priceChangePercent24h: priceChangePercent,
          volume: sortedItems.reduce((sum, order) => {
            return sum + BigInt(order.volume)
          }, BigInt(0))
        })
      }
    }
  }, [data])

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

  if (isLoading || error) return <SkeletonLoader />

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center h-16 px-4 rounded-t-lg shadow-md">
      <div className="flex items-center space-x-2 w-72">
        <img src="/icon/eth-usdc.svg" alt="ETH" className="w-[60px] h-[60px]" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">ETH-USDC</span>
            <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">Spot</span>
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
  )
}

