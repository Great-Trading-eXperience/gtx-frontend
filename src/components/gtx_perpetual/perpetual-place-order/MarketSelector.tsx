import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  MOCK_WETH_ADDRESS,
  MOCK_WBTC_ADDRESS,
  MOCK_USDC_ADDRESS,
  MOCK_CHAINLINK_CONTRACT,
  MOCK_PEPE_CONTRACT,
  MOCK_SHIB_ADDRESS,
  MOCK_SOL_ADDRESS,
  MOCK_DOGE_ADDRESS,
  MOCK_XRP_ADDRESS,
  MOCK_ADA_ADDRESS
} from '@/constants/contract-address';
import { HexAddress } from '@/types/web3/general/address';

interface Market {
  symbol: string;
  name: string;
  address: HexAddress;
  iconUrl: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  liquidityUsd: number;
}

const markets: Market[] = [
  {
    symbol: 'WETH',
    name: 'Ethereum',
    address: MOCK_WETH_ADDRESS as HexAddress,
    iconUrl: '/icons/eth.svg',
    priceUsd: 3254.75,
    change24h: 2.35,
    volume24h: 1289000000,
    liquidityUsd: 450000000
  },
  {
    symbol: 'WBTC',
    name: 'Bitcoin',
    address: MOCK_WBTC_ADDRESS as HexAddress,
    iconUrl: '/icons/btc.svg',
    priceUsd: 48650.25,
    change24h: 1.23,
    volume24h: 2345000000,
    liquidityUsd: 780000000
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: MOCK_CHAINLINK_CONTRACT as HexAddress,
    iconUrl: '/icons/link.svg',
    priceUsd: 15.32,
    change24h: 3.75,
    volume24h: 245000000,
    liquidityUsd: 125000000
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    address: MOCK_PEPE_CONTRACT as HexAddress,
    iconUrl: '/icons/pepe.svg',
    priceUsd: 0.00000985,
    change24h: 8.12,
    volume24h: 128000000,
    liquidityUsd: 75000000
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: MOCK_SHIB_ADDRESS as HexAddress,
    iconUrl: '/icons/shib.svg',
    priceUsd: 0.00002134,
    change24h: 4.52,
    volume24h: 156000000,
    liquidityUsd: 85000000
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: MOCK_SOL_ADDRESS as HexAddress,
    iconUrl: '/icons/sol.svg',
    priceUsd: 142.87,
    change24h: 5.23,
    volume24h: 578000000,
    liquidityUsd: 250000000
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: MOCK_DOGE_ADDRESS as HexAddress,
    iconUrl: '/icons/doge.svg',
    priceUsd: 0.1245,
    change24h: -1.76,
    volume24h: 87000000,
    liquidityUsd: 52000000
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    address: MOCK_XRP_ADDRESS as HexAddress,
    iconUrl: '/icons/xrp.svg',
    priceUsd: 0.5432,
    change24h: 0.87,
    volume24h: 123000000,
    liquidityUsd: 89000000
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    address: MOCK_ADA_ADDRESS as HexAddress,
    iconUrl: '/icons/ada.svg',
    priceUsd: 0.4567,
    change24h: -0.34,
    volume24h: 98000000,
    liquidityUsd: 64000000
  }
];

interface MarketSelectorProps {
  onSelectMarket: (market: Market) => void;
  selectedMarketAddress?: HexAddress;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ 
  onSelectMarket,
  selectedMarketAddress
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMarkets = markets.filter(market => 
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="mb-4">
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-500 mb-2 px-2">
          <div className="col-span-1">Market</div>
          <div className="text-right">Price</div>
          <div className="text-right">24h Change</div>
          <div className="text-right">24h Volume</div>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredMarkets.map(market => (
            <div 
              key={market.address}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                selectedMarketAddress === market.address ? 'bg-gray-100 border border-gray-300' : ''
              }`}
              onClick={() => onSelectMarket(market)}
            >
              <div className="flex items-center space-x-2 flex-grow">
                <img 
                  src={market.iconUrl} 
                  alt={market.symbol} 
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icons/default-token.svg';
                  }}
                />
                <div>
                  <div className="font-medium">{market.symbol}</div>
                  <div className="text-xs text-gray-500">{market.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                ${market.priceUsd.toLocaleString(undefined, {
                  minimumFractionDigits: market.priceUsd < 0.01 ? 8 : 2,
                  maximumFractionDigits: market.priceUsd < 0.01 ? 8 : 2
                })}
              </div>
              
              <div className={`text-right ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
              </div>
              
              <div className="text-right">
                ${(market.volume24h / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
          
          {filteredMarkets.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No markets found matching {searchQuery}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSelector;