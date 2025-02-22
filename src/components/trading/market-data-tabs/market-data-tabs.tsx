import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderBookComponent from '../order-book/order-book';
import RecentTradesComponent from '../recent-trade/recent-trade';

const MarketDataTabs = () => {
    return (
        <div className="w-full bg-gray-100 dark:bg-[#151924] rounded-lg">
            <Tabs defaultValue="orderbook" className="w-full">
                <div className="mb-[0.6px] py-2">
                    <TabsList className="w-full grid grid-cols-2 rounded-lg border border-gray-200 dark:border-gray-700/50 p-0.5 bg-gray-100 dark:bg-[#151924] backdrop-blur-sm h-auto">
                        <TabsTrigger
                            value="orderbook"
                            className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30 data-[state=active]:bg-[#0064A7] data-[state=active]:text-white data-[state=active]:shadow-md border-0"
                        >
                            ORDERBOOK
                        </TabsTrigger>
                        <TabsTrigger
                            value="trades"
                            className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/30 data-[state=active]:bg-[#0064A7] data-[state=active]:text-white data-[state=active]:shadow-md border-0"
                        >
                            RECENT TRADES
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="orderbook" className="mt-0">
                    <OrderBookComponent />
                </TabsContent>

                <TabsContent value="trades" className="mt-0">
                    <RecentTradesComponent />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MarketDataTabs;