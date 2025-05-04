"use client"

import ButtonConnectWallet from "@/components/button-connect-wallet.tsx/button-connect-wallet"
import GradientLoader from "@/components/gradient-loader/gradient-loader"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url'
import { PoolsPonderResponse, poolsQuery } from "@/graphql/gtx/clob"
import { useCreatePool } from "@/hooks/web3/gtx/clob-dex/pool-manager/useCreatePool"
import type { HexAddress } from "@/types/general/address"
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { CheckCircle2, ChevronDown, Hexagon, Info, Loader2, Wallet } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { DotPattern } from "../magicui/dot-pattern"
import PoolCreationSkeleton from "./pool-creation-skeleton"
import TokenSelectionDialog, { type Token } from "./token/token-selection-dialog"
import { EXPLORER_URL } from "@/constants/explorer-url"
import TokenABI from "@/abis/tokens/TokenABI"
import { readContract } from "@wagmi/core"
import { wagmiConfig } from "@/configs/wagmi"

// Define interfaces for the pools query response
interface PoolItem {
  id: string;
  baseCurrency: string;
  coin: string;
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

interface ProcessedPool {
  id: string;
  baseToken: string;
  quoteToken: string;
  orderBook: string;
  timestamp: number;
  maxOrderAmount: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number;
  quoteDecimals: number;
}

// Fee tier options
const FEE_TIERS = [
  { value: "0.01", label: "0.01%", description: "Best for very stable pairs." },
  { value: "0.05", label: "0.05%", description: "Best for stable pairs.", tag: "Highest TVL" },
  { value: "0.3", label: "0.3%", description: "Best for most pairs." },
  { value: "1", label: "1%", description: "Best for exotic pairs." },
]
const PoolCreation: React.FC = () => {
  // Wallet connection and loading states
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const [showConnectionLoader, setShowConnectionLoader] = useState(false)
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected)

  // Form state
  const [baseCurrency, setBaseCurrency] = useState<string>("")
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>("")
  const [baseCurrencyName, setBaseCurrencyName] = useState<string>("")
  const [baseCurrencyLogo, setBaseCurrencyLogo] = useState<string>("")
  const [baseCurrencyDecimals, setBaseCurrencyDecimals] = useState<number>(18) // Default to 18 decimals
  const [quoteCurrency, setQuoteCurrency] = useState<string>("")
  const [quoteCurrencySymbol, setQuoteCurrencySymbol] = useState<string>("USDC")

  // Trading Rules state
  const [minTradeAmount, setMinTradeAmount] = useState<string>("0.0001") // Default for 18 decimals
  const [minAmountMovement, setMinAmountMovement] = useState<string>("0.00001") // Default for 18 decimals
  const [minPriceMovement, setMinPriceMovement] = useState<string>("0.01") // Default for quote (USDC)
  const [minOrderSize, setMinOrderSize] = useState<string>("0.01") // Default for quote (USDC)
  const [slippageThreshold, setSlippageThreshold] = useState<string>("20") // Default for 18 decimals
  const [usingPresetRules, setUsingPresetRules] = useState<boolean>(true)

  const [feeTier, setFeeTier] = useState<string>("0.05")
  const [showFeeTiers, setShowFeeTiers] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Token selection dialog
  const [showTokenDialog, setShowTokenDialog] = useState(false)

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [isNotificationSuccess, setIsNotificationSuccess] = useState(true)

  // Validation state
  const [errors, setErrors] = useState<{
    baseCurrency?: string
    quoteCurrency?: string
    minTradeAmount?: string
    minAmountMovement?: string
    minPriceMovement?: string
    minOrderSize?: string
    slippageThreshold?: string
  }>({})

  const [processedPools, setProcessedPools] = useState<ProcessedPool[]>([])

  const chainId = useChainId()
  const defaultChainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN)

  // Fetch pools data from GraphQL
  const { data: poolsData, isLoading: poolsLoading } = useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools'],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId)
      const url = GTX_GRAPHQL_URL(currentChainId)
      if (!url) throw new Error('GraphQL URL not found')
      return await request<PoolsResponse | PoolsPonderResponse>(url, poolsQuery)
    },
    staleTime: 60000,
  })

  // Extract unique tokens from pools data to populate token list
  const [tokenList, setTokenList] = useState<Token[]>([])

  // Process pools data
  const processPools = async (poolsData: PoolsResponse | null) => {
    if (!poolsData) return []

    const pools = (poolsData as PoolsPonderResponse)?.poolss?.items || (poolsData as PoolsResponse)?.pools
    if (!pools.length) return []

    const processedPools = await Promise.all(pools.map(async (pool: PoolItem) => {
      const [baseTokenAddress, quoteTokenAddress] = [pool.baseCurrency, pool.quoteCurrency]

      let baseSymbol = baseTokenAddress
      let quoteSymbol = quoteTokenAddress
      let baseDecimals = 18
      let quoteDecimals = 6

      // Get base token info
      if (baseTokenAddress !== 'Unknown') {
        try {
          const symbol = await readContract(wagmiConfig, {
            address: baseTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "symbol",
          })
          const decimals = await readContract(wagmiConfig, {
            address: baseTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "decimals",
          })
          baseSymbol = symbol as string
          baseDecimals = decimals as number
        } catch (error) {
          console.error(`Error fetching base token info for ${baseTokenAddress}:`, error)
        }
      }

      // Get quote token info
      if (quoteTokenAddress !== 'USDC') {
        try {
          const symbol = await readContract(wagmiConfig, {
            address: quoteTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "symbol",
          })
          const decimals = await readContract(wagmiConfig, {
            address: quoteTokenAddress as `0x${string}`,
            abi: TokenABI,
            functionName: "decimals",
          })
          quoteSymbol = symbol as string
          quoteDecimals = decimals as number
        } catch (error) {
          console.error(`Error fetching quote token info for ${quoteTokenAddress}:`, error)
        }
      }

      return {
        id: pool.id,
        baseToken: baseTokenAddress,
        quoteToken: quoteTokenAddress,
        orderBook: pool.orderBook,
        baseSymbol,
        quoteSymbol,
        baseDecimals,
        quoteDecimals,
        timestamp: pool.timestamp,
        maxOrderAmount: pool.maxOrderAmount || '0'
      }
    }))

    return processedPools.sort((a: ProcessedPool, b: ProcessedPool) => {
      const aHasWETH = a.baseSymbol.toLowerCase().includes('weth') || a.baseSymbol.toLowerCase().includes('eth')
      const bHasWETH = b.baseSymbol.toLowerCase().includes('weth') || b.baseSymbol.toLowerCase().includes('eth')
      if (aHasWETH && !bHasWETH) return -1
      if (!aHasWETH && bHasWETH) return 1
      return b.timestamp - a.timestamp
    })
  }

  // First effect to process raw data
  useEffect(() => {
    const processData = async () => {
      const pools = await processPools(poolsData as PoolsResponse)
      setProcessedPools(pools)

      // Extract unique tokens from processed pools
      const uniqueTokenMap = new Map<string, Token>()

      // Extract base currencies
      pools.forEach((pool: ProcessedPool) => {
        if (!uniqueTokenMap.has(pool.baseToken)) {
          uniqueTokenMap.set(pool.baseToken, {
            symbol: pool.baseSymbol,
            name: pool.baseSymbol,
            address: pool.baseToken,
            logo: getCoinLogo(pool.baseSymbol)
          })
        }
      })

      // Extract quote currencies
      pools.forEach((pool: ProcessedPool) => {
        if (!uniqueTokenMap.has(pool.quoteToken)) {
          uniqueTokenMap.set(pool.quoteToken, {
            symbol: pool.quoteSymbol,
            name: pool.quoteSymbol,
            address: pool.quoteToken,
            logo: getCoinLogo(pool.quoteSymbol)
          })
        }
      })

      // Set default quote currency if available
      const usdcToken = Array.from(uniqueTokenMap.values()).find(token => token.symbol.includes('USDC'))
      if (usdcToken && !quoteCurrency) {
        setQuoteCurrency(usdcToken.address)
        setQuoteCurrencySymbol(usdcToken.symbol)
      }

      // Convert map to array
      setTokenList(Array.from(uniqueTokenMap.values()))
    }

    processData()
  }, [poolsData, quoteCurrency])

  // Pool creation hook
  const {
    handleCreatePool,
    isCreatePoolPending,
    isCreatePoolConfirming,
    isCreatePoolConfirmed,
    createPoolError,
    createPoolHash,
  } = useCreatePool()

  // Handle initial mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Handle wallet connection state changes
  useEffect(() => {
    if (mounted) {
      // Only handle connection changes after mounting
      if (isConnected && !previousConnectionState) {
        setShowConnectionLoader(true)
        const timer = setTimeout(() => {
          setShowConnectionLoader(false)
        }, 2000)
        return () => clearTimeout(timer)
      }
      setPreviousConnectionState(isConnected)
    }
  }, [isConnected, previousConnectionState, mounted])

  // Recent tokens based on timestamp
  const getRecentTokens = (): Token[] => {
    if (!poolsData?.poolss?.items) return []

    // Sort pools by timestamp (newest first)
    const sortedPools = [...poolsData.poolss.items].sort((a, b) => b.timestamp - a.timestamp)

    // Take base tokens from the 3 most recent pools
    const recentTokens: Token[] = []
    const addedAddresses = new Set<string>()

    for (const pool of sortedPools) {
      if (recentTokens.length >= 3) break

      const baseSymbol = pool.coin.split('/')[0]

      if (!addedAddresses.has(pool.baseCurrency)) {
        recentTokens.push({
          symbol: baseSymbol,
          name: baseSymbol,
          address: pool.baseCurrency,
          logo: getCoinLogo(baseSymbol)
        })
        addedAddresses.add(pool.baseCurrency)
      }
    }

    return recentTokens
  }

  // Popular tokens (based on most common in pools)
  const getPopularTokens = (): Token[] => {
    if (!poolsData?.poolss?.items) return []

    // Count token occurrences
    const tokenCount = new Map<string, { count: number, token: Token }>()

    poolsData.poolss.items.forEach(pool => {
      const baseSymbol = pool.coin.split('/')[0]

      if (!tokenCount.has(pool.baseCurrency)) {
        tokenCount.set(pool.baseCurrency, {
          count: 1,
          token: {
            symbol: baseSymbol,
            name: baseSymbol,
            address: pool.baseCurrency,
            logo: getCoinLogo(baseSymbol)
          }
        })
      } else {
        const item = tokenCount.get(pool.baseCurrency)
        if (item) {
          item.count++
        }
      }
    })

    // Sort by count and take top 2
    return Array.from(tokenCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(item => item.token)
  }

  // Helper to get coin logo from local token directory
  const getCoinLogo = (symbol: string): string | undefined => {
    const lowerSymbol = symbol.toLowerCase()

    // Check for available tokens in our directory
    if (lowerSymbol.includes("eth") || lowerSymbol.includes("weth")) {
      return "/tokens/eth.png"
    } else if (lowerSymbol.includes("btc") || lowerSymbol.includes("wbtc")) {
      return "/tokens/bitcoin.png"
    } else if (lowerSymbol.includes("usdc")) {
      return "/tokens/usdc.png"
    } else if (lowerSymbol.includes("pepe")) {
      return "/tokens/pepe.png"
    } else if (lowerSymbol.includes("link")) {
      return "/tokens/link.png"
    } else if (lowerSymbol.includes("shib") || lowerSymbol.includes("shiba")) {
      return "/tokens/shiba.png"
    } else if (lowerSymbol.includes("doge")) {
      return "/tokens/doge.png"
    } else if (lowerSymbol.includes("floki")) {
      return "/tokens/floki.png"
    } else if (lowerSymbol.includes("trump")) {
      return "/tokens/trump.png"
    }

    // Return undefined for tokens without matching icons
    return undefined
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: {
      baseCurrency?: string
      minTradeAmount?: string
      minAmountMovement?: string
      minPriceMovement?: string
      minOrderSize?: string
      slippageThreshold?: string
    } = {}

    // Validate base currency
    if (!baseCurrency) {
      newErrors.baseCurrency = "Base currency is required"
    } else if (!baseCurrency.startsWith("0x") || baseCurrency.length !== 42) {
      newErrors.baseCurrency = "Invalid address format"
    }

    // Validate minTradeAmount
    if (!minTradeAmount) {
      newErrors.minTradeAmount = "Minimum trade amount is required"
    } else if (isNaN(Number(minTradeAmount)) || Number(minTradeAmount) <= 0) {
      newErrors.minTradeAmount = "Minimum trade amount must be a positive number"
    }

    // Validate minAmountMovement
    if (!minAmountMovement) {
      newErrors.minAmountMovement = "Minimum amount movement is required"
    } else if (isNaN(Number(minAmountMovement)) || Number(minAmountMovement) <= 0) {
      newErrors.minAmountMovement = "Minimum amount movement must be a positive number"
    }

    // Validate minPriceMovement
    if (!minPriceMovement) {
      newErrors.minPriceMovement = "Minimum price movement is required"
    } else if (isNaN(Number(minPriceMovement)) || Number(minPriceMovement) <= 0) {
      newErrors.minPriceMovement = "Minimum price movement must be a positive number"
    }

    // Validate minOrderSize
    if (!minOrderSize) {
      newErrors.minOrderSize = "Minimum order size is required"
    } else if (isNaN(Number(minOrderSize)) || Number(minOrderSize) <= 0) {
      newErrors.minOrderSize = "Minimum order size must be a positive number"
    }

    // Validate slippageThreshold
    if (!slippageThreshold) {
      newErrors.slippageThreshold = "Slippage threshold is required"
    } else if (isNaN(Number(slippageThreshold)) || Number(slippageThreshold) < 0 || Number(slippageThreshold) > 100) {
      newErrors.slippageThreshold = "Slippage threshold must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Convert values to appropriate types
    const baseAddress = baseCurrency as HexAddress
    const quoteAddress = quoteCurrency as HexAddress

    // Convert trading rules to BigInt values based on token decimals
    let minTradeAmountBigInt: bigint
    let minAmountMovementBigInt: bigint
    let minPriceMovementBigInt: bigint
    let minOrderSizeBigInt: bigint

    // Convert based on the proper decimal precision
    if (baseCurrencyDecimals === 8) {
      // For 8 decimal tokens (like BTC)
      minTradeAmountBigInt = BigInt(Math.floor(Number(minTradeAmount) * 10 ** 8)) // 8 decimals
      minAmountMovementBigInt = BigInt(Math.floor(Number(minAmountMovement) * 10 ** 8)) // 8 decimals

      // Quote currency (USDC) typically has 6 decimals
      minOrderSizeBigInt = BigInt(Math.floor(Number(minOrderSize) * 10 ** 6)) // 6 decimals
      minPriceMovementBigInt = BigInt(Math.floor(Number(minPriceMovement) * 10 ** 6)) // 6 decimals
    } else {
      // For 18 decimal tokens (like ETH)
      minTradeAmountBigInt = BigInt(Math.floor(Number(minTradeAmount) * 10 ** 18)) // 18 decimals
      minAmountMovementBigInt = BigInt(Math.floor(Number(minAmountMovement) * 10 ** 18)) // 18 decimals

      // Quote currency (USDC) typically has 6 decimals
      minOrderSizeBigInt = BigInt(Math.floor(Number(minOrderSize) * 10 ** 6)) // 6 decimals
      minPriceMovementBigInt = BigInt(Math.floor(Number(minPriceMovement) * 10 ** 6)) // 6 decimals
    }

    const slippageThresholdValue = parseInt(slippageThreshold)

    // Create trading rules object
    const tradingRules = {
      minTradeAmount: minTradeAmountBigInt,
      minAmountMovement: minAmountMovementBigInt,
      minPriceMovement: minPriceMovementBigInt,
      minOrderSize: minOrderSizeBigInt,
      slippageTreshold: slippageThresholdValue
    }

    console.log("Creating pool with parameters:", {
      baseAddress,
      quoteAddress,
      tradingRules: {
        minTradeAmount: minTradeAmountBigInt.toString(),
        minAmountMovement: minAmountMovementBigInt.toString(),
        minPriceMovement: minPriceMovementBigInt.toString(),
        minOrderSize: minOrderSizeBigInt.toString(),
        slippageTreshold: slippageThresholdValue
      },
      baseCurrencyDecimals
    })

    // Call the create pool function
    handleCreatePool(baseAddress, quoteAddress, tradingRules)
  }

  // Handle pool creation notifications
  useEffect(() => {
    // Handle error notification
    if (createPoolError) {
      setNotificationMessage("Failed to create pool. Please check your inputs and try again.")
      setIsNotificationSuccess(false)
      setIsNotificationOpen(true)
    }

    // Handle success notification
    if (isCreatePoolConfirmed) {
      setNotificationMessage("Pool created successfully!")
      setIsNotificationSuccess(true)
      setIsNotificationOpen(true)
    }
  }, [createPoolError, isCreatePoolConfirmed])

  const isFormLoading = isCreatePoolPending || isCreatePoolConfirming

  // Handler for closing notification
  const handleCloseNotification = () => {
    setIsNotificationOpen(false)
  }

  // Show initial loading skeletons
  if (!mounted || isLoading) {
    return <PoolCreationSkeleton />
  }

  // Show connection loading state only when transitioning from disconnected to connected
  if (showConnectionLoader) {
    return <GradientLoader />
  }

  const toggleFeeTiers = () => {
    setShowFeeTiers(!showFeeTiers)
  }

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions)
  }

  const selectFeeTier = (value: string) => {
    setFeeTier(value)
  }

  const openTokenDialog = () => {
    setShowTokenDialog(true)
  }

  const closeTokenDialog = () => {
    setShowTokenDialog(false)
  }

  const handleSelectToken = (token: Token) => {
    setBaseCurrency(token.address)
    setBaseCurrencySymbol(token.symbol)
    setBaseCurrencyName(token.name)
    setBaseCurrencyLogo(token.logo || "")

    // Determine token decimals and set appropriate trading rules
    const tokenDecimals = determineTokenDecimals(token.symbol)
    setBaseCurrencyDecimals(tokenDecimals)

    // Apply preset trading rules if enabled
    if (usingPresetRules) {
      applyPresetTradingRules(tokenDecimals)
    }

    closeTokenDialog()
  }

  // Determine token decimals based on symbol
  const determineTokenDecimals = (symbol: string): number => {
    const lowerSymbol = symbol.toLowerCase()

    // Check for BTC and DOGE which typically have 8 decimals
    if (lowerSymbol.includes("btc") || lowerSymbol.includes("wbtc") || lowerSymbol.includes("doge")) {
      return 8
    }

    // USDC typically has 6 decimals
    if (lowerSymbol.includes("usdc") || lowerSymbol.includes("usdt")) {
      return 6
    }

    // Default for ETH, LINK, TRUMP, etc. (18 decimals)
    return 18
  }

  // Apply preset trading rules based on token decimals
  const applyPresetTradingRules = (decimals: number) => {
    if (decimals === 8) {
      // Rules for 8 decimal tokens (BTC, DOGE)
      setMinTradeAmount("0.00001") // 0.00001 BTC (1e3 in contract)
      setMinAmountMovement("0.000001") // 0.000001 BTC (1e2 in contract)
      setMinOrderSize("0.02") // 0.02 USDC (2e4 in contract)
      setMinPriceMovement("0.1") // 0.1 USDC (1e5 in contract)
      setSlippageThreshold("15") // 15%
      console.log("Applied 8 decimal trading rules")
    } else {
      // Default rules for 18 decimal tokens (ETH, LINK, TRUMP)
      setMinTradeAmount("0.0001") // 0.0001 ETH (1e14 in contract)
      setMinAmountMovement("0.00001") // 0.00001 ETH (1e13 in contract)
      setMinOrderSize("0.01") // 0.01 USDC (1e4 in contract)
      setMinPriceMovement("0.01") // 0.01 USDC (1e4 in contract)
      setSlippageThreshold("20") // 20%
      console.log("Applied 18 decimal trading rules")
    }
  }

  // Check if available pools exist with this token pair
  const doesPoolExist = (): boolean => {
    if (!poolsData?.poolss?.items || !baseCurrency || !quoteCurrency) return false

    return poolsData.poolss.items.some(pool =>
      (pool.baseCurrency === baseCurrency && pool.quoteCurrency === quoteCurrency) ||
      (pool.baseCurrency === quoteCurrency && pool.quoteCurrency === baseCurrency)
    )
  }

  const selectedTier = FEE_TIERS.find((tier) => tier.value === feeTier)

  // Input field component for trading rules
  const TradingRuleInputField = ({
    label,
    description,
    value,
    onChange,
    error,
    placeholder = "0.0",
    disabled = false
  }: {
    label: string,
    description: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error?: string,
    placeholder?: string,
    disabled?: boolean
  }) => (
    <div>
      <div className="flex flex-col gap-1 mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-[#0A0A0A] border border-white/20 text-white rounded-md h-12 px-4 
          ${!disabled ? "hover:border-white/30" : "opacity-70 cursor-not-allowed"} 
          transition-colors focus:outline-none focus:border-blue-500`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dot pattern background */}
      <DotPattern />

      {/* Token Selection Dialog */}
      <TokenSelectionDialog
        isOpen={showTokenDialog}
        onClose={closeTokenDialog}
        onSelectToken={handleSelectToken}
        tokens={tokenList}
        recentSearches={getRecentTokens()}
        popularTokens={getPopularTokens()}
      />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {isConnected ? (
          <div className="space-y-6 w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-white">New Pool</h1>
              {poolsLoading && <div className="text-white">Loading pools data...</div>}
            </div>

            {/* Single column layout */}
            <div className="w-full">
              <Card className="bg-[#121212] border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Select pair</h2>
                      <p className="text-slate-400">
                        Choose the tokens you want.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={openTokenDialog}
                          className="w-full flex items-center justify-between bg-[#0A0A0A] border border-white/20 text-white rounded-md h-14 px-4 hover:border-white/30 transition-colors"
                        >
                          {baseCurrencySymbol ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden mr-2">
                                {baseCurrencyLogo ? (
                                  <img src={baseCurrencyLogo} alt={baseCurrencySymbol} className="w-full h-full" />
                                ) : (
                                  <Hexagon className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <span>{baseCurrencySymbol}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Choose token</span>
                          )}
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                        {errors.baseCurrency && (
                          <p className="text-red-500 text-sm mt-1">{errors.baseCurrency}</p>
                        )}
                      </div>

                      <div>
                        <div className="w-full flex items-center justify-between bg-[#0A0A0A] border border-white/20 text-white rounded-md h-14 px-4 opacity-75">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden mr-2">
                              <img
                                src="/tokens/usdc.png"
                                alt="USDC"
                                className="w-full h-full"
                              />
                            </div>
                            <span>USDC</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warning if pool already exists */}
                    {doesPoolExist() && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Info className="w-5 h-5 text-amber-500" />
                          <p className="text-amber-400">
                            A pool already exists with this token pair. Creating another pool might split liquidity.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Trading Rules</h3>
                          <p className="text-slate-400">
                            Configure the trading parameters for your pool.
                          </p>
                        </div>
                        <Button variant="ghost" className="text-slate-400" onClick={toggleAdvancedOptions}>
                          {showAdvancedOptions ? (
                            <>
                              Less{" "}
                              <svg
                                className="w-5 h-5 ml-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M18 15L12 9L6 15"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              More{" "}
                              <svg
                                className="w-5 h-5 ml-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 9L12 15L18 9"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          )}
                        </Button>
                      </div>

                      {!showAdvancedOptions ? (
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-lg font-bold text-white">Basic Trading Parameters</h4>
                              <p className="text-slate-400">Set the minimum order size and slippage threshold</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TradingRuleInputField
                              label="Minimum Order Size"
                              description="Smallest order that can be placed on this pool"
                              value={minOrderSize}
                              onChange={(e) => setMinOrderSize(e.target.value)}
                              error={errors.minOrderSize}
                            />
                            <TradingRuleInputField
                              label="Slippage Threshold (%)"
                              description="Maximum allowed price slippage percentage"
                              value={slippageThreshold}
                              onChange={(e) => setSlippageThreshold(e.target.value)}
                              error={errors.slippageThreshold}
                              placeholder="3"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-white mb-4">Advanced Trading Parameters</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <TradingRuleInputField
                                label="Minimum Amount Movement"
                                description="Smallest amount change allowed between orders"
                                value={minAmountMovement}
                                onChange={(e) => setMinAmountMovement(e.target.value)}
                                error={errors.minAmountMovement}
                              />
                              <TradingRuleInputField
                                label="Minimum Price Movement"
                                description="Smallest price step allowed between orders"
                                value={minPriceMovement}
                                onChange={(e) => setMinPriceMovement(e.target.value)}
                                error={errors.minPriceMovement}
                              />
                              <TradingRuleInputField
                                label="Minimum Order Size"
                                description="Smallest order that can be placed on this pool"
                                value={minOrderSize}
                                onChange={(e) => setMinOrderSize(e.target.value)}
                                error={errors.minOrderSize}
                              />
                              <TradingRuleInputField
                                label="Slippage Threshold (%)"
                                description="Maximum allowed price slippage percentage"
                                value={slippageThreshold}
                                onChange={(e) => setSlippageThreshold(e.target.value)}
                                error={errors.slippageThreshold}
                                placeholder="3"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-lg text-lg font-medium"
                      onClick={handleSubmit}
                      disabled={isFormLoading || !baseCurrency || !quoteCurrency}
                    >
                      {isFormLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isCreatePoolPending
                            ? "Waiting for confirmation..."
                            : isCreatePoolConfirming
                              ? "Processing transaction..."
                              : "Creating pool..."}
                        </>
                      ) : !baseCurrency ? (
                        "Select tokens to continue"
                      ) : (
                        "Create Pool"
                      )}
                    </Button>

                    {isCreatePoolConfirmed && (
                      <div className="bg-[#0A0A0A] rounded-lg p-4 border border-green-500/25">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                          <div>
                            <p className="font-medium text-green-400">Pool created successfully!</p>
                            {createPoolHash && (
                              <a
                                href={`${EXPLORER_URL(chainId ?? defaultChainId)}/tx/${createPoolHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                View transaction
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="bg-[#121212] border-white/10 max-w-md w-full">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[24px] rounded-full"></div>
                  <Wallet className="w-16 h-16 text-blue-500 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Connect Wallet</h2>
                <p className="text-gray-300 mb-8">Connect your wallet to create a trading pool</p>
                <ButtonConnectWallet />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={isNotificationOpen}
        onClose={handleCloseNotification}
        message={notificationMessage}
        isSuccess={isNotificationSuccess}
        txHash={createPoolHash}
        explorerBaseUrl={EXPLORER_URL(chainId ?? defaultChainId)}
      />
    </div>
  )
}

export default PoolCreation