"use client"

import TokenABI from "@/abis/tokens/TokenABI"
import { DataTable } from "@/components/table/data-table"
import { requestTokenColumns } from "@/components/table/faucet/request-token/columns"
import { wagmiConfig } from "@/configs/wagmi"
import { getIndexerUrl } from "@/constants/urls/urls-config"
import { queryFaucetTokenss, queryRequestTokenss } from "@/graphql/faucet/faucet.query"
import { useFaucetCooldown } from "@/hooks/web3/faucet/useFaucetCooldown"
import { useLastRequestTime } from "@/hooks/web3/faucet/useLastRequestTime"
import { usePrivyRequestToken } from "@/hooks/web3/faucet/usePrivyRequestToken"
import { useRequestToken } from "@/hooks/web3/faucet/useRequestToken"
import { useBalance } from "@/hooks/web3/token/useBalance"
import type { HexAddress } from "@/types/general/address"
import type { Token } from "@/types/tokens/token"

import { ContractName, DEFAULT_CHAIN, getContractAddress } from "@/constants/contract/contract-address"
import { shouldFaucetUsePrivy, shouldFaucetUseStandardHook } from "@/constants/features/features-config"
import { formatNumber } from "@/lib/utils"
import { FaucetTokensData } from "@/types/faucet/add-token"
import { FaucetRequestsData } from "@/types/faucet/request-token"
import { Button } from "@heroui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useWallets } from "@privy-io/react-auth"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import { request } from "graphql-request"
import { Calendar, Clock, Droplets, ExternalLink, History, RefreshCw, TrendingUp, Wallet } from "lucide-react"
import { DateTime } from "luxon"
import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { useAccount, useChainId } from "wagmi"
import * as z from "zod"
import { PrivyAuthButton } from "../auth/privy-auth-button"
import GradientLoader from "../gradient-loader/gradient-loader"
import { DotPattern } from "../magicui/dot-pattern"
import { FaucetSkeleton, WalletConnectionSkeleton } from "./skeleton-faucet"

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
  
  // Check if faucet should use Privy
  const shouldUsePrivy = shouldFaucetUsePrivy()
  
  // Get user address based on configuration
  const privyWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
  const userAddress = shouldUsePrivy ? (privyWallet?.address || wagmiAddress) : wagmiAddress

  // Log which address is being used
  useEffect(() => {
    if (userAddress) {
      console.log('[Faucet] Configuration - Use Privy:', shouldUsePrivy);
      console.log('[Faucet] Using address:', userAddress);
      
      if (shouldUsePrivy) {
        console.log('[Faucet] Address source:', privyWallet?.address ? 'Privy wallet' : 'Wagmi fallback');
        console.log('[Faucet] Privy wallet type:', privyWallet?.walletClientType);
      } else {
        console.log('[Faucet] Address source: Wagmi only (Privy disabled)');
      }
    }
  }, [userAddress, privyWallet?.address, privyWallet?.walletClientType, shouldUsePrivy])

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

  // Conditionally use the appropriate hook based on crosschain feature flag
  const useCrosschainStandardHook = shouldFaucetUseStandardHook();
  
  console.log('[Faucet] Hook selection:', {
    useCrosschainStandardHook,
    willUseStandardHook: useCrosschainStandardHook,
    willUsePrivyHook: !useCrosschainStandardHook
  });

  // Standard Wagmi hook (used when crosschain is enabled)
  const standardHookResult = useRequestToken();
  
  // Privy hook (used when crosschain is disabled)
  const privyHookResult = usePrivyRequestToken(userAddress as HexAddress);
  
  // Select the appropriate hook result
  const {
    isAlertOpen: isAlertRequestTokenOpen, 
    handleRequestToken,
    isRequestTokenPending,
    isRequestTokenConfirming,
    isRequestTokenConfirmed,
    requestTokenHash,
    requestTokenError
  } = useCrosschainStandardHook ? {
    isAlertOpen: standardHookResult.isAlertOpen,
    handleRequestToken: standardHookResult.handleRequestToken,
    isRequestTokenPending: standardHookResult.isRequestTokenPending,
    isRequestTokenConfirming: standardHookResult.isRequestTokenConfirming,
    isRequestTokenConfirmed: standardHookResult.isRequestTokenConfirmed,
    requestTokenHash: standardHookResult.requestTokenHash,
    requestTokenError: undefined // Standard hook doesn't have error in same format
  } : {
    isAlertOpen: privyHookResult.isAlertOpen,
    handleRequestToken: privyHookResult.handleRequestToken,
    isRequestTokenPending: privyHookResult.isRequestTokenPending,
    isRequestTokenConfirming: privyHookResult.isRequestTokenConfirming,
    isRequestTokenConfirmed: privyHookResult.isRequestTokenConfirmed,
    requestTokenHash: privyHookResult.requestTokenHash,
    requestTokenError: privyHookResult.requestTokenError
  };

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

  // Hardcoded token mapping for fallback when symbol is empty
  // Normalized addresses to lowercase for better matching
  const hardcodedTokenMapping: Record<string, { name: string; symbol: string }> = {
    "0x1362Dd75d8F1579a0Ebd62DF92d8F3852C3a7516": { name: "Tether USD", symbol: "USDT" },
    "0x02950119C4CCD1993f7938A55B8Ab8384C3CcE4F": { name: "Wrapped Ether", symbol: "WETH" },
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
            console.log(`[Faucet] Fetching metadata for token ${faucetToken.token} on chain ${chainId}`);
            
            const tokenNameResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "name",
              args: [],
              chainId: chainId ?? defaultChainId,
            })

            const tokenSymbolResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "symbol",
              args: [],
              chainId: chainId ?? defaultChainId,
            })

            const tokenDecimalsResult = await readContract(wagmiConfig, {
              address: faucetToken.token,
              abi: TokenABI,
              functionName: "decimals",
              args: [],
              chainId: chainId ?? defaultChainId,
            })

            // Check for empty responses
            if (tokenNameResult && tokenNameResult !== "0x") {
              tokenName = tokenNameResult as string
            }
            if (tokenSymbolResult && tokenSymbolResult !== "0x") {
              tokenSymbol = tokenSymbolResult as string
            }
            if (tokenDecimalsResult) {
              tokenDecimals = tokenDecimalsResult as number
            }

            console.log(`[Faucet] Token metadata fetched:`, {
              address: faucetToken.token,
              name: tokenName || 'empty',
              symbol: tokenSymbol || 'empty', 
              decimals: tokenDecimals
            });

          } catch (err: unknown) {
            console.warn(`[Faucet] Error fetching token metadata:`, {
              chainId: chainId ?? defaultChainId,
              contractAddress: faucetToken.token,
              error: err
            });
            console.log(`[Faucet] Will attempt to use hardcoded mapping for ${faucetToken.token}`);
          }

          // Use hardcoded mapping when symbol is empty
          if (!tokenSymbol && hardcodedTokenMapping[faucetToken.token]) {
            console.log(`[Faucet] Using hardcoded mapping for ${faucetToken.token}:`, hardcodedTokenMapping[faucetToken.token]);
            tokenName = hardcodedTokenMapping[faucetToken.token].name
            tokenSymbol = hardcodedTokenMapping[faucetToken.token].symbol
          } else if (!tokenSymbol) {
            console.warn(`[Faucet] No hardcoded mapping found for ${faucetToken.token} on chain ${chainId ?? defaultChainId}`);
          }

          const finalTokenData = {
            address: faucetToken.token,
            name: tokenName,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          };

          console.log(`[Faucet] Final token data for ${faucetToken.token}:`, finalTokenData);
          availableTokens[faucetToken.token] = finalTokenData;
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
    <div className="px-6 py-12 mx-auto bg-black min-h-screen">
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <DotPattern />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {isConnected ? (
          <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <h2 className="text-white text-4xl font-bold tracking-tight text-start">
                Token Faucet
                <br />
                <span className="text-white/70 text-base font-normal mt-2 block">
                  Request test tokens
                </span>
              </h2>
            </div>

            {/* Main Faucet Card */}
            <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
              {/* Header with Icon */}
              <div className="flex items-center gap-3 p-6 border-b border-white/10">
                <TrendingUp className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium text-lg">Request Tokens</span>
              </div>

              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Token Request Form */}
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <label className="text-white/70 text-sm font-medium uppercase tracking-wider block mb-3">
                          Select Token
                        </label>
                        <select
                          value={selectedTokenAddress}
                          onChange={(e) => form.setValue('token', e.target.value)}
                          className="w-full h-12 bg-black/40 border border-white/20 text-white hover:border-white/40 focus:ring-1 focus:ring-white/40 focus:border-white/40 rounded-xl px-4 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Choose a token to request</option>
                          {Object.keys(availableTokens)?.map((key) => (
                            <option
                              key={availableTokens[key].address}
                              value={availableTokens[key].address}
                              className="bg-black text-white"
                            >
                              {availableTokens[key].name} ({availableTokens[key].symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        onClick={() => onSubmit({ token: selectedTokenAddress })}
                        disabled={isProcessing || isRequestTokenPending || isRequestTokenConfirming || !selectedTokenAddress}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium text-lg rounded-xl transition-colors"
                      >
                        {isRequestTokenPending
                          ? 'Confirming in Wallet...'
                          : isRequestTokenConfirming
                            ? 'Confirming...'
                            : isProcessing
                              ? 'Processing...'
                              : 'Request Tokens'}
                      </Button>
                    </div>

                    {/* Status Display */}
                    {txStatus && (
                      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/90">{txStatus}</div>
                          {isProcessing && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                        </div>
                        {txHash && (
                          <a
                            href={`https://appchaintestnet.explorer.caldera.xyz/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View on Explorer <ExternalLink className="ml-1 w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Faucet Balance</p>
                          <p className="text-white font-mono text-sm">
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

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Cooldown</p>
                          <p className="text-white font-mono text-sm">
                            {faucetCooldown ? `${faucetCooldown}s` : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Last Request</p>
                          <p className="text-white font-mono text-sm">
                            {lastRequestTime
                              ? DateTime.fromMillis(Number(lastRequestTime) * 1000).toFormat("dd/MM/yy")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Your Balance</p>
                          <p className="text-white font-mono text-sm">
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
              </div>
            </div>

            {/* Transaction History */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-white/70" />
                <h3 className="text-white text-2xl font-bold tracking-tight">Transaction History</h3>
              </div>

              <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
                <div className="p-6">
                  <DataTable
                    data={faucetRequestsData?.faucetRequestss.items ?? []}
                    columns={requestTokenColumns()}
                    handleRefresh={() => { }}
                    isLoading={faucetRequestsIsLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-md w-full">
              <div className="p-12 text-center">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Droplets className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <h2 className="text-white text-3xl font-bold tracking-tight mb-4">
                  Connect Wallet
                </h2>
                <p className="text-white/70 mb-8">Connect your wallet to access the test token faucet</p>
                <PrivyAuthButton showFullProfile={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GTXFaucet