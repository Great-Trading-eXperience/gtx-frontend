"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { HexAddress } from "@/types/web3/general/address"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, Hexagon, Wallet, Info, Check, ChevronDown } from "lucide-react"
import { useCreatePool } from "@/hooks/web3/gtx/clob-dex/pool-manager/useCreatePool"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import GradientLoader from "@/components/gradient-loader/gradient-loader"
import ButtonConnectWallet from "@/components/button-connect-wallet.tsx/button-connect-wallet"
import TokenSelectionDialog, { type Token } from "./token/token-selection-dialog"
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url'
import { poolsQuery } from "@/graphql/gtx/gtx.query"
import { DotPattern } from "../magicui/dot-pattern"
import PoolCreationSkeleton from "./pool-creation-skeleton"


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

// Default values
const DEFAULT_LOT_SIZE = "1000000000000000000" // 1 ether
const DEFAULT_MAX_ORDER_AMOUNT = "100000000000000000000" // 100 ether

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
  const [quoteCurrency, setQuoteCurrency] = useState<string>("")
  const [quoteCurrencySymbol, setQuoteCurrencySymbol] = useState<string>("USDC")
  const [lotSize, setLotSize] = useState<string>(DEFAULT_LOT_SIZE)
  const [maxOrderAmount, setMaxOrderAmount] = useState<string>(DEFAULT_MAX_ORDER_AMOUNT)
  const [feeTier, setFeeTier] = useState<string>("0.05")
  const [showFeeTiers, setShowFeeTiers] = useState(false)

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
    lotSize?: string
    maxOrderAmount?: string
  }>({})

  // Fetch pools data from GraphQL
  const { data: poolsData, isLoading: poolsLoading } = useQuery<PoolsResponse>({
    queryKey: ['pools'],
    queryFn: async () => {
      return await request(GTX_GRAPHQL_URL, poolsQuery)
    },
    staleTime: 60000, // 1 minute - pools don't change often
  })

  // Extract unique tokens from pools data to populate token list
  const [tokenList, setTokenList] = useState<Token[]>([])
  
  useEffect(() => {
    if (poolsData?.poolss?.items) {
      const uniqueTokenMap = new Map<string, Token>()
      
      // Extract base currencies
      poolsData.poolss.items.forEach(pool => {
        // Extract token symbol from the pool.coin (e.g., "ETH/USDC" -> "ETH")
        const baseSymbol = pool.coin.split('/')[0]
        
        if (!uniqueTokenMap.has(pool.baseCurrency)) {
          uniqueTokenMap.set(pool.baseCurrency, {
            symbol: baseSymbol,
            name: baseSymbol,
            address: pool.baseCurrency,
            logo: getCoinLogo(baseSymbol)
          })
        }
      })
      
      // Extract quote currencies
      poolsData.poolss.items.forEach(pool => {
        // Extract token symbol from the pool.coin (e.g., "ETH/USDC" -> "USDC")
        const quoteSymbol = pool.coin.split('/')[1]
        
        if (!uniqueTokenMap.has(pool.quoteCurrency)) {
          uniqueTokenMap.set(pool.quoteCurrency, {
            symbol: quoteSymbol,
            name: quoteSymbol,
            address: pool.quoteCurrency,
            logo: getCoinLogo(quoteSymbol)
          })
        }
      })
      
      // Set default quote currency if available
      const usdcToken = Array.from(uniqueTokenMap.values()).find(token => token.symbol === 'USDC')
      if (usdcToken && !quoteCurrency) {
        setQuoteCurrency(usdcToken.address)
        setQuoteCurrencySymbol(usdcToken.symbol)
      }
      
      // Convert map to array
      setTokenList(Array.from(uniqueTokenMap.values()))
    }
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
      lotSize?: string
      maxOrderAmount?: string
    } = {}

    // Validate base currency
    if (!baseCurrency) {
      newErrors.baseCurrency = "Base currency is required"
    } else if (!baseCurrency.startsWith("0x") || baseCurrency.length !== 42) {
      newErrors.baseCurrency = "Invalid address format"
    }

    // Validate lot size
    if (!lotSize) {
      newErrors.lotSize = "Lot size is required"
    } else if (isNaN(Number(lotSize)) || Number(lotSize) <= 0) {
      newErrors.lotSize = "Lot size must be a positive number"
    }

    // Validate max order amount
    if (!maxOrderAmount) {
      newErrors.maxOrderAmount = "Max order amount is required"
    } else if (isNaN(Number(maxOrderAmount)) || Number(maxOrderAmount) <= 0) {
      newErrors.maxOrderAmount = "Max order amount must be a positive number"
    } else if (Number(maxOrderAmount) < Number(lotSize)) {
      newErrors.maxOrderAmount = "Max order amount must be greater than lot size"
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

    // Ensure numeric conversion works correctly with scientific notation
    const lotSizeValue = Number(lotSize)
    const maxOrderAmountValue = Number(maxOrderAmount)

    const lotSizeBigInt = BigInt(Math.floor(lotSizeValue))
    const maxOrderAmountBigInt = BigInt(Math.floor(maxOrderAmountValue))

    console.log("Creating pool with parameters:", {
      baseAddress,
      quoteAddress,
      lotSizeBigInt: lotSizeBigInt.toString(),
      maxOrderAmountBigInt: maxOrderAmountBigInt.toString(),
      feeTier,
    })

    // Call the create pool function
    handleCreatePool(baseAddress, quoteAddress, lotSizeBigInt, maxOrderAmountBigInt)
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
    closeTokenDialog()
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
              <h1 className="text-4xl font-bold text-white">New position</h1>
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
                        Choose the tokens you want to provide liquidity for. You can select tokens on all supported
                        networks.
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

                    <div className="flex items-center gap-2 text-slate-400">
                      <Info className="w-4 h-4" />
                      <span className="text-sm">Add a Hook (Advanced)</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Fee tier</h3>
                        <p className="text-slate-400">
                          The amount earned providing liquidity. Choose an amount that suits your risk tolerance and
                          strategy.
                        </p>
                      </div>

                      {!showFeeTiers ? (
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-white">{selectedTier?.label} fee tier</h4>
                                {selectedTier?.tag && (
                                  <span className="px-3 py-1 bg-[#1a1a1a] text-white text-xs rounded-full">
                                    {selectedTier.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400">The % you will earn in fees</p>
                            </div>
                            <Button variant="ghost" className="text-slate-400" onClick={toggleFeeTiers}>
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
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-bold text-white">{selectedTier?.label} fee tier</h4>
                                  {selectedTier?.tag && (
                                    <span className="px-3 py-1 bg-[#1a1a1a] text-white text-xs rounded-full">
                                      {selectedTier.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400">The % you will earn in fees</p>
                              </div>
                              <Button variant="ghost" className="text-slate-400" onClick={toggleFeeTiers}>
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
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            {FEE_TIERS.map((tier) => (
                              <div
                                key={tier.value}
                                className={`bg-[#0A0A0A] border border-white/10 rounded-lg p-4 cursor-pointer hover:border-white/30 transition-all ${
                                  feeTier === tier.value ? "border-blue-500" : ""
                                }`}
                                onClick={() => selectFeeTier(tier.value)}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-lg font-bold text-white">{tier.label}</h4>
                                  {feeTier === tier.value && <Check className="w-5 h-5 text-blue-500" />}
                                </div>
                                <p className="text-sm text-slate-400">{tier.description}</p>
                              </div>
                            ))}
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
                        "Create Position"
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
                                href={`https://testnet-explorer.riselabs.xyz/tx/${createPoolHash}`}
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
      />
    </div>
  )
}

export default PoolCreation