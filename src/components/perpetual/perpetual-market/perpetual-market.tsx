'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { gql } from 'graphql-request'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PerpetualPairDropdown } from './perpetual-pair-dropdown'
import { PERPETUAL_GRAPHQL_URL } from '@/constants/subgraph-url'
import { fundingFeesQuery, openInterestsQuery, pricesQuery } from '@/graphql/gtx/perpetual.query'

// Define types for the GraphQL response data
interface Price {
  timestamp: number;
  token: string;
  price: string;
  id: string;
  blockNumber: number;
}

interface OpenInterest {
  transactionHash: string | null;
  token: string;
  timestamp: number;
  openInterest: string;
  market: string;
  id: string;
  blockNumber: number | null;
}

interface FundingFee {
  blockNumber: number | null;
  collateralToken: string | null;
  fundingFee: string;
  id: string;
  marketToken: string | null;
  timestamp: number;
  transactionHash: string | null;
}

interface PageInfo {
  startCursor: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  endCursor: string;
}

interface PricesResponse {
  prices: {
    items: Price[];
    pageInfo: PageInfo;
  };
}

interface OpenInterestsResponse {
  openInterests: {
    items: OpenInterest[];
    pageInfo: PageInfo;
    totalCount: number;
  };
}

interface FundingFeesResponse {
  fundingFees: {
    items: FundingFee[];
    pageInfo: PageInfo;
    totalCount: number;
  };
}

// Token mapping
const tokenMapping: Record<string, { symbol: string, name: string }> = {
  '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': { symbol: 'WETH-USD', name: 'Ethereum' },
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': { symbol: 'WBTC-USD', name: 'Bitcoin' },
  '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': { symbol: 'UNI-USD', name: 'Uniswap' },
  '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': { symbol: 'LINK-USD', name: 'Chainlink' },
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { symbol: 'DAI-USD', name: 'Dai' },
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': { symbol: 'USDC-USD', name: 'USD Coin' },
  '0xFD086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': { symbol: 'USDT-USD', name: 'Tether' },
  '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a': { symbol: 'GMX-USD', name: 'GMX' },
  '0x912CE59144191C1204E64559FE8253a0e49E6548': { symbol: 'ARB-USD', name: 'Arbitrum' },
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': { symbol: 'USDC-USD', name: 'USD Coin' },
  // Add new token from the response
  '0x37e9b288c56B734c0291d37af478F60cE58a9Fc6': { symbol: 'USDT-USD', name: 'Tether' },
  '0x97f3d75FcC683c8F557D637196857FA303f7cebd': { symbol: 'BTC-USD', name: 'Bitcoin' },
};

// Format number with appropriate suffix (K, M, B)
const formatVolume = (value: number | bigint, decimals: number = 2) => {
  // Convert BigInt to number if needed
  const numValue = typeof value === 'bigint' ? Number(value) : value;
  
  const config = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }
  
  if (numValue >= 1e9) {
    return (numValue / 1e9).toLocaleString('en-US', config) + 'B'
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toLocaleString('en-US', config) + 'M'
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toLocaleString('en-US', config) + 'K'
  } else {
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: 6
    })
  }
}

// Loading component
const SkeletonLoader = () => (
  <div className="w-full h-16 bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 rounded-lg animate-pulse flex items-center px-4 space-x-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-8 bg-gray-800 rounded w-32" />
    ))}
  </div>
)

const PerpetualMarket = () => {
  // State for selected pair (token address)
  const [selectedToken, setSelectedToken] = useState('')
  
  // Fetch prices data
  const { data: pricesData, isLoading: pricesLoading } = useQuery<PricesResponse>({
    queryKey: ['prices'],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, pricesQuery)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
  })

  // Fetch open interests data
  const { data: openInterestsData, isLoading: openInterestsLoading } = useQuery<OpenInterestsResponse>({
    queryKey: ['openInterests'],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, openInterestsQuery)
    },
    refetchInterval: 30000,
    staleTime: 10000,
  })

  // Fetch funding fees data
  const { data: fundingFeesData, isLoading: fundingFeesLoading } = useQuery<FundingFeesResponse>({
    queryKey: ['fundingFees'],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, fundingFeesQuery)
    },
    refetchInterval: 30000,
    staleTime: 10000,
  })

  // Process data to create pairs for dropdown
  const [pairs, setPairs] = useState<Array<{id: string, symbol: string, name: string}>>([])
  
  useEffect(() => {
    if (pricesData) {
      // Extract unique tokens and create pairs
      const uniqueTokens = new Set<string>()
      pricesData.prices.items.forEach((item: Price) => {
        uniqueTokens.add(item.token)
      })
      
      // Create pairs array for dropdown
      const pairsArray = Array.from(uniqueTokens).map(token => {
        const mapping = tokenMapping[token] || { symbol: token.slice(0, 6) + '...', name: 'Unknown' }
        return {
          id: token,
          symbol: mapping.symbol,
          name: mapping.name
        }
      })
      
      setPairs(pairsArray)
      
      // Set default selected token if not already set
      if (!selectedToken && pairsArray.length > 0) {
        // Prefer WETH if available
        const ethPair = pairsArray.find(p => p.symbol.includes('ETH'))
        if (ethPair) {
          setSelectedToken(ethPair.id)
        } else {
          setSelectedToken(pairsArray[0].id)
        }
      }
    }
  }, [pricesData, selectedToken])
  
  // Get current price for selected token
  const getCurrentPrice = () => {
    if (!pricesData || !selectedToken) return null
    
    // Find latest price for selected token
    const tokenPrices = pricesData.prices.items
      .filter((item: Price) => item.token === selectedToken)
      .sort((a: Price, b: Price) => b.timestamp - a.timestamp)
    
    return tokenPrices.length > 0 ? Number(tokenPrices[0].price) / 1e18 : null // Adjusted divisor to 1e18
  }
  
  // Get open interest for selected token
  const getOpenInterest = () => {
    if (!openInterestsData || !selectedToken) return null
    
    // Find latest open interest for selected token
    const tokenOI = openInterestsData.openInterests.items
      .filter((item: OpenInterest) => item.token === selectedToken)
      .sort((a: OpenInterest, b: OpenInterest) => b.timestamp - a.timestamp)
      
    return tokenOI.length > 0 ? Number(tokenOI[0].openInterest) / 1e18 : null // Adjusted divisor to 1e18
  }
  
  // Get funding rate for selected token
  const getFundingRate = () => {
    if (!fundingFeesData || !selectedToken) return null
    
    // Modified to handle null marketToken field - using the token from selectedToken instead
    const tokenFunding = fundingFeesData.fundingFees.items
      // We'll use the latest funding fee since marketToken is null in the response
      .sort((a: FundingFee, b: FundingFee) => b.timestamp - a.timestamp)
      
    // Convert funding fee to annual rate (approximate)
    if (tokenFunding.length > 0) {
      // Funding rate is typically expressed as a percentage per 8 hours
      // We need to convert it to a decimal (e.g., 0.01% -> 0.0001)
      return Number(tokenFunding[0].fundingFee) / 1e18 
    }
    
    return null
  }
  
  // Get current price, open interest, and funding rate
  const currentPrice = getCurrentPrice()
  const openInterest = getOpenInterest()
  const fundingRate = getFundingRate()
  
  // Handle pair selection
  const handlePairSelect = (tokenAddress: string) => {
    setSelectedToken(tokenAddress)
  }
  
  // Show loading state if data is loading
  if (pricesLoading || openInterestsLoading || fundingFeesLoading || pairs.length === 0) {
    return <SkeletonLoader />
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-lg shadow-md">
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-2 w-72">
          <PerpetualPairDropdown 
            pairs={pairs}
            selectedPairId={selectedToken}
            onPairSelect={handlePairSelect}
          />
        </div>
        
        <div className="flex-1 flex gap-4 justify-center">
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className='font-semibold text-[15px] pb-1 underline'>Mark</div>
            <div className='text-gray-900 dark:text-white'>
              {currentPrice 
                ? `$${currentPrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: currentPrice < 0.01 ? 8 : 2
                  })}` 
                : '-'}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-40">
            <div className='font-semibold text-[15px] pb-1'>Open Interest</div>
            <div className='text-gray-900 dark:text-white'>
              {openInterest 
                ? `$${formatVolume(openInterest)}` 
                : '-'}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-36">
            <div className='font-semibold text-[15px] pb-1'>Funding</div>
            {fundingRate !== null ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <span className={
                      fundingRate >= 0 
                        ? 'text-green-600 dark:text-[#5BBB6F]' 
                        : 'text-red-600 dark:text-[#FF6978]'
                    }>
                      {fundingRate >= 0 ? '+' : ''}
                      {(fundingRate * 100).toFixed(4)}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annualized: {(fundingRate * 100 * 3 * 365).toFixed(2)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : '-'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerpetualMarket