"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { DataTable } from "@/components/table/data-table"
import { requestTokenColumns } from "@/components/table/faucet/request-token/columns"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { wagmiConfig } from "@/configs/wagmi"
import { getIndexerUrl } from "@/constants/urls/urls-config"
import { queryFaucetTokenss, queryRequestTokenss } from "@/graphql/faucet/faucet.query"
import { useFaucetCooldown } from "@/hooks/web3/faucet/useFaucetCooldown"
import { useLastRequestTime } from "@/hooks/web3/faucet/useLastRequestTime"
import { usePrivyRequestToken } from "@/hooks/web3/faucet/usePrivyRequestToken"
import { useBalance } from "@/hooks/web3/token/useBalance"
import type { HexAddress } from "@/types/general/address"
import type { Token } from "@/types/tokens/token"

import { ContractName, DEFAULT_CHAIN, getContractAddress } from "@/constants/contract/contract-address"
import { FaucetTokensData } from "@/types/faucet/add-token"
import { FaucetRequestsData } from "@/types/faucet/request-token"
import { Button } from "@heroui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import { request } from "graphql-request"
import { Calendar, Clock, Droplets, ExternalLink, Hexagon, History, RefreshCw, Wallet } from "lucide-react"
import { DateTime } from "luxon"
import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { useAccount, useChainId } from "wagmi"
import { useWallets } from "@privy-io/react-auth"
import * as z from "zod"
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet"
import GradientLoader from "../gradient-loader/gradient-loader"
import { DotPattern } from "../magicui/dot-pattern"
import { FaucetSkeleton, WalletConnectionSkeleton } from "./skeleton-faucet"
import { formatNumber } from "@/lib/utils"

const faucetSchema = z.object({
  token: z.string().min(1),
})

const GTXFaucet: NextPage = () => {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const [showConnectionLoader, setShowConnectionLoader] = useState(false)
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected)
  
  // Transaction status
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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

  const form = useForm<z.infer<typeof faucetSchema>>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      token: "",
    },
  })
  const { watch } = form
  const selectedTokenAddress = watch("token")

  const { address: wagmiAddress } = useAccount()
  const { wallets } = useWallets()
  
  // Get Privy wallet address (prioritize embedded wallet)
  const privyWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
  const userAddress = privyWallet?.address || wagmiAddress

  // Log which address is being used
  useEffect(() => {
    if (userAddress) {
      console.log('[Faucet] Using address:', userAddress);
      console.log('[Faucet] Address source:', privyWallet?.address ? 'Privy wallet' : 'Wagmi address');
      console.log('[Faucet] Privy wallet type:', privyWallet?.walletClientType);
    }
  }, [userAddress, privyWallet?.address, privyWallet?.walletClientType])

  const [availableTokens, setAvailableTokens] = useState<Record<string, Token>>({})

  const { balance: userBalance, error: userBalanceError } = useBalance(
    userAddress as HexAddress,
    selectedTokenAddress as HexAddress,
  )

  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const faucetAddress = getContractAddress(chainId ?? defaultChainId, ContractName.faucet) as HexAddress

  const { balance: faucetBalance, error: faucetBalanceError } = useBalance(
    faucetAddress,
    selectedTokenAddress as HexAddress,
  )
  const { lastRequestTime, error: lastRequestTimeError } = useLastRequestTime(userAddress as HexAddress)
  const { faucetCooldown, error: faucetCooldownError } = useFaucetCooldown(faucetAddress)

  const { 
    isAlertOpen: isAlertRequestTokenOpen, 
    handleRequestToken,
    isRequestTokenPending,
    isRequestTokenConfirming,
    isRequestTokenConfirmed,
    requestTokenHash,
    requestTokenError
  } = usePrivyRequestToken(userAddress as HexAddress)

  // Update processing state based on token request state
  useEffect(() => {
    if (isRequestTokenPending) {
      setIsProcessing(true)
      setTxStatus('Preparing token request...')
    } else if (isRequestTokenConfirming) {
      setTxStatus('Confirming transaction...')
    } else if (isRequestTokenConfirmed && requestTokenHash) {
      setTxHash(requestTokenHash)
      setTxStatus('Token request completed successfully!')
      setIsProcessing(false)
    } else if (requestTokenError) {
      setTxStatus(`Token request failed: ${requestTokenError.message}`)
      setIsProcessing(false)
    }
  }, [isRequestTokenPending, isRequestTokenConfirming, isRequestTokenConfirmed, requestTokenHash, requestTokenError])

  const {
    data: faucetTokensData,
    isLoading: addTokensIsLoading,
    refetch: addTokensRefetch,
  } = useQuery<FaucetTokensData>({
    queryKey: ["faucetTokensData"],
    queryFn: async () => {
      const url = getIndexerUrl(chainId ?? defaultChainId);
      if (!url) throw new Error('Indexer URL not found');
      return await request(url, queryFaucetTokenss)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    enabled: mounted,
  })

  const {
    data: faucetRequestsData,
    isLoading: faucetRequestsIsLoading,
    refetch: faucetRequestsRefetch,
  } = useQuery<FaucetRequestsData>({
    queryKey: ["faucetRequestsData"],
    queryFn: async () => {
      const url = getIndexerUrl(DEFAULT_CHAIN);
      if (!url) throw new Error('Indexer URL not found');
      return await request(url, queryRequestTokenss)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    enabled: mounted,
  })

  const onSubmit = async (values: z.infer<typeof faucetSchema>) => {
    handleRequestToken(userAddress as HexAddress, selectedTokenAddress as HexAddress)
  }

  useEffect(() => {
    if (!faucetTokensData || !mounted) {
      return
    }

    const fetchTokensData = async () => {
      const availableTokens: Record<string, Token> = {}

      await Promise.all(
        faucetTokensData.faucetTokenss.items.map(async (faucetToken) => {
          let tokenName = ""
          let tokenSymbol = ""
          let tokenDecimals = 18

          try {
            const tokenNameResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "name",
              args: [],
            })

            const tokenSymbolResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "symbol",
              args: [],
            })

            const tokenDecimalsResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "decimals",
              args: [],
            })

            tokenName = tokenNameResult as string
            tokenSymbol = tokenSymbolResult as string
            tokenDecimals = tokenDecimalsResult as number
          } catch (err: unknown) {
            console.log("Error fetching token metadata of", faucetToken.token, err)
          }

          availableTokens[faucetToken.token] = {
            address: faucetToken.token,
            name: tokenName,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          }
        }),
      )

      setAvailableTokens(availableTokens)
    }

    fetchTokensData()
  }, [faucetTokensData, mounted])

  useEffect(() => {
    if (mounted) {
      faucetRequestsRefetch()
    }
  }, [faucetRequestsRefetch, mounted])

  if (showConnectionLoader) {
    return <GradientLoader />
  }

  if (!mounted || isLoading) {
    return isConnected ? <FaucetSkeleton /> : <WalletConnectionSkeleton />
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hexagonal Grid Pattern */}
      <DotPattern />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse blur-[2px]"></div>
          <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse delay-75 blur-[1px]"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-blue-300/40 rounded-full animate-pulse delay-150 blur-[2px]"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-pulse delay-300 blur-[1px]"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400/40 rounded-full animate-pulse delay-500 blur-[1px]"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {isConnected ? (
          <div className="space-y-6 w-full max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto relative">
              <div className="inline-flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-[32px] rounded-full"></div>
                <div className="relative">
                  <Hexagon className="w-16 h-16 text-blue-600 absolute -left-1 -top-1 opacity-20" />
                  <Droplets className="w-14 h-14 text-blue-500 relative z-10" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                GTX Test Token Faucet
              </h1>
              <p className="text-white/80">Request test tokens for your blockchain development journey</p>
            </div>

            <Card className="border-0 bg-[#121212] backdrop-blur-xl shadow-[0_0_15px_rgba(56,189,248,0.03)] border border-white/20">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
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
                                  <SelectTrigger className="bg-[#1A1A1A] border-white/20 focus:ring-blue-400/20 hover:border-blue-500/40 transition-all">
                                    <SelectValue placeholder="Choose a token" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#1A1A1A] border-white/10">
                                  {Object.keys(availableTokens)?.map((key) => (
                                    <SelectItem
                                      key={availableTokens[key].address}
                                      value={availableTokens[key].address}
                                      className="hover:bg-blue-500/10"
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
                          className="w-full rounded-md bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 from-blue-600 to-blue-700 text-white h-10 shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
                        >
                          Request Tokens
                        </Button>
                      </form>
                    </Form>

                    {/* Status display */}
                    {txStatus && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-200">{txStatus}</div>
                          {isProcessing && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
                        </div>
                        {txHash && (
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View On Explorer
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1A1A1A] rounded-lg p-2 border border-white/20 hover:border-blue-500/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[12px] rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-blue-500/20 absolute -left-1 -top-1" />
                          <Wallet className="w-8 h-8 text-blue-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Faucet Balance</p>
                          <p className="text-lg font-medium text-white">
                            {faucetBalance && availableTokens[selectedTokenAddress]
                              ? `${formatNumber(Number(formatUnits(BigInt(faucetBalance), availableTokens[selectedTokenAddress].decimals)), {

                                decimals: 2,
                                compact: true,
                              })} ${availableTokens[selectedTokenAddress]?.symbol}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-2 border border-white/20 hover:border-blue-500/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[12px] rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-blue-500/20 absolute -left-1 -top-1" />
                          <Clock className="w-8 h-8 text-blue-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Cooldown</p>
                          <p className="text-lg font-medium text-white">
                            {faucetCooldown ? `${faucetCooldown}s` : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-2 border border-white/20 hover:border-blue-500/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[12px] rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-blue-500/20 absolute -left-1 -top-1" />
                          <Calendar className="w-8 h-8 text-blue-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Last Request</p>
                          <p className="text-lg font-medium text-white">
                            {lastRequestTime
                              ? DateTime.fromMillis(Number(lastRequestTime) * 1000).toFormat("HH:mm d LLLL yyyy")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-2 border border-white/20 hover:border-blue-500/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[12px] rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                          <Hexagon className="w-10 h-10 text-blue-500/20 absolute -left-1 -top-1" />
                          <Wallet className="w-8 h-8 text-blue-400 relative z-10" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Your Balance</p>
                          <p className="text-lg font-medium text-white">
                            {userBalance && availableTokens[selectedTokenAddress]
                              ? `${formatNumber(Number(formatUnits(BigInt(userBalance), availableTokens[selectedTokenAddress].decimals)), {
                                decimals: 2,
                                compact: true,
                              })} ${availableTokens[selectedTokenAddress]?.symbol}`
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
                  <div className="absolute inset-0 bg-blue-500/10 blur-[16px] rounded-full"></div>
                  <Hexagon className="w-12 h-12 text-blue-500/20 absolute -left-1 -top-1" />
                  <History className="w-10 h-10 text-blue-400 relative z-10" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Transaction History</h2>
              </div>

              <Card className="border-0 bg-[#121212] backdrop-blur-xl border border-white/10">
                <CardContent className="p-6">
                  <DataTable
                    data={faucetRequestsData?.faucetRequestss.items ?? []}
                    columns={requestTokenColumns()}
                    handleRefresh={() => { }}
                    isLoading={faucetRequestsIsLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="border-0 bg-[#121212] backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-white/20">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[24px] rounded-full"></div>
                  <Hexagon className="w-20 h-20 text-blue-500/20 absolute -left-2 -top-2" />
                  <Droplets className="w-16 h-16 text-blue-500 relative z-10" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-4">
                  Connect Wallet
                </h2>
                <p className="text-white/80 mb-8">Connect your wallet to access the faucet</p>
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