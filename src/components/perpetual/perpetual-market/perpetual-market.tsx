'use client'

import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { gql } from 'graphql-request'
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PerpetualPairDropdown } from './perpetual-pair-dropdown'
import { PERPETUAL_GRAPHQL_URL } from '@/constants/subgraph-url'
import { fundingFeesQuery, openInterestsQuery, pricesQuery } from '@/graphql/gtx/perpetual'
import { usePerpetualMarketStore, Market as StoreMarket } from '@/store/perpetual-market-store'

// Define the markets query
export const marketsQuery = gql`
  query GetMarkets {
    markets {
      items {
        blockNumber
        id
        longToken
        marketToken
        name
        shortToken
        timestamp
        transactionHash
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
  }
`;

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

// Local Market interface for GraphQL response data
interface LocalMarket {
  blockNumber: number;
  id: string;
  longToken: string;
  marketToken: string;
  name: string;
  shortToken: string;
  timestamp: number;
  transactionHash: string;
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

interface MarketsResponse {
  markets: {
    items: LocalMarket[];
    pageInfo: PageInfo;
    totalCount: number;
  };
}

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

// Helper function to parse market name
const parseMarketName = (name: string) => {
  if (!name) return { symbol: 'Unknown', name: 'Unknown' };
  
  // Extract trading pair from GTX_XXX_YYY format
  const parts = name.split('_');
  if (parts.length >= 3) {
    const base = parts[1];
    const quote = parts[2];
    const fullName = getFullName(base);
    
    // Create symbol in the format BASE-QUOTE
    const symbol = `${base}-${quote}`;
    
    // Check if this is one of our allowed pairs
    const allowedPairs = [
      'WETH-USDC',
      'WBTC-USDC',
      'LINK-USDC',
      'PEPE-USDC',
      'TRUMP-USDC'
    ];
    
    if (allowedPairs.includes(symbol.toUpperCase())) {
      return {
        symbol: symbol,
        name: fullName || base // Use the full name if available, otherwise the base token
      };
    } else {
      // Return empty name to indicate this pair should not be displayed
      return {
        symbol: symbol,
        name: ''
      };
    }
  }
  
  return { symbol: name, name: '' };
}

// Helper to get full name from symbol
const getFullName = (symbol: string) => {
  const nameMap: Record<string, string> = {
    'WETH': 'Ethereum',
    'ETH': 'Ethereum',
    'WBTC': 'Bitcoin',
    'BTC': 'Bitcoin',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'PEPE': 'Pepe',
    'DOGE': 'Dogecoin',
    'SOL': 'Solana',
    'SHIB': 'Shiba Inu',
    'USDC': 'USD Coin',
    'USDT': 'Tether',
    'DAI': 'Dai',
    'TRUMP': 'Trump'
  };
  
  return nameMap[symbol] || '';
}

const PerpetualMarket = () => {
  // Get state and actions from Zustand store
  const { 
    marketTokenMap, setMarketTokenMap,
    tradingPairs, setTradingPairs,
    selectedTokenId, setSelectedTokenId,
    marketData, updateMarketData,
    DEFAULT_PAIR
  } = usePerpetualMarketStore();
  
  // Fetch markets data
  const { data: marketsData, isLoading: marketsLoading } = useQuery<MarketsResponse>({
    queryKey: ['markets'],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, marketsQuery)
    },
    refetchInterval: 30000,
    staleTime: 10000,
  })
  
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

  // Update loading state in store
  useEffect(() => {
    updateMarketData({
      marketsLoaded: !marketsLoading,
      pricesLoaded: !pricesLoading
    });
  }, [marketsLoading, pricesLoading, updateMarketData]);
  
  // Process markets data with proper type conversion
  useEffect(() => {
    if (marketsData?.markets?.items) {
      // Store markets in the store
      const markets = marketsData.markets.items;
      
      // Create a map of market tokens for easy lookup
      const marketMap: Record<string, StoreMarket> = {};
      
      markets.forEach(localMarket => {
        // Convert each local market to the store's expected format
        const storeMarket: StoreMarket = {
          ...localMarket,
          // Convert string addresses to the template literal type expected by the store
          longToken: localMarket.longToken as `0x${string}`,
          shortToken: localMarket.shortToken as `0x${string}`,
          marketToken: localMarket.marketToken as `0x${string}`,
        };
        
        // Map all tokens to their corresponding market
        marketMap[localMarket.longToken] = storeMarket;
        marketMap[localMarket.shortToken] = storeMarket;
        marketMap[localMarket.marketToken] = storeMarket;
        
        // Also map by token address
        const pricesWithThisMarket = pricesData?.prices?.items.filter(
          price => price.token === localMarket.longToken || 
                 price.token === localMarket.shortToken || 
                 price.token === localMarket.marketToken
        ) || [];
        
        pricesWithThisMarket.forEach(price => {
          marketMap[price.token] = storeMarket;
        });
      });
      
      // Now we can safely pass the map to the store
      setMarketTokenMap(marketMap);
    }
  }, [marketsData, pricesData, setMarketTokenMap]);
  
  // Process price data and create pairs
  useEffect(() => {
    if (pricesData && Object.keys(marketTokenMap).length > 0) {
      // Extract unique tokens and create pairs
      const uniqueTokens = new Set<string>()
      pricesData.prices.items.forEach((item: Price) => {
        uniqueTokens.add(item.token)
      })
      
      // Create pairs array for dropdown using markets data
      const pairsArray = Array.from(uniqueTokens).map(token => {
        // Try to find the token in the market data
        const market = marketTokenMap[token];
        
        if (market) {
          // Use market data when available
          const { symbol, name } = parseMarketName(market.name);
          return {
            id: token,
            tokenAddress: token, // Add the tokenAddress property
            symbol,
            name
          };
        } else {
          // For tokens not in market data, create a generic display
          return {
            id: token,
            tokenAddress: token, // Add the tokenAddress property
            symbol: `${token.slice(0, 6)}...`,
            name: 'Unknown Token'
          };
        }
      }).filter(pair => pair.symbol !== 'Unknown'); // Filter out any unidentified tokens
      
      // Store pairs in the Zustand store
      setTradingPairs(pairsArray);
      
      // Set default selected token if not already set
      if (!selectedTokenId && pairsArray.length > 0) {
        // Look for default pair (WETH-USDC) first
        const defaultPairToken = pairsArray.find(p => 
          p.symbol.toLowerCase() === DEFAULT_PAIR.toLowerCase()
        );
        
        // If default pair is not available, try any ETH pair
        const ethUsdcPair = pairsArray.find(p => 
          p.symbol.toLowerCase().includes('weth') && 
          p.symbol.toLowerCase().includes('usdc')
        );
        
        // If ETH-USDC is not available, try any ETH pair
        const ethPair = defaultPairToken || ethUsdcPair || pairsArray.find(p => 
          p.symbol.toLowerCase().includes('eth')
        );
        
        if (ethPair) {
          setSelectedTokenId(ethPair.id);
        } else {
          setSelectedTokenId(pairsArray[0].id);
        }
      }
    }
  }, [pricesData, marketTokenMap, selectedTokenId, setTradingPairs, setSelectedTokenId, DEFAULT_PAIR]);
  
  // Update market data when selected token changes or new data arrives
  useEffect(() => {
    if (selectedTokenId) {
      // Get current price for selected token
      const getCurrentPrice = () => {
        if (!pricesData) return null;
        
        // Find latest price for selected token
        const tokenPrices = pricesData.prices.items
          .filter((item: Price) => item.token === selectedTokenId)
          .sort((a: Price, b: Price) => b.timestamp - a.timestamp);
        
        return tokenPrices.length > 0 ? Number(tokenPrices[0].price) / 1e18 : null;
      }
      
      // Get open interest for selected token
      const getOpenInterest = () => {
        if (!openInterestsData) return null;
        
        // Find latest open interest for selected token
        const tokenOI = openInterestsData.openInterests.items
          .filter((item: OpenInterest) => item.token === selectedTokenId)
          .sort((a: OpenInterest, b: OpenInterest) => b.timestamp - a.timestamp);
          
        return tokenOI.length > 0 ? Number(tokenOI[0].openInterest) / 1e18 : null;
      }
      
      // Get funding rate for selected token
      const getFundingRate = () => {
        if (!fundingFeesData) return null;
        
        // Get the latest funding fee
        const tokenFunding = fundingFeesData.fundingFees.items
          .sort((a: FundingFee, b: FundingFee) => b.timestamp - a.timestamp);
          
        // Convert funding fee to annual rate (approximate)
        if (tokenFunding.length > 0) {
          return Number(tokenFunding[0].fundingFee) / 1e18;
        }
        
        return null;
      }
      
      // Update market data in the store
      updateMarketData({
        price: getCurrentPrice(),
        openInterest: getOpenInterest(),
        fundingRate: getFundingRate()
      });
    }
  }, [selectedTokenId, pricesData, openInterestsData, fundingFeesData, updateMarketData]);
  
  // Handle pair selection
  const handlePairSelect = (tokenAddress: string) => {
    setSelectedTokenId(tokenAddress);
  }
  
  // Show loading state if data is loading
  if (marketsLoading || pricesLoading || openInterestsLoading || fundingFeesLoading || tradingPairs.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-lg shadow-md">
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-2 w-72">
          <PerpetualPairDropdown 
            pairs={tradingPairs}
            selectedPairId={selectedTokenId || ''}
            onPairSelect={handlePairSelect}
          />
        </div>
        
        <div className="flex-1 flex gap-4 justify-center">
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className='font-semibold text-[15px] pb-1 underline'>Mark</div>
            <div className='text-gray-900 dark:text-white'>
              {marketData.price != null
                ? `$${marketData.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: marketData.price < 0.01 ? 8 : 2
                  })}` 
                : '-'}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-40">
            <div className='font-semibold text-[15px] pb-1'>Open Interest</div>
            <div className='text-gray-900 dark:text-white'>
              {marketData.openInterest != null
                ? `$${formatVolume(marketData.openInterest)}` 
                : '-'}
            </div>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 text-xs w-36">
            <div className='font-semibold text-[15px] pb-1'>Funding</div>
            {marketData.fundingRate !== null ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center">
                    <span className={
                      marketData.fundingRate >= 0 
                        ? 'text-green-600 dark:text-[#5BBB6F]' 
                        : 'text-red-600 dark:text-[#FF6978]'
                    }>
                      {marketData.fundingRate >= 0 ? '+' : ''}
                      {(marketData.fundingRate * 100).toFixed(4)}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annualized: {(marketData.fundingRate * 100 * 3 * 365).toFixed(2)}%</p>
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