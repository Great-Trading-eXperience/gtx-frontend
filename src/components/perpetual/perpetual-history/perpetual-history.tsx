"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAccount } from "wagmi"
import { BookOpen, History, Wallet, Filter, ChevronDown, TrendingUp, DollarSign } from "lucide-react"
import { PrivyAuthButton } from "@/components/auth/privy-auth-button"
import PositionsHistory from "./positions-history"
import OpenOrders from "./open-orders"
import FundingHistory from "./funding-history"
import OrdersHistory from "./orders-history"
import TradeHistory from "./trade-history"


export default function PerpetualHistory() {
  const { isConnected } = useAccount()

  const solidColorConfig = {
    backgroundColor: "bg-transparent",
    hoverBackgroundColor: "hover:bg-slate-800/50",
    textColor: "text-white",
    mode: 'solid' as const
  };

  return (
    <div className="relative mt-1">
      {/* Decorative Elements */}
      <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />

      <Card className="overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm">
        <Tabs defaultValue="positions" className="w-full">
          <div className="space-y-4 p-4">
            <div className="relative">
              <TabsList className="flex w-full justify-start gap-4 bg-transparent">
                <TabsTrigger
                  value="positions"
                  className="group relative flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Positions</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="open-orders"
                  className="group relative flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Open Orders</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="trade-history"
                  className="group relative flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <History className="h-4 w-4" />
                  <span>Trade History</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="funding-history"
                  className="group relative flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Funding History</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="order-history"
                  className="group relative flex items-center gap-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Order History</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="positions"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <PositionsHistory />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 text-center">
                    <TrendingUp className="h-10 w-10 text-gray-400" />
                    <p className="text-base text-gray-200">Connect your wallet to see your positions</p>
                    <PrivyAuthButton
                      className="border border-slate-500 text-sm"
                      showFullProfile={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="open-orders"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <OpenOrders />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 text-center">
                    <BookOpen className="h-10 w-10 text-gray-400" />
                    <p className="text-base text-gray-200">Connect your wallet to see your open orders</p>
                    <PrivyAuthButton
                      className="border border-slate-500 text-sm"
                      showFullProfile={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="trade-history"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <TradeHistory />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 text-center">
                    <History className="h-10 w-10 text-gray-400" />
                    <p className="text-base text-gray-200">Connect your wallet to see your trade history</p>
                    <PrivyAuthButton
                      className="border border-slate-500 text-sm"
                      showFullProfile={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="funding-history"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <FundingHistory />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 text-center">
                    <DollarSign className="h-10 w-10 text-gray-400" />
                    <p className="text-base text-gray-200">Connect your wallet to see your funding history</p>
                    <PrivyAuthButton
                      className="border border-slate-500 text-sm"
                      showFullProfile={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="order-history"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <OrdersHistory />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 text-center">
                    <Wallet className="h-10 w-10 text-gray-400" />
                    <p className="text-base text-gray-200">Connect your wallet to see your order history</p>
                    <PrivyAuthButton
                      className="border border-slate-500 text-sm"
                      showFullProfile={false}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/50 to-transparent" />
    </div>
  )
}