"use client"

import type React from "react"

import { AllocationRow } from "@/components/earn/allocation-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PERPETUAL_GRAPHQL_URL } from "@/constants/subgraph-url"
import {
  getAllocationsQuery,
  getCuratorVaultDepositQuerys,
  getCuratorVaultQuery,
  getCuratorVaultWithdrawQuerys,
} from "@/graphql/gtx/gtx.query"
import { useAssetVaultDeposit } from "@/hooks/web3/gtx/perpetual/useDepositCuratorVault"
import type { HexAddress } from "@/types/web3/general/address"
import { useQuery } from "@tanstack/react-query"
import request from "graphql-request"
import { Database, TrendingUp, ArrowUpRight, Wallet, LucideLineChart, ArrowRight, ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart } from "recharts"
import { useAccount } from "wagmi"
import { DotPattern } from "@/components/magicui/dot-pattern"

// Types for the curator information
interface Curator {
  blockNumber: string
  contractAddress: string
  curator: string
  id: string
  name: string
  timestamp: string
  transactionHash: string
  uri: string
}

// Types for the asset vault information
interface AssetVault {
  asset: string
  blockNumber: string
  timestamp: string
  id: string
  token: string
  tokenName: string
  transactionHash: string
  tokenSymbol: string
  curator: Curator
  name: string
}

// Query variables
interface GetCuratorAssetVaultQueryVariables {
  assetVault: string
}

// Query response
interface GetCuratorAssetVaultQueryResponse {
  assetVault: AssetVault
}

// GraphQL query type with variables and response
export type GetCuratorAssetVaultQuery = {
  variables: GetCuratorAssetVaultQueryVariables
  response: GetCuratorAssetVaultQueryResponse
}

// Types for an individual allocation item
interface AllocationItem {
  allocation: string
  blockNumber: string
  curator: string
  id: string
  marketToken: string
  timestamp: string
  transactionHash: string
}

// Types for the allocations pagination response
interface AllocationsResponse {
  items: AllocationItem[]
}

// Query variables
interface GetAllocationsQueryVariables {
  assetVault: string
}

// Query response
interface GetAllocationsQueryResponse {
  allocations: AllocationsResponse
}

// GraphQL query type with variables and response
export type GetAllocationsQuery = {
  variables: GetAllocationsQueryVariables
  response: GetAllocationsQueryResponse
}

// Common interface for vault transaction items (both deposits and withdraws)
interface VaultTransactionItem {
  blockNumber: string
  id: string
  timestamp: string
  shares: string
  transactionHash: string
  user: string
  amount: string
}

// Types for the deposits pagination response
interface CuratorVaultDepositsResponse {
  items: VaultTransactionItem[]
}

// Query variables for deposits
interface GetCuratorVaultDepositsQueryVariables {
  assetVault: string
}

// Query response for deposits
interface GetCuratorVaultDepositsQueryResponse {
  curatorVaultDeposits: CuratorVaultDepositsResponse
}

// Complete deposits query type with variables and response
export type GetCuratorVaultDepositsQuery = {
  variables: GetCuratorVaultDepositsQueryVariables
  response: GetCuratorVaultDepositsQueryResponse
}

// Types for the withdraws pagination response
interface curatorVaultWithdrawalsResponse {
  items: VaultTransactionItem[]
}

// Query variables for withdraws
interface GetcuratorVaultWithdrawalsQueryVariables {
  assetVault: string
}

// Query response for withdraws
interface GetcuratorVaultWithdrawalsQueryResponse {
  curatorVaultWithdrawals: curatorVaultWithdrawalsResponse
}

// Complete withdraws query type with variables and response
export type GetcuratorVaultWithdrawalsQuery = {
  variables: GetcuratorVaultWithdrawalsQueryVariables
  response: GetcuratorVaultWithdrawalsQueryResponse
}

// Add this mock data near your component
const mockData = [
  { date: "", value: 1000 },
  { date: "", value: 1200 },
  { date: "", value: 1100 },
  { date: "", value: 1400 },
  { date: "", value: 1300 },
  { date: "", value: 1600 },
  { date: "", value: 1500 },
]

function VaultContent({ params }: { params: { vault: string } }) {
  const { depositToVault, isDepositPending, isDepositConfirming } = useAssetVaultDeposit()
  const router = useRouter() // Move router here for the back button functionality

  const [tvl, setTvl] = useState("$0")
  const [userDeposit, setUserDeposit] = useState("0")
  const [depositAmount, setDepositAmount] = useState("0")
  const [withdrawAmount, setWithdrawAmount] = useState("0")

  const { address } = useAccount()

  // Validation state
  const [errors, setErrors] = useState<{
    depositAmount?: string
    withdrawAmount?: string
  }>({})

  const { data: vaultData, isLoading: vaultLoading } = useQuery<GetCuratorAssetVaultQueryResponse>({
    queryKey: ["curatorAssetVault", params.vault],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, getCuratorVaultQuery, { assetVault: params.vault })
    },
    staleTime: 60000, // 1 minute
  })

  const { data: allocationsData, isLoading: allocationsLoading } = useQuery<GetAllocationsQueryResponse>({
    queryKey: ["allocations", params.vault],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, getAllocationsQuery, { assetVault: params.vault })
    },
    staleTime: 60000,
  })

  const { data: depositsData, isLoading: depositsLoading } = useQuery<GetCuratorVaultDepositsQueryResponse>({
    queryKey: ["deposits", params.vault],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, getCuratorVaultDepositQuerys, { assetVault: params.vault })
    },
    staleTime: 60000,
  })

  const { data: withdrawsData, isLoading: withdrawsLoading } = useQuery<GetcuratorVaultWithdrawalsQueryResponse>({
    queryKey: ["withdraws", params.vault],
    queryFn: async () => {
      return await request(PERPETUAL_GRAPHQL_URL, getCuratorVaultWithdrawQuerys, { assetVault: params.vault })
    },
    staleTime: 60000,
  })

  const isDepositLoading = isDepositPending || isDepositConfirming

  const validateDeposit = (): boolean => {
    const newErrors: {
      depositAmount?: string
    } = {}
    // Validate max order amount
    if (!depositAmount) {
      newErrors.depositAmount = "Deposit amount is required"
    } else if (isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      newErrors.depositAmount = "Deposit amount must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateDeposit()) return

    try {
      await depositToVault({
        vaultAddress: vaultData?.assetVault.id as HexAddress,
        amount: depositAmount,
        decimals: 6,
        includeWntForFees: true,
      })

      // Handle successful deposit
    } catch (error) {
      // Handle error
      console.error(error)
    }
  }

  const handleGoBack = () => {
    router.push('/earn') // Adjust this path to your actual vault listing page
  }

  useEffect(() => {
    if (!depositsData?.curatorVaultDeposits.items || !withdrawsData?.curatorVaultWithdrawals.items || !address) {
      setUserDeposit("0")
      return
    }

    const userDeposits = depositsData.curatorVaultDeposits.items
      .filter((deposit) => deposit.user.toLowerCase() === address.toLowerCase())
      .reduce((sum, deposit) => sum + Number(deposit.amount), 0)

    const userWithdraws = withdrawsData.curatorVaultWithdrawals.items
      .filter((withdraw) => withdraw.user.toLowerCase() === address.toLowerCase())
      .reduce((sum, withdraw) => sum + Number(withdraw.amount), 0)

    const netDeposit = (userDeposits - userWithdraws) / 1e6 // Convert from USDC decimals
    setUserDeposit(netDeposit.toFixed(2))
  }, [depositsData, withdrawsData, address])

  useEffect(() => {
    if (!depositsData?.curatorVaultDeposits.items || !withdrawsData?.curatorVaultWithdrawals.items) {
      setTvl("$0")
      return
    }

    const totalDeposits = depositsData.curatorVaultDeposits.items.reduce(
      (sum, deposit) => sum + Number(deposit.amount),
      0,
    )

    const totalWithdraws = withdrawsData.curatorVaultWithdrawals.items.reduce(
      (sum, withdraw) => sum + Number(withdraw.amount),
      0,
    )

    const tvlValue = totalDeposits - totalWithdraws
    const formatted = tvlValue / 1e6

    let formattedTvl
    if (formatted > 1_000_000) {
      formattedTvl = `$${(formatted / 1_000_000).toFixed(1)}M`
    } else if (formatted > 1_000) {
      formattedTvl = `$${(formatted / 1_000).toFixed(1)}K`
    } else {
      formattedTvl = `$${formatted.toFixed(2)}`
    }

    setTvl(formattedTvl)
  }, [depositsData?.curatorVaultDeposits.items, withdrawsData?.curatorVaultWithdrawals.items])

  return (
    <div className="relative min-h-screen bg-black text-white">
      <DotPattern />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6">
        {/* Back button */}
        <Button
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 bg-[#121212] hover:bg-blue-800/20 text-blue-400 hover:text-blue-300 border border-blue-600/20 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vaults
        </Button>

        <div className="grid md:grid-cols-[2fr,1fr] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                {vaultData?.assetVault.curator.name || "Loading..."}
              </h2>
              <h3 className="text-xl text-white mt-2">{vaultData?.assetVault.name || "Loading..."}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400">TVL</span>
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{tvl}</div>
              </div>
              <div className="p-6 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400">APY</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">12.5%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-400">Performance</h3>
              <div className="h-64 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)] p-6">
                <div className="h-full w-full flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={mockData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e40af20" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                          borderRadius: "0.375rem",
                        }}
                        labelStyle={{ color: "#94a3b8" }}
                        itemStyle={{ color: "#7dd3fc" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#7dd3fc" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 pointer-events-none">
                    <span className="text-gray-400 bg-black/80 px-4 py-2 rounded-lg">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Tabs defaultValue="allocation" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-[#121212] border border-blue-600/20 rounded-xl overflow-hidden">
                  <TabsTrigger
                    value="allocation"
                    className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-white"
                  >
                    Market Allocation
                  </TabsTrigger>
                  <TabsTrigger
                    value="deposits"
                    className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-white"
                  >
                    Deposits
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraws"
                    className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-white"
                  >
                    Withdraws
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="allocation" className="mt-4">
                  <Card className="border-blue-600/20 bg-[#121212] backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/50 border-b border-blue-600/20">
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Market</th>
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Allocation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocationsLoading ? (
                            <tr>
                              <td colSpan={2} className="text-center p-8">
                                <div className="flex justify-center items-center h-20">
                                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              </td>
                            </tr>
                          ) : allocationsData?.allocations.items.length ? (
                            allocationsData.allocations.items.map((allocation, i) => (
                              <AllocationRow
                                key={allocation.marketToken}
                                marketToken={allocation.marketToken}
                                allocation={allocation.allocation}
                              />
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="text-center p-8 text-gray-400">
                                No market allocations found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="deposits" className="mt-4">
                  <Card className="border-blue-600/20 bg-[#121212] backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/50 border-b border-blue-600/20">
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">User</th>
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Amount</th>
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Shares</th>
                            <th className="text-right p-4 text-sm text-blue-400 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depositsLoading ? (
                            <tr>
                              <td colSpan={4} className="text-center p-8">
                                <div className="flex justify-center items-center h-20">
                                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              </td>
                            </tr>
                          ) : depositsData?.curatorVaultDeposits.items.length ? (
                            depositsData.curatorVaultDeposits.items.map((deposit) => (
                              <tr
                                key={deposit.id}
                                className="border-b border-blue-600/20 hover:bg-blue-600/5 transition-colors duration-200"
                              >
                                <td className="p-4 text-blue-600">
                                  {`${deposit.user.slice(0, 6)}...${deposit.user.slice(-4)}`}
                                </td>
                                <td className="p-4">
                                  {Number(deposit.amount) / 1e6} {vaultData?.assetVault.tokenSymbol || "USDC"}
                                </td>
                                <td className="p-4">
                                  {Number(deposit.shares) / 1e18} {vaultData?.assetVault.tokenSymbol}
                                </td>
                                <td className="p-4 text-right">
                                  {new Date(Number(deposit.timestamp) * 1000).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center p-8 text-gray-400">
                                No deposits found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="withdraws" className="mt-4">
                  <Card className="border-blue-600/20 bg-[#121212] backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/50 border-b border-blue-600/20">
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">User</th>
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Amount</th>
                            <th className="text-left p-4 text-sm text-blue-400 font-medium">Shares</th>
                            <th className="text-right p-4 text-sm text-blue-400 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawsLoading ? (
                            <tr>
                              <td colSpan={4} className="text-center p-8">
                                <div className="flex justify-center items-center h-20">
                                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              </td>
                            </tr>
                          ) : withdrawsData?.curatorVaultWithdrawals.items.length ? (
                            withdrawsData.curatorVaultWithdrawals.items.map((withdraw) => (
                              <tr
                                key={withdraw.id}
                                className="border-b border-blue-600/20 hover:bg-blue-600/5 transition-colors duration-200"
                              >
                                <td className="p-4 text-blue-600">
                                  {`${withdraw.user.slice(0, 6)}...${withdraw.user.slice(-4)}`}
                                </td>
                                <td className="p-4">{Number(withdraw.amount) / 1e6}</td>
                                <td className="p-4">{Number(withdraw.shares) / 1e18}</td>
                                <td className="p-4 text-right">
                                  {new Date(Number(withdraw.timestamp) * 1000).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center p-8 text-gray-400">
                                No withdrawals found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">Your Deposit</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Deposit:</span>
                {address ? (
                  <span className="text-2xl font-bold text-blue-600">
                    {userDeposit} {vaultData?.assetVault.tokenSymbol || "USDC"}
                  </span>
                ) : (
                  <span className="text-lg text-gray-400">Connect Wallet</span>
                )}
              </div>
            </div>

            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-[#121212] border border-blue-600/20 rounded-xl overflow-hidden">
                <TabsTrigger
                  value="deposit"
                  className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-white"
                >
                  Deposit
                </TabsTrigger>
                <TabsTrigger
                  value="withdraw"
                  className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-white"
                >
                  Withdraw
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="deposit"
                className="mt-4 p-6 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]"
              >
                {address ? (
                  <form onSubmit={handleDeposit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">Deposit</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue="0.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-32 text-right bg-black/50 border-blue-600/50 focus:border-blue-400 focus:ring-blue-400/20"
                          />
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-600 text-white">
                            Max
                          </Button>
                        </div>
                        {errors.depositAmount && <p className="text-sm text-red-400">{errors.depositAmount}</p>}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                        disabled={isDepositLoading}
                      >
                        {isDepositLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          "Deposit"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <span className="text-gray-400">Connect your wallet to deposit</span>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="withdraw"
                className="mt-4 p-6 rounded-xl bg-[#121212] border border-blue-600/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.05)]"
              >
                {address ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">Withdraw</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          defaultValue="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-32 text-right bg-black/50 border-blue-600/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-600 text-white">
                          Max
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
                      Withdraw
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <span className="text-gray-400">Connect your wallet to withdraw</span>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

const CuratorPage = () => {
  const router = useRouter()
  const { vault } = router.query
  return <VaultContent params={{ vault: vault as string }} />
}

export default CuratorPage

