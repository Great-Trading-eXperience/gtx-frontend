"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { HexAddress } from "@/types/web3/general/address"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, Hexagon, Wallet, Settings, History, Droplets } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreatePool } from "@/hooks/web3/gtx/clob-dex/pool-manager/useCreatePool"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import GradientLoader from "@/components/gradient-loader/gradient-loader"
import ButtonConnectWallet from "@/components/button-connect-wallet.tsx/button-connect-wallet"
import { MOCK_ADA_ADDRESS, MOCK_DOGE_ADDRESS, MOCK_SHIB_ADDRESS, MOCK_SOL_ADDRESS, MOCK_USDC_ADDRESS, MOCK_XRP_ADDRESS } from "@/constants/contract-address"

// Mock token addresses
const MOCK_TOKENS = {
  SHIB: MOCK_SHIB_ADDRESS,
  SOL: MOCK_SOL_ADDRESS,
  DOGE: MOCK_DOGE_ADDRESS,
  XRP: MOCK_XRP_ADDRESS,
  ADA: MOCK_ADA_ADDRESS,
  USDC: MOCK_USDC_ADDRESS,
}

// Default values
const DEFAULT_LOT_SIZE = "1000000000000000000" // 1 ether
const DEFAULT_MAX_ORDER_AMOUNT = "100000000000000000000" // 100 ether

const CreatePoolComponent: React.FC = () => {
  // Wallet connection and loading states
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const [showConnectionLoader, setShowConnectionLoader] = useState(false)
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected) // Initialize with current connection state

  // Form state
  const [baseCurrency, setBaseCurrency] = useState<string>("")
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>("")
  const [quoteCurrency, setQuoteCurrency] = useState<string>(MOCK_TOKENS.USDC)
  const [lotSize, setLotSize] = useState<string>(DEFAULT_LOT_SIZE)
  const [maxOrderAmount, setMaxOrderAmount] = useState<string>(DEFAULT_MAX_ORDER_AMOUNT)

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
    })

    // Call the create pool function
    handleCreatePool(baseAddress, quoteAddress, lotSizeBigInt, maxOrderAmountBigInt)
  }

  // Add this useEffect to your component to handle notifications
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
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-20 h-20 border-t-2 border-b-2 border-cyan-400 rounded-full animate-spin"></div>
    </div>
  }
  
  // Show connection loading state only when transitioning from disconnected to connected
  if (showConnectionLoader) {
    return <GradientLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
      {/* Hexagonal Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI1IDJMMi42OCAxMy41djI1TDI1IDUwbDIyLjMyLTExLjV2LTI1eiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU2LCAxODksIDI0OCwgMC4wMykpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] opacity-50"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse blur-[2px]"></div>
          <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse delay-75 blur-[1px]"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-300/40 rounded-full animate-pulse delay-150 blur-[2px]"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-pulse delay-300 blur-[1px]"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse delay-500 blur-[1px]"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {isConnected ? (
          <div className="space-y-6 w-full max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto relative">
              <div className="inline-flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-cyan-500/10 blur-[32px] rounded-full"></div>
                <div className="relative">
                  <Hexagon className="w-16 h-16 text-cyan-500 absolute -left-1 -top-1 opacity-20" />
                  <Settings className="w-14 h-14 text-cyan-400 relative z-10" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                Create Trading Pool
              </h1>
              <p className="text-cyan-100/80">Set up a new trading pool with base and quote currencies</p>
            </div>

            {/* Create Pool Form */}
            <Card className="border-0 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-cyan-500/10">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseCurrency" className="text-gray-300">
                        Base Currency
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          setBaseCurrencySymbol(value)
                          setBaseCurrency(MOCK_TOKENS[value as keyof typeof MOCK_TOKENS])
                        }}
                        value={baseCurrencySymbol}
                      >
                        <SelectTrigger
                          id="baseCurrency"
                          className={`bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.baseCurrency ? "border-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Select base currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 border-white/10">
                          <SelectItem value="SHIB" className="hover:bg-cyan-500/10">
                            SHIB
                          </SelectItem>
                          <SelectItem value="SOL" className="hover:bg-cyan-500/10">
                            SOL
                          </SelectItem>
                          <SelectItem value="DOGE" className="hover:bg-cyan-500/10">
                            DOGE
                          </SelectItem>
                          <SelectItem value="XRP" className="hover:bg-cyan-500/10">
                            XRP
                          </SelectItem>
                          <SelectItem value="ADA" className="hover:bg-cyan-500/10">
                            ADA
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {baseCurrency && <p className="text-xs text-cyan-100/60">Address: {baseCurrency}</p>}
                      {errors.baseCurrency && <p className="text-sm text-red-400">{errors.baseCurrency}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quoteCurrency" className="text-gray-300">
                        Quote Currency - USDC (Default)
                      </Label>
                      <Input
                        id="quoteCurrency"
                        value={quoteCurrency}
                        disabled={true}
                        className="bg-slate-900/50 border-blue-500/25 text-gray-400"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="lotSize" className="text-gray-300">
                          Lot Size (Wei)
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <div className="relative">
                              <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                              <Wallet className="w-5 h-5 text-cyan-400/60 relative z-10" />
                            </div>
                          </div>
                          <Input
                            id="lotSize"
                            placeholder="Enter lot size"
                            value={lotSize}
                            onChange={(e) => setLotSize(e.target.value)}
                            disabled={isFormLoading}
                            className={`pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.lotSize ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors.lotSize && <p className="text-sm text-red-400">{errors.lotSize}</p>}
                        <p className="text-xs text-cyan-100/60">Minimum tradable amount (Default: 1 ETH)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxOrderAmount" className="text-gray-300">
                          Max Order Amount (Wei)
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <div className="relative">
                              <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                              <Wallet className="w-5 h-5 text-cyan-400/60 relative z-10" />
                            </div>
                          </div>
                          <Input
                            id="maxOrderAmount"
                            placeholder="Enter max order amount"
                            value={maxOrderAmount}
                            onChange={(e) => setMaxOrderAmount(e.target.value)}
                            disabled={isFormLoading}
                            className={`pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.maxOrderAmount ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors.maxOrderAmount && <p className="text-sm text-red-400">{errors.maxOrderAmount}</p>}
                        <p className="text-xs text-cyan-100/60">Maximum order size allowed (Default: 100 ETH)</p>
                      </div>
                    </div>
                  </div>

                  {isCreatePoolConfirmed && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/25">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/10 blur-[12px] rounded-full"></div>
                          <Hexagon className="w-10 h-10 text-green-500/20 absolute -left-1 -top-1" />
                          <CheckCircle2 className="w-8 h-8 text-green-400 relative z-10" />
                        </div>
                        <div>
                          <p className="font-medium text-green-400">Pool created successfully!</p>
                          {createPoolHash && (
                            <a
                              href={`https://testnet-explorer.riselabs.xyz/tx/${createPoolHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              View transaction on Rise Sepolia
                            </a>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isFormLoading}
                    className="w-full rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-10 shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
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
                    ) : (
                      "Create Pool"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transaction History Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[16px] rounded-full"></div>
                  <Hexagon className="w-12 h-12 text-cyan-500/20 absolute -left-1 -top-1" />
                  <History className="w-10 h-10 text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-2xl font-semibold text-cyan-50">Pool Creation History</h2>
              </div>

              <Card className="border-0 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="text-center py-8 text-cyan-100/60">
                    <p>Your pool creation history will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="border-0 bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                  <Hexagon className="w-20 h-20 text-cyan-500/20 absolute -left-2 -top-2" />
                  <Settings className="w-16 h-16 text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                  Connect Wallet
                </h2>
                <p className="text-cyan-100/80 mb-8">Connect your wallet to create a trading pool</p>
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

export default CreatePoolComponent