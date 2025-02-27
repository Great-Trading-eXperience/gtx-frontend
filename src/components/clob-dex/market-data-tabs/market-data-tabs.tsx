"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import RecentTradesComponent from "../recent-trade/recent-trade"
import OrderBookDex from "../orderbook-dex/orderbook-dex"

const MarketDataTabs = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-900 to-[#151924] shadow-lg">
      <Tabs defaultValue="orderbook" className="w-full">
        <div className="border-b border-gray-800/60 backdrop-blur-sm">
          <TabsList className="flex w-full justify-start space-x-8 bg-transparent px-6 py-2">
            <TabsTrigger
              value="orderbook"
              className="group w-1/2 relative px-3 py-2 text-sm font-medium text-gray-300 transition-all duration-300 ease-in-out hover:text-white data-[state=active]:text-white"
            >
              Order Book
              <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transform rounded-t-full bg-gradient-to-r from-[#89DDF7] to-[#66c4e0] transition-transform duration-300 ease-out group-hover:scale-x-50 group-data-[state=active]:scale-x-100"></span>
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="group w-1/2 relative px-3 py-2 text-sm font-medium text-gray-400 transition-all duration-300 ease-in-out hover:text-white data-[state=active]:text-white"
            >
              Trades
              <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transform rounded-t-full bg-gradient-to-r from-[#89DDF7] to-[#66c4e0] transition-transform duration-300 ease-out group-hover:scale-x-50 group-data-[state=active]:scale-x-100"></span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-1">
          <TabsContent value="orderbook" className="mt-0 transition-opacity duration-200 ease-in-out">
            <OrderBookDex />
          </TabsContent>

          <TabsContent value="trades" className="mt-0 transition-opacity duration-200 ease-in-out">
            <RecentTradesComponent />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default MarketDataTabs

