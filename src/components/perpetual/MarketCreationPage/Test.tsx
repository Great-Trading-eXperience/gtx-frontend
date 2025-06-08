"use client"

import { useState } from "react"
import usePerpetualCreateMarket, { type OracleSource } from "@/hooks/web3/gtx/perpetual/usePerpetualCreateMarket"
import type { HexAddress } from "@/types/general/address"
import { toast } from "sonner"

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, X, Hexagon, Settings, CheckCircle2, Droplets, Wallet } from "lucide-react"

// Token addresses
import {
  WETH_ADDRESS,
  WBTC_ADDRESS,
  PEPE_ADDRESS,
  TRUMP_ADDRESS,
  DOGE_ADDRESS,
  LINK_ADDRESS,
  SHIBA_ADDRESS,
  BONK_ADDRESS,
  FLOKI_ADDRESS,
} from "@/constants/address"

// Pre-defined tokens from the environment variables
const PREDEFINED_TOKENS = [
  { symbol: "WETH", address: WETH_ADDRESS },
  { symbol: "WBTC", address: WBTC_ADDRESS },
  { symbol: "PEPE", address: PEPE_ADDRESS },
  { symbol: "TRUMP", address: TRUMP_ADDRESS },
  { symbol: "DOGE", address: DOGE_ADDRESS },
  { symbol: "LINK", address: LINK_ADDRESS },
  { symbol: "SHIBA", address: SHIBA_ADDRESS },
  { symbol: "BONK", address: BONK_ADDRESS },
  { symbol: "FLOKI", address: FLOKI_ADDRESS },
]

// Oracle providers based on the contract implementation
const ORACLE_PROVIDERS = ["binance", "okx", "coinbase", "geckoterminal", "dexscreener"]

export default function CreateMarketForm() {
  const [marketType, setMarketType] = useState<string>("default")
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [customTokenAddress, setCustomTokenAddress] = useState<string>("")
  const [customTokenSymbol, setCustomTokenSymbol] = useState<string>("TOKEN")
  const [tokenPair, setTokenPair] = useState<string>("")
  const [sources, setSources] = useState<OracleSource[]>([
    { name: "binance", identifier: "", network: "" },
    { name: "okx", identifier: "", network: "" },
  ])

  const {
    createMarketWithDefaultOracles,
    createMarketWithCustomOracles,
    createMarketWithInternalOracle,
    isMarketCreationPending,
    isMarketTxConfirming,
    marketTxHash,
    createdMarketAddress,
  } = usePerpetualCreateMarket()

  const handleAddSource = () => {
    setSources([...sources, { name: "binance", identifier: "", network: "" }])
  }

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  const handleSourceChange = (index: number, field: keyof OracleSource, value: string) => {
    const newSources = [...sources]
    newSources[index][field] = value
    setSources(newSources)
  }

  // Auto-populate identifiers based on token symbol
  const updateIdentifiers = (symbol: string) => {
    if (marketType === "custom") {
      setTokenPair(`${symbol}/USDT`)

      // Auto-populate source identifiers
      const newSources = [...sources]
      newSources.forEach((source, index) => {
        if (source.name === "binance") {
          newSources[index].identifier = `${symbol}USDT`
        } else if (source.name === "okx") {
          newSources[index].identifier = `${symbol}-USDT`
        }
      })
      setSources(newSources)
    }
  }

  // Auto-populate identifier based on the selected token
  const handleTokenSelection = (tokenSymbol: string) => {
    setSelectedToken(tokenSymbol)
    setCustomTokenAddress("")
    setCustomTokenSymbol("TOKEN")

    updateIdentifiers(tokenSymbol)
  }

  // Handle custom token address change
  const handleCustomTokenAddressChange = (value: string) => {
    setCustomTokenAddress(value)
    setSelectedToken("")

    // If in custom oracle mode and there's a valid address, populate identifiers
    if (marketType === "custom" && value.startsWith("0x")) {
      updateIdentifiers(customTokenSymbol)
    }
  }

  // Handle custom token symbol change
  const handleCustomTokenSymbolChange = (value: string) => {
    setCustomTokenSymbol(value)

    // Update identifiers if we have a custom address
    if (customTokenAddress && marketType === "custom") {
      updateIdentifiers(value)
    }
  }

  // Handle market type change
  const handleMarketTypeChange = (value: string) => {
    setMarketType(value)

    // Populate identifiers if we're switching to custom and have a token selected
    if (value === "custom") {
      if (selectedToken) {
        updateIdentifiers(selectedToken)
      } else if (customTokenAddress) {
        updateIdentifiers(customTokenSymbol)
      }
    }
  }

  const handleSubmit = async () => {
    let tokenAddress: HexAddress
    let tokenSymbol: string

    // Determine token address to use
    if (selectedToken) {
      const token = PREDEFINED_TOKENS.find((t) => t.symbol === selectedToken)
      if (!token) {
        toast.error("Selected token not found")
        return
      }
      tokenAddress = token.address as HexAddress
      tokenSymbol = selectedToken
    } else if (customTokenAddress) {
      if (!customTokenAddress.startsWith("0x") || customTokenAddress.length !== 42) {
        toast.error("Invalid token address format")
        return
      }
      tokenAddress = customTokenAddress as HexAddress
      tokenSymbol = customTokenSymbol || "TOKEN"
    } else {
      toast.error("Please select or enter a token")
      return
    }

    // Create market based on selected type
    try {
      if (marketType === "default") {
        await createMarketWithDefaultOracles(tokenAddress, tokenSymbol)
      } else if (marketType === "custom") {
        if (!tokenPair) {
          toast.error("Please enter a token pair")
          return
        }

        // Validate sources
        const validSources = sources.filter((s) => s.name && s.identifier)
        if (validSources.length === 0) {
          toast.error("Please add at least one valid oracle source")
          return
        }

        await createMarketWithCustomOracles(tokenAddress, tokenPair, validSources)
      } else {
        await createMarketWithInternalOracle(tokenAddress)
      }
    } catch (error) {
      console.error("Failed to create market:", error)
    }
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
      <main className="relative z-10 container mx-auto px-6 py-24">
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
              Create Perpetual Market
            </h1>
            <p className="text-cyan-100/80">Set up a new trading market for EVM tokens with oracle price feeds</p>
          </div>

          {/* Create Market Form */}
          <Card className="border-0 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-cyan-500/10">
            <CardHeader className="border-b border-cyan-500/10 pb-4">
              <CardTitle className="text-cyan-100">Market Configuration</CardTitle>
              <CardDescription className="text-cyan-100/70">
                Configure your market parameters and oracle sources
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              <Tabs value={marketType} onValueChange={handleMarketTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/60 p-1 border border-cyan-500/10">
                  <TabsTrigger
                    value="default"
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-none"
                  >
                    Default Oracles
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-none"
                  >
                    Custom Oracles
                  </TabsTrigger>
                  <TabsTrigger
                    value="internal"
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-none"
                  >
                    Internal Oracle
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="default" className="pt-4">
                  <div className="bg-slate-900/30 border border-cyan-500/10 rounded-md p-4">
                    <p className="text-sm text-cyan-100/70">
                      Creates a market with Binance and OKX as default price feeds for the selected token
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="pt-4">
                  <div className="bg-slate-900/30 border border-cyan-500/10 rounded-md p-4">
                    <p className="text-sm text-cyan-100/70">
                      Configure custom price feed sources for your market with specific identifiers
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="internal" className="pt-4">
                  <div className="bg-slate-900/30 border border-cyan-500/10 rounded-md p-4">
                    <p className="text-sm text-cyan-100/70">
                      Use the protocols internal oracle system for price discovery
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-cyan-100">Predefined Token</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="relative">
                          <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                          <Wallet className="w-5 h-5 text-cyan-400/60 relative z-10" />
                        </div>
                      </div>
                      <Select value={selectedToken} onValueChange={handleTokenSelection}>
                        <SelectTrigger className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all">
                          <SelectValue placeholder="Select a token" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-cyan-500/20">
                          {PREDEFINED_TOKENS.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cyan-100">Or Custom Token Address</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="relative">
                          <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                          <Droplets className="w-5 h-5 text-cyan-400/60 relative z-10" />
                        </div>
                      </div>
                      <Input
                        placeholder="0x..."
                        value={customTokenAddress}
                        onChange={(e) => handleCustomTokenAddressChange(e.target.value)}
                        className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {customTokenAddress && !selectedToken && (
                  <div className="space-y-2">
                    <Label className="text-cyan-100">Custom Token Symbol</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="relative">
                          <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                          <Droplets className="w-5 h-5 text-cyan-400/60 relative z-10" />
                        </div>
                      </div>
                      <Input
                        placeholder="e.g. TOKEN"
                        value={customTokenSymbol}
                        onChange={(e) => handleCustomTokenSymbolChange(e.target.value)}
                        className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                      />
                    </div>
                  </div>
                )}

                {marketType === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-cyan-100">Token Pair Name</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="relative">
                            <Hexagon className="w-6 h-6 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                            <Droplets className="w-5 h-5 text-cyan-400/60 relative z-10" />
                          </div>
                        </div>
                        <Input
                          placeholder="e.g. BTC/USDT"
                          value={tokenPair}
                          onChange={(e) => setTokenPair(e.target.value)}
                          className="pl-12 bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-cyan-100">Oracle Sources</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddSource}
                          className="border-cyan-500/20 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Source
                        </Button>
                      </div>

                      <div className="space-y-4 bg-slate-900/30 border border-cyan-500/10 rounded-md p-4">
                        {sources.map((source, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="space-y-2">
                              <Label className="text-cyan-100/80">Provider</Label>
                              <Select
                                value={source.name}
                                onValueChange={(value) => handleSourceChange(index, "name", value)}
                              >
                                <SelectTrigger className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all">
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-cyan-500/20">
                                  {ORACLE_PROVIDERS.map((provider) => (
                                    <SelectItem key={provider} value={provider}>
                                      {provider}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-cyan-100/80">Identifier</Label>
                              <Input
                                placeholder="e.g. BTCUSDT"
                                value={source.identifier}
                                onChange={(e) => handleSourceChange(index, "identifier", e.target.value)}
                                className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                              />
                            </div>

                            <div className="flex gap-2">
                              <div className="flex-1 space-y-2">
                                <Label className="text-cyan-100/80">Network (optional)</Label>
                                <Input
                                  placeholder="e.g. ethereum"
                                  value={source.network}
                                  onChange={(e) => handleSourceChange(index, "network", e.target.value)}
                                  className="bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all"
                                />
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="self-end hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                onClick={() => handleRemoveSource(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Success message */}
                {createdMarketAddress && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/25">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/10 blur-[12px] rounded-full"></div>
                        <Hexagon className="w-10 h-10 text-green-500/20 absolute -left-1 -top-1" />
                        <CheckCircle2 className="w-8 h-8 text-green-400 relative z-10" />
                      </div>
                      <div>
                        <p className="font-medium text-green-400">Market created successfully!</p>
                        <p className="text-sm text-cyan-100/60 break-all mt-1">
                          Market Address: {createdMarketAddress}
                        </p>
                        {marketTxHash && (
                          <a
                            href={`https://testnet.monadexplorer.com/address/${createdMarketAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View on Monad Explorer
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  className="w-full rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-10 shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
                  disabled={isMarketCreationPending || isMarketTxConfirming}
                >
                  {(isMarketCreationPending || isMarketTxConfirming) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isMarketCreationPending
                    ? "Preparing Transaction..."
                    : isMarketTxConfirming
                      ? "Creating Market..."
                      : "Create Market"}
                </Button>

                {marketTxHash && (
                  <div className="p-4 bg-slate-900/50 rounded-md mt-4 border border-cyan-500/20">
                    <p className="text-sm font-mono break-all text-cyan-100/80">Transaction Hash: {marketTxHash}</p>
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${marketTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-2 inline-block"
                    >
                      View on Monad Explorer
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

