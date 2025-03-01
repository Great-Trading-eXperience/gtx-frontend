import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Info } from 'lucide-react';

const OrderManagement = () => {
  return (
    <Card className="w-full p-6 bg-white rounded-lg shadow-sm">
      <Tabs defaultValue="open-orders" className="w-full">
        <TabsList className="flex space-x-6 border-b border-gray-200 mb-6">
          <TabsTrigger 
            value="open-orders" 
            className="text-xl font-medium px-0 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 text-gray-400"
          >
            My Open Orders
          </TabsTrigger>
          <TabsTrigger 
            value="trades" 
            className="text-xl font-medium px-0 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 text-gray-400"
          >
            My Trades   
          </TabsTrigger>
          {/* <TabsTrigger 
            value="balances" 
            className="text-xl font-medium px-0 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 text-gray-400"
          >
            My Balances
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="open-orders">
          <div className="w-full">
            <div>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4 text-sm font-medium text-gray-600">TIME</th>
                  <th className="pb-4 text-sm font-medium text-gray-600">SIDE</th>
                  <th className="pb-4 text-sm font-medium text-gray-600">
                    PRICE <span className="text-gray-400 font-normal">USDC</span>
                  </th>
                  <th className="pb-4 text-sm font-medium text-gray-600">
                    SIZE <span className="text-gray-400 font-normal">SOL</span>
                  </th>
                  <th className="pb-4 text-sm font-medium text-gray-600">TXID</th>
                  <th className="pb-4 text-sm font-medium text-gray-600">LINK</th>
                  <th className="pb-4 text-sm font-medium text-gray-600">TAKER</th>
                  <th className="pb-4 text-sm font-medium text-gray-600">MAKER</th>
                </tr>
              </thead>
              <tbody>
                {/* Table content will go here when there are trades */}
              </tbody>
            </table>
            </div>
            
            <div className="text-center py-12 text-gray-500">
              You have no open orders.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          <div className="text-center py-12 text-gray-500">
            You have no trades in the last 7 days.
            <div className="mt-4 flex justify-center">
              <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 flex items-center">
                Download All Trades <Info className="w-4 h-4 ml-1 text-gray-400" />
              </button>
            </div>
          </div>
        </TabsContent>

        {/* <TabsContent value="balances">
          <div className="text-center py-12 text-gray-500">
            No balances to display.
          </div>
        </TabsContent> */}
      </Tabs>
    </Card>
  );
};

export default OrderManagement;