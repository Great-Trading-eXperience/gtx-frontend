"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAccount } from "wagmi"
import OrderHistoryTable from "./order-history"
import TradeHistoryTable from "./trade-history"
import { ButtonConnectWallet } from "@/components/button-connect-wallet.tsx/button-connect-wallet"
import BalancesHistoryTable from "./balances-history"
import { BookOpen, History, Wallet } from "lucide-react"

export default function TradingHistory() {
  const { isConnected } = useAccount()

  return (
    <div className="relative mt-4">
      {/* Decorative Elements */}
      <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />

      <Card className="overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm">
        <Tabs defaultValue="open-orders" className="w-full">
          <div className="space-y-6 p-6">
            <div className="relative">
              <TabsList className="flex w-full justify-start gap-6 bg-transparent">
                <TabsTrigger
                  value="open-orders"
                  className="group relative flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-lg font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Open Orders</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="trades"
                  className="group relative flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-lg font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <History className="h-5 w-5" />
                  <span>Trade History</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="balances"
                  className="group relative flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-lg font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <Wallet className="h-5 w-5" />
                  <span>Balances</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="open-orders"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <OrderHistoryTable />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800/30 bg-gray-900/20 p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-200">Connect your wallet to see your open orders</p>
                    <ButtonConnectWallet />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="trades"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <TradeHistoryTable />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800/30 bg-gray-900/20 p-8 text-center">
                    <History className="h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-200">Connect your wallet to see your trade history</p>
                    <ButtonConnectWallet />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="balances"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-6 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <BalancesHistoryTable />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800/30 bg-gray-900/20 p-8 text-center">
                    <Wallet className="h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-200">Connect your wallet to see your balances</p>
                    <ButtonConnectWallet />
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

