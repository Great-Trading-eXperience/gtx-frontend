"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/table/data-table"
import { requestTokenColumns } from "@/components/table/faucet/request-token/columns"
import { wagmiConfig } from "@/configs/wagmi"
import { FAUCET_ADDRESS } from "@/constants/contract-address"
import { FAUCET_INDEXER_URL } from "@/constants/subgraph-url"
import { queryAddTokens, queryRequestTokens } from "@/graphql/faucet/faucet.query"
import { useFaucetCooldown } from "@/hooks/web3/faucet/useFaucetCooldown"
import { useLastRequestTime } from "@/hooks/web3/faucet/useLastRequestTime"
import { useRequestToken } from "@/hooks/web3/faucet/useRequestToken"
import { useBalance } from "@/hooks/web3/token/useBalance"
import type { AddTokensData } from "@/types/web3/faucet/add-token"
import type { RequestTokensData } from "@/types/web3/faucet/request-token"
import type { HexAddress } from "@/types/web3/general/address"
import type { Token } from "@/types/web3/tokens/token"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import { request } from "graphql-request"
import { Calendar, Clock, History, Wallet, Droplets, Hexagon } from "lucide-react"
import { DateTime } from "luxon"
import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"
import * as z from "zod"
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet"
import { FaucetSkeleton, WalletConnectionSkeleton } from "./skeleton-faucet"
import GradientLoader from "../gradient-loader/gradient-loader"

const faucetSchema = z.object({
  token: z.string().min(1),
})

const navItems = ["Spot", "Perpetual", "Earn", "Faucet"]

const GTXFaucet: NextPage = () => {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const [showConnectionLoader, setShowConnectionLoader] = useState(false)
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected) // Initialize with current connection state

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

  const form = useForm<z.infer<typeof faucetSchema>>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      token: "",
    },
  })
  const { watch } = form
  const selectedTokenAddress = watch("token")

  const { address: userAddress } = useAccount()

  const [availableTokens, setAvailableTokens] = useState<Record<string, Token>>({})

  const { balance: userBalance, error: userBalanceError } = useBalance(
    userAddress as HexAddress,
    selectedTokenAddress as HexAddress,
  )
  const { balance: faucetBalance, error: faucetBalanceError } = useBalance(
    FAUCET_ADDRESS as HexAddress,
    selectedTokenAddress as HexAddress,
  )
  const { lastRequestTime, error: lastRequestTimeError } = useLastRequestTime(
    userAddress as HexAddress,
    FAUCET_ADDRESS as HexAddress,
  )
  const { faucetCooldown, error: faucetCooldownError } = useFaucetCooldown(FAUCET_ADDRESS as HexAddress)

  const { isAlertOpen: isAlertRequestTokenOpen, handleRequestToken } = useRequestToken()

  const {
    data: addTokensData,
    isLoading: addTokensIsLoading,
    refetch: addTokensRefetch,
  } = useQuery<AddTokensData>({
    queryKey: ["addTokensData"],
    queryFn: async () => {
      return await request(FAUCET_INDEXER_URL as string, queryAddTokens)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  const {
    data: requestTokensData,
    isLoading: requestTokensIsLoading,
    refetch: requestTokensRefetch,
  } = useQuery<RequestTokensData>({
    queryKey: ["requestTokensData"],
    queryFn: async () => {
      return await request(FAUCET_INDEXER_URL as string, queryRequestTokens)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  const onSubmit = async (values: z.infer<typeof faucetSchema>) => {
    handleRequestToken(userAddress as HexAddress, selectedTokenAddress as HexAddress)
  }

  useEffect(() => {
    if (!addTokensData) {
      return
    }

    const fetchTokensData = async () => {
      const availableTokens: Record<string, Token> = {}

      await Promise.all(
        addTokensData.addTokens.items.map(async (addTokenData) => {
          let tokenName = ""
          let tokenSymbol = ""

          try {
            const tokenNameResult = await readContract(wagmiConfig, {
              address: addTokenData.address,
              abi: TokenABI,
              functionName: "name",
              args: [],
            })

            const tokenSymbolResult = await readContract(wagmiConfig, {
              address: addTokenData.address,
              abi: TokenABI,
              functionName: "symbol",
              args: [],
            })

            tokenName = tokenNameResult as string
            tokenSymbol = tokenSymbolResult as string
          } catch (err: unknown) {
            console.log("Error fetching token name of", addTokenData.address, err)
          }

          availableTokens[addTokenData.address] = {
            address: addTokenData.address,
            name: tokenName,
            symbol: tokenSymbol,
          }
        }),
      )

      setAvailableTokens(availableTokens)
    }

    fetchTokensData()
  }, [addTokensData])

  useEffect(() => {
    requestTokensRefetch()
  }, [requestTokensRefetch])

  // Show initial loading skeletons
  if (!mounted || isLoading) {
    return isConnected ? <FaucetSkeleton /> : <WalletConnectionSkeleton />
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
          <div className="space-y-6 w-full max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto relative">
              <div className="inline-flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-cyan-500/10 blur-[32px] rounded-full"></div>
                <div className="relative">
                  <Hexagon className="w-16 h-16 text-cyan-500 absolute -left-1 -top-1 opacity-20" />
                  <Droplets className="w-14 h-14 text-cyan-400 relative z-10" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                GTX Test Token Faucet
              </h1>
              <p className="text-cyan-100/80">Request test tokens for your blockchain development journey</p>
            </div>

            {/* Faucet Form */}
            <Card className="border-0 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-cyan-500/10">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Token Selection */}
                  <div className="space-y-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                        <FormField
                          control={form.control}
                          name="token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Select Token</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-900/50 border-cyan-500/10 focus:ring-cyan-400/20 hover:border-cyan-500/20 transition-all">
                                    <SelectValue placeholder="Choose a token" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900/95 border-white/10">
                                  {Object.keys(availableTokens)?.map((key) => (
                                    <SelectItem
                                      key={availableTokens[key].address}
                                      value={availableTokens[key].address}
                                      className="hover:bg-cyan-500/10"
                                    >
                                      {availableTokens[key].name} - {availableTokens[key].symbol}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-10 shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
                        >
                          Request Tokens
                        </Button>
                      </form>
                    </Form>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-2 border border-cyan-500/5 hover:border-cyan-500/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-500/10 blur-[12px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-cyan-500/20 absolute -left-1 -top-1" />
                          <Wallet className="w-8 h-8 text-cyan-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-100/70">Faucet Balance</p>
                          <p className="text-lg font-medium text-white">
                            {faucetBalance
                              ? `${formatUnits(BigInt(faucetBalance), 18)} ${availableTokens[selectedTokenAddress]?.symbol}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-2 border border-cyan-500/5 hover:border-cyan-500/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-500/10 blur-[12px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-cyan-500/20 absolute -left-1 -top-1" />
                          <Clock className="w-8 h-8 text-cyan-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-100/70">Cooldown</p>
                          <p className="text-lg font-medium text-white">
                            {faucetCooldown ? `${faucetCooldown}s` : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-2 border border-cyan-500/5 hover:border-cyan-500/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-500/10 blur-[12px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-cyan-500/20 absolute -left-1 -top-1" />
                          <Calendar className="w-8 h-8 text-cyan-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-100/70">Last Request</p>
                          <p className="text-lg font-medium text-white">
                            {lastRequestTime
                              ? DateTime.fromMillis(Number(lastRequestTime) * 1000).toFormat("HH:mm d LLLL yyyy")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-2 border border-cyan-500/5 hover:border-cyan-500/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-500/10 blur-[12px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-cyan-500/20 absolute -left-1 -top-1" />
                          <Wallet className="w-8 h-8 text-cyan-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-cyan-100/70">Your Balance</p>
                          <p className="text-lg font-medium text-white">
                            {userBalance
                              ? `${formatUnits(BigInt(userBalance), 18)} ${availableTokens[selectedTokenAddress]?.symbol}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[16px] rounded-full"></div>
                  <Hexagon className="w-12 h-12 text-cyan-500/20 absolute -left-1 -top-1" />
                  <History className="w-10 h-10 text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-2xl font-semibold text-cyan-50">Transaction History</h2>
              </div>

              <Card className="border-0 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <DataTable
                    data={requestTokensData?.requestTokens.items ?? []}
                    columns={requestTokenColumns()}
                    handleRefresh={() => {}}
                    isLoading={requestTokensIsLoading}
                  />
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
                  <Droplets className="w-16 h-16 text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                  Connect Wallet
                </h2>
                <p className="text-cyan-100/80 mb-8">Connect your wallet to access the faucet</p>
                <ButtonConnectWallet />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default GTXFaucet

