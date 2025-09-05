"use client"

import { Copy, Search } from "lucide-react";
import { useState } from "react";

interface Asset {
  symbol: string;
  balance: string;
  icon: React.ReactNode;
  address?: string;
}

interface AssetTabProps {
  assets: Asset[];
}

const AssetTab: React.FC<AssetTabProps> = ({ assets }) => {
  const [hideDust, setHideDust] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
        <div className="text-2xl font-bold">$0</div>
      </div>

      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
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
                checked={hideDust}
                onChange={e => setHideDust(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded cursor-pointer ${
                  hideDust ? 'bg-green-400 border-green-400' : 'border-gray-400'
                }`}
              >
                {hideDust && (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.address || asset.symbol} className="flex items-center justify-between py-2">
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

export default AssetTab;