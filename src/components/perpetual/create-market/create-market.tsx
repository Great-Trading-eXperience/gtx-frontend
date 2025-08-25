"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { HexAddress } from "@/types/general/address"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, Hexagon, Wallet, Settings, History, Database } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationDialog } from "@/components/notification-dialog/notification-dialog"
import { Button } from "@/components/ui/button"
import { useAccount, useChainId } from "wagmi"
import GradientLoader from "@/components/gradient-loader/gradient-loader"
import { PrivyAuthButton } from "@/components/auth/privy-auth-button"
import { EXPLORER_URL } from "@/constants/explorer-url"
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address"
import { getTokenAddresses } from "@/helper/token-helper"
// Token addresses from example data
const TOKENS = {
    // EVM tokens
    WETH: getTokenAddresses().WETH,
    WBTC: getTokenAddresses().WBTC,
    USDC: getTokenAddresses().USDC,
}

// Oracle source options based on example data
const ORACLE_SOURCES = [
    { name: "geckoterminal", networks: ["eth", "solana"] },
    { name: "dexscreener", networks: ["ethereum", "solana"] },
    { name: "binance", networks: [""] },
    { name: "okx", networks: [""] },
]

// Token network mapping
const TOKEN_NETWORKS = {
    // EVM tokens
    WETH: { geckoterminal: "eth", dexscreener: "ethereum" },
    WBTC: { geckoterminal: "eth", dexscreener: "ethereum" },
    // Solana tokens
    SOL: { geckoterminal: "solana", dexscreener: "solana" },
    PWEASE: { geckoterminal: "solana", dexscreener: "solana" },
    TRUMP: { geckoterminal: "solana", dexscreener: "solana" },
}

const CreateMarketComponent: React.FC = () => {
    const chainId = useChainId()
    const defaultChainId = Number(DEFAULT_CHAIN)

    // Wallet connection and loading states
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { isConnected } = useAccount()
    const [showConnectionLoader, setShowConnectionLoader] = useState(false)
    const [previousConnectionState, setPreviousConnectionState] = useState(isConnected)

    // Form state
    const [longToken, setLongToken] = useState<string>("")
    const [longTokenSymbol, setLongTokenSymbol] = useState<string>("")
    const [shortToken, setShortToken] = useState<string>(TOKENS.USDC)
    const [shortTokenSymbol, setShortTokenSymbol] = useState<string>("USDT")
    const [marketName, setMarketName] = useState<string>("")

    // Oracle sources state - initialized with empty values
    const [oracleSources, setOracleSources] = useState([
        { name: "geckoterminal", identifier: "", network: "eth" },
        { name: "dexscreener", identifier: "", network: "ethereum" },
        { name: "binance", identifier: "", network: "" },
        { name: "okx", identifier: "", network: "" },
    ])

    // Notification state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState("")
    const [isNotificationSuccess, setIsNotificationSuccess] = useState(true)
    const [createMarketHash, setCreateMarketHash] = useState<string>("")

    // Transaction states (mock)
    const [isCreateMarketPending, setIsCreateMarketPending] = useState(false)
    const [isCreateMarketConfirming, setIsCreateMarketConfirming] = useState(false)
    const [isCreateMarketConfirmed, setIsCreateMarketConfirmed] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<{
        longToken?: string
        shortToken?: string
        marketName?: string
        oracleSources?: string
    }>({})

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

    // Update oracle source identifiers when longToken changes
    useEffect(() => {
        if (longToken && longTokenSymbol) {
            const updatedSources = [...oracleSources]

            // Get the appropriate networks for the token if available
            const networks = TOKEN_NETWORKS[longTokenSymbol as keyof typeof TOKEN_NETWORKS] || {
                geckoterminal: "eth",
                dexscreener: "ethereum"
            }

            // Update identifiers based on token selection
            updatedSources[0].identifier = longToken
            updatedSources[0].network = networks.geckoterminal

            updatedSources[1].identifier = longToken
            updatedSources[1].network = networks.dexscreener

            updatedSources[2].identifier = `${longTokenSymbol}${shortTokenSymbol}`
            updatedSources[2].network = ""

            updatedSources[3].identifier = `${longTokenSymbol}-${shortTokenSymbol}`
            updatedSources[3].network = ""

            setOracleSources(updatedSources)

            // Update market name
            setMarketName(`${longTokenSymbol}/${shortTokenSymbol}`)
        }
    }, [longToken, longTokenSymbol, shortTokenSymbol])

    // Form validation
    const validateForm = (): boolean => {
        const newErrors: {
            longToken?: string
            shortToken?: string
            marketName?: string
        } = {}

        // Validate longToken
        if (!longToken) {
            newErrors.longToken = "Long token is required"
        }

        // Validate shortToken
        if (!shortToken) {
            newErrors.shortToken = "Short token is required"
        }

        // Validate market name
        if (!marketName) {
            newErrors.marketName = "Market name is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Form submission (mock implementation)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        // Convert values to appropriate types
        const longTokenAddress = longToken as HexAddress
        const shortTokenAddress = shortToken as HexAddress

        // Format the data similar to the smart contract inputs
        const sourcesForContract = oracleSources.filter(source =>
            source.identifier !== "" && source.name !== ""
        )

        console.log("Creating market with parameters:", {
            longToken: longTokenAddress,
            shortToken: shortTokenAddress,
            marketName,
            sources: sourcesForContract,
        })

        // This would call the actual contract function in a real implementation:
        // Router(router).createMarket(longToken, shortToken, marketName, sources)

        // Mock transaction flow
        setIsCreateMarketPending(true)

        setTimeout(() => {
            setIsCreateMarketPending(false)
            setIsCreateMarketConfirming(true)

            setTimeout(() => {
                setIsCreateMarketConfirming(false)
                setIsCreateMarketConfirmed(true)
                setCreateMarketHash("0x" + Math.random().toString(16).substr(2, 64))

                // Show success notification
                setNotificationMessage(`Market ${marketName} created successfully!`)
                setIsNotificationSuccess(true)
                setIsNotificationOpen(true)
            }, 2000)
        }, 2000)
    }

    // Handler for closing notification
    const handleCloseNotification = () => {
        setIsNotificationOpen(false)
    }

    const updateOracleSource = (index: number, field: string, value: string) => {
        const updatedSources = [...oracleSources]
        updatedSources[index] = { ...updatedSources[index], [field]: value }
        setOracleSources(updatedSources)
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

    const isFormLoading = isCreateMarketPending || isCreateMarketConfirming

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
                                    <Database className="w-14 h-14 text-cyan-400 relative z-10" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                                Create Trading Market
                            </h1>
                            <p className="text-cyan-100/80">Configure a new market with long and short tokens</p>
                        </div>

                        {/* Create Market Form */}
                        <Card className="border-0 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-cyan-500/10">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Long Token (Base) */}
                                        <div className="space-y-2">
                                            <Label htmlFor="longToken" className="text-gray-300">
                                                Long Token
                                            </Label>
                                            <Select
                                                onValueChange={(value) => {
                                                    setLongTokenSymbol(value)
                                                    setLongToken(TOKENS[value as keyof typeof TOKENS])
                                                }}
                                                value={longTokenSymbol}
                                            >
                                                <SelectTrigger
                                                    id="longToken"
                                                    className={`bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.longToken ? "border-red-500" : ""}`}
                                                >
                                                    <SelectValue placeholder="Select long token" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900/95 border-white/10">
                                                    <SelectItem value="WETH" className="hover:bg-cyan-500/10">
                                                        WETH
                                                    </SelectItem>
                                                    <SelectItem value="WBTC" className="hover:bg-cyan-500/10">
                                                        WBTC
                                                    </SelectItem>
                                                    <SelectItem value="SOL" className="hover:bg-cyan-500/10">
                                                        SOL
                                                    </SelectItem>
                                                    <SelectItem value="TRUMP" className="hover:bg-cyan-500/10">
                                                        TRUMP
                                                    </SelectItem>
                                                    <SelectItem value="PWEASE" className="hover:bg-cyan-500/10">
                                                        PWEASE
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {longToken && <p className="text-xs text-cyan-100/60">Address: {longToken}</p>}
                                            {errors.longToken && <p className="text-sm text-red-400">{errors.longToken}</p>}
                                        </div>

                                        {/* Short Token (Quote) */}
                                        <div className="space-y-2">
                                            <Label htmlFor="shortToken" className="text-gray-300">
                                                Short Token
                                            </Label>
                                            <Select
                                                onValueChange={(value) => {
                                                    setShortTokenSymbol(value)
                                                    setShortToken(TOKENS[value as keyof typeof TOKENS])
                                                }}
                                                value={shortTokenSymbol}
                                            >
                                                <SelectTrigger
                                                    id="shortToken"
                                                    className={`bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.shortToken ? "border-red-500" : ""}`}
                                                >
                                                    <SelectValue placeholder="Select short token" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900/95 border-white/10">
                                                    <SelectItem value="USDT" className="hover:bg-cyan-500/10">
                                                        USDT
                                                    </SelectItem>
                                                    <SelectItem value="USDC" className="hover:bg-cyan-500/10">
                                                        USDC
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {shortToken && <p className="text-xs text-cyan-100/60">Address: {shortToken}</p>}
                                            {errors.shortToken && <p className="text-sm text-red-400">{errors.shortToken}</p>}
                                        </div>

                                        {/* Market Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="marketName" className="text-gray-300">
                                                Market Name
                                            </Label>
                                            <Input
                                                id="marketName"
                                                placeholder="Enter market name (e.g. WBTC/USDT)"
                                                value={marketName}
                                                onChange={(e) => setMarketName(e.target.value)}
                                                disabled={isFormLoading}
                                                className={`bg-slate-900/50 border-blue-500/25 focus:ring-cyan-400/20 hover:border-cyan-500/40 transition-all ${errors.marketName ? "border-red-500" : ""}`}
                                            />
                                            {errors.marketName && <p className="text-sm text-red-400">{errors.marketName}</p>}
                                        </div>

                                        {/* Oracle Sources Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-gray-300 font-medium">Oracle Price Sources</Label>
                                                <div className="bg-cyan-500/20 text-cyan-300 text-xs rounded-full px-2 py-0.5">
                                                    Required
                                                </div>
                                            </div>

                                            <Card className="border border-cyan-500/20 bg-slate-900/50">
                                                <CardContent className="p-4 space-y-4">
                                                    {oracleSources.map((source, index) => (
                                                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                                            <div className="col-span-4">
                                                                <Label htmlFor={`source-${index}-name`} className="text-xs text-gray-400 mb-1 block">
                                                                    Source
                                                                </Label>
                                                                <Input
                                                                    id={`source-${index}-name`}
                                                                    value={source.name}
                                                                    disabled
                                                                    className="bg-slate-900/50 text-sm border-blue-500/20 h-9"
                                                                />
                                                            </div>
                                                            <div className="col-span-5">
                                                                <Label htmlFor={`source-${index}-identifier`} className="text-xs text-gray-400 mb-1 block">
                                                                    Identifier
                                                                </Label>
                                                                <Input
                                                                    id={`source-${index}-identifier`}
                                                                    value={source.identifier}
                                                                    onChange={(e) => updateOracleSource(index, 'identifier', e.target.value)}
                                                                    disabled={isFormLoading}
                                                                    className="bg-slate-900/50 text-sm border-blue-500/20 h-9"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Label htmlFor={`source-${index}-network`} className="text-xs text-gray-400 mb-1 block">
                                                                    Network
                                                                </Label>
                                                                <Input
                                                                    id={`source-${index}-network`}
                                                                    value={source.network}
                                                                    onChange={(e) => updateOracleSource(index, 'network', e.target.value)}
                                                                    disabled={isFormLoading}
                                                                    className="bg-slate-900/50 text-sm border-blue-500/20 h-9"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                            <p className="text-xs text-cyan-100/60">
                                                Price sources will be used to determine the market price for trading pairs
                                            </p>
                                        </div>
                                    </div>

                                    {isCreateMarketConfirmed && (
                                        <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/25">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-green-500/10 blur-[12px] rounded-full"></div>
                                                    <Hexagon className="w-10 h-10 text-green-500/20 absolute -left-1 -top-1" />
                                                    <CheckCircle2 className="w-8 h-8 text-green-400 relative z-10" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-green-400">Market created successfully!</p>
                                                    {createMarketHash && (
                                                        <a
                                                            href={`https://testnet-explorer.riselabs.xyz/tx/${createMarketHash}`}
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
                                                {isCreateMarketPending
                                                    ? "Waiting for confirmation..."
                                                    : isCreateMarketConfirming
                                                        ? "Processing transaction..."
                                                        : "Creating market..."}
                                            </>
                                        ) : (
                                            "Create Market"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Market Creation History Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-[16px] rounded-full"></div>
                                    <Hexagon className="w-12 h-12 text-cyan-500/20 absolute -left-1 -top-1" />
                                    <History className="w-10 h-10 text-cyan-400 relative z-10" />
                                </div>
                                <h2 className="text-2xl font-semibold text-cyan-50">Market Creation History</h2>
                            </div>

                            <Card className="border-0 bg-white/5 backdrop-blur-xl">
                                <CardContent className="p-6">
                                    <div className="text-center py-8 text-cyan-100/60">
                                        <p>Your market creation history will appear here</p>
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
                                    <Database className="w-16 h-16 text-cyan-400 relative z-10" />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                                    Connect Wallet
                                </h2>
                                <p className="text-cyan-100/80 mb-8">Connect your wallet to create a trading market</p>
                                <PrivyAuthButton showFullProfile={false} />
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
                txHash={createMarketHash}
                explorerBaseUrl={EXPLORER_URL(chainId ?? defaultChainId)}
            />
        </div>
    )
}

export default CreateMarketComponent