'use client';

import { useState } from 'react';
import { RecentTradeItem, TradeItem } from '@/graphql/gtx/clob';
import { HexAddress } from '@/types/general/address';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { BarChart2, LineChart } from 'lucide-react';
import { ClobDexComponentProps } from '../clob-dex';
import EnhancedOrderBookDex from '../orderbook-dex/orderbook-dex';
import RecentTradesComponent from '../recent-trade/recent-trade';
import { DepthData } from '@/lib/market-api';
import MarketDataTabsSkeleton from './market-data-tabs-skeleton';

export interface MarketDataTabsProps extends ClobDexComponentProps {
  address: HexAddress | undefined;
  chainId: number;
  defaultChainId: number;
  selectedPool?: ProcessedPoolItem;
  poolsLoading: boolean;
  poolsError: Error | null;
  depthData: DepthData | null;
  trades: TradeItem[];
  tradesLoading: boolean;
}

type TabValue = 'orderbook' | 'trades';

const MarketDataTabs = ({
  chainId,
  defaultChainId,
  selectedPool,
  poolsLoading,
  poolsError,
  depthData,
  trades,
  tradesLoading
}: MarketDataTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabValue>('orderbook');

  // Show skeleton when pools are loading or no data is available yet
  if (poolsLoading || (!selectedPool && !depthData && trades.length === 0)) {
    return <MarketDataTabsSkeleton />;
  }

  const tabs = [
    {
      value: 'orderbook' as const,
      label: 'Order Book',
      icon: LineChart,
    },
    {
      value: 'trades' as const,
      label: 'Trades',
      icon: BarChart2,
    },
  ];

  const handleTabClick = (tabValue: TabValue) => {
    setActiveTab(tabValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orderbook':
        return (
          <div className="transition-all duration-300 animate-in fade-in-0">
            <EnhancedOrderBookDex
              chainId={chainId}
              defaultChainId={defaultChainId}
              selectedPool={selectedPool}
              poolsLoading={poolsLoading}
              poolsError={poolsError}
              depthData={depthData}
            />
          </div>
        );
      case 'trades':
        return (
          <div className="transition-all duration-300 animate-in fade-in-0">
            <RecentTradesComponent
              chainId={chainId ?? defaultChainId}
              defaultChainId={defaultChainId}
              tradesData={trades}
              tradesLoading={tradesLoading}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-white/20 bg-black shadow-lg backdrop-blur-sm">
      <div className="relative border-b border-white/20 backdrop-blur-sm">
        <div className="flex w-full justify-start gap-1 bg-transparent">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleTabClick(value)}
              className={`group w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 hover:text-gray-200 ${
                activeTab === value
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MarketDataTabs;