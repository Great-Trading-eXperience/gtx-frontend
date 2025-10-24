'use client';

import React from 'react';
import { Copy, Search } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ProcessedTokenMapping } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useTokenMappings';

interface AssetTabProps {
  allUniqueTokens: ProcessedTokenMapping[];
  embeddedWalletAddress: string;
  isOpen: boolean;
  activeTab: string;
  indexedBalances?: any[];
  indexedBalancesLoading?: boolean;
  indexedBalancesError?: any;
  refetchIndexedBalances?: () => void;
}

interface Asset {
  symbol: string;
  balance: string;
  address: string;
  icon: React.ReactNode;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const AssetTab: React.FC<AssetTabProps> = ({
  allUniqueTokens,
  embeddedWalletAddress,
  isOpen,
  activeTab,
  indexedBalances,
  indexedBalancesLoading = false,
  indexedBalancesError = null,
  refetchIndexedBalances,
}) => {

  let assets: Asset[] = [];

  // Create assets from token-mappings endpoint + indexer balances
  console.log('🏛️ Asset creation debug (Indexer-based):', {
    allUniqueTokensLength: allUniqueTokens.length,
    allUniqueTokens: allUniqueTokens.map(t => ({
      symbol: t.symbol,
      address: t.address.slice(0, 8) + '...',
    })),
    indexedBalancesLength: indexedBalances?.length || 0,
    indexedBalancesLoading,
    indexedBalancesError: indexedBalancesError?.message,
  });

  if (allUniqueTokens.length > 0) {
    assets = allUniqueTokens.map((token, index) => {
      console.log('🏛️ Mapping indexed balance for token:', token.symbol);
      
      // Find corresponding balance from indexer data
      const indexedBalance = indexedBalances?.find(
        balance => balance.tokenAddress === token.address.toLowerCase()
      );
      
      const displayBalance = indexedBalance?.balance || '0';
      
      console.log('🏛️ Indexed balance result:', {
        tokenSymbol: token.symbol,
        tokenAddress: token.address.slice(0, 8) + '...',
        foundBalance: indexedBalance?.balance || 'not found in indexer',
        finalDisplayBalance: displayBalance,
      });

      const colorMap = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-yellow-500',
        'bg-indigo-500',
      ];
      const color = colorMap[index % colorMap.length];

      return {
        symbol: token.symbol,
        balance: `${formatNumber(Number(displayBalance), {
          decimals: 2,
          compact: true,
        })} ${token.symbol}`,
        address: token.address,
        icon: (
          <div
            className={`w-6 h-6 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
          >
            {token.symbol?.charAt(0)?.toUpperCase() || 'T'}
          </div>
        ),
      };
    });
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
        <div className="text-2xl font-bold">$0</div>
      </div>

      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens"
            className="w-full bg-transparent border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
          />
        </div>

        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <span>Hide dust</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
              />
              <div className="w-6 h-6 border-2 rounded cursor-pointer border-gray-400">
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {assets.map(asset => (
          <div
            key={asset.address || asset.symbol}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              {asset.icon}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{asset.symbol}</span>
                  {asset.address && (
                    <button
                      onClick={() => copyToClipboard(asset.address!)}
                      className="p-1 hover:bg-gray-700 rounded opacity-70 hover:opacity-100 transition-opacity"
                      title={`Copy ${asset.symbol} address`}
                    >
                      <Copy size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>
                {asset.address && (
                  <span className="text-gray-400 text-xs font-mono">
                    {`${asset.address.slice(0, 6)}...${asset.address.slice(-4)}`}
                  </span>
                )}
              </div>
            </div>
            <span className="text-gray-300">{asset.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
};