"use client"

import ERC20ABI from "@/abis/tokens/ERC20ABI"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
import Link from "next/link"
import { ConnectButton } from "@rainbow-me/rainbowkit"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "@wagmi/core"
import { request } from "graphql-request"
import { Calendar, Clock, History, Wallet, Droplets } from "lucide-react"
import { DateTime } from "luxon"
import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"
import * as z from "zod"

const faucetSchema = z.object({
  token: z.string().min(1),
})

const navItems = ["Spot", "Perpetual", "Earn", "Faucet"]

const GTXFaucet: NextPage = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<z.infer<typeof faucetSchema>>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      token: "",
    },
  })
  const { watch } = form
  const selectedTokenAddress = watch("token")

  const { address: userAddress, isConnected } = useAccount()

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
              abi: ERC20ABI,
              functionName: "name",
              args: [],
            })

            const tokenSymbolResult = await readContract(wagmiConfig, {
              address: addTokenData.address,
              abi: ERC20ABI,
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

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white">
      <header className="px-4 py-4 bg-black/50 backdrop-blur-md shadow-2xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo/gtx-white.png" className="h-10" alt="GTX Logo" />
            <span className="text-3xl font-bold bg-clip-text text-white bg-gradient-to-r from-blue-400 to-cyan-300">
              GTX
            </span>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-blue-500/10 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="space-y-6 w-full max-w-7xl mx-auto">
          {isConnected ? (
            <>
              <div className="text-start space-y-4">
                <div className="flex items-center gap-3">
                  <Droplets className="w-10 h-10 text-blue-400" />
                  <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    GTX Faucet
                  </h1>
                </div>
                <p className="text-xl text-gray-300">
                  Request test tokens for your blockchain development needs
                </p>
              </div>

              <Card className="border-blue-500/20 bg-black/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-200">Select Token</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-blue-500/20 bg-black/30">
                                  <SelectValue placeholder="Choose a token" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-black/90 border-blue-500/20">
                                {Object.keys(availableTokens)?.map((key: string) => (
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-blue-500/20 bg-black/30">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Wallet className="text-blue-400" />
                            <div>
                              <p className="text-sm text-gray-300">Faucet Balance</p>
                              <p className="text-lg">
                                {faucetBalance
                                  ? `${formatUnits(BigInt(faucetBalance), 18)} ${availableTokens[selectedTokenAddress]?.symbol}`
                                  : "-"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-black/30">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Wallet className="text-blue-400" />
                            <div>
                              <p className="text-sm text-gray-300">Your Balance</p>
                              <p className="text-lg">
                                {userBalance
                                  ? `${formatUnits(BigInt(userBalance), 18)} ${availableTokens[selectedTokenAddress]?.symbol}`
                                  : "-"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-black/30">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Calendar className="text-blue-400" />
                            <div>
                              <p className="text-sm text-gray-300">Last Request</p>
                              <p className="text-lg">
                                {lastRequestTime
                                  ? DateTime.fromMillis(Number(lastRequestTime) * 1000).toFormat("HH:mm d LLLL yyyy")
                                  : "-"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-black/30">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="text-blue-400" />
                            <div>
                              <p className="text-sm text-gray-300">Cooldown</p>
                              <p className="text-lg">{faucetCooldown ? `${faucetCooldown}s` : "-"}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 text-black font-semibold"
                      >
                        Request Tokens
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                  <History className="text-blue-400" />
                  <h2 className="text-2xl font-semibold text-gray-200">Transaction History</h2>
                </div>
                <Card className="w-full bg-black/30 backdrop-blur-sm border border-blue-500/20">
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
            </>
          ) : (
            <div className="min-h-[60vh] flex items-center justify-center">
              <Card className="bg-black/30 border-blue-500/20 w-full max-w-md">
                <CardContent className="p-8 text-center">
                  <Droplets className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
                    Connect Wallet
                  </h2>
                  <p className="text-gray-300 mb-6">Please connect your wallet to access the faucet</p>
                  <ConnectButton />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default GTXFaucet