import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  QrCode,
  Edit3,
  Search,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Key,
  LogOut,
} from 'lucide-react';

interface Asset {
  symbol: string;
  balance: string;
  icon: React.ReactNode;
}

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmbededPanel: React.FC<RightPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'Asset' | 'Deposit' | 'Withdraw'>('Asset');
  const [hideDust, setHideDust] = useState(false);

  const walletAddress = '0x646274a6679c6328496a375a3bb1ee6c251b590f';
  const shortAddress = '0x8B93...A18B';

  const assets: Asset[] = [
    {
      symbol: 'USDC',
      balance: '<0.01 USDC',
      icon: (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          $
        </div>
      ),
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Close panel when overlay is clicked
        aria-hidden={!isOpen} // Hide from accessibility tree when invisible
      ></div>

      {/* Right Panel */}
      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-[] bg-[#18191B] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col rounded-l-lg
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Side navigation panel"
      >
        {/* Wallet Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">GTX Wallet</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Wallet Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-md"></div>
              <div className='w-fit border-b border-dashed border-gray-400'>
                <span className="text-sm text-gray-300">Login wallet</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-300">{shortAddress}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">GTX wallet</span>
              <QrCode size={16} className="text-gray-400" />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="mt-3 bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-300 font-mono break-all">
              {walletAddress}
            </span>
            <button
              onClick={() => copyToClipboard(walletAddress)}
              className="ml-2 p-1 hover:bg-gray-700 rounded"
            >
              <Copy size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Wallet Tabs */}
        <div className="flex border-b border-gray-700">
          {(['Asset', 'Deposit', 'Withdraw'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Wallet Content */}
        <div className="flex-1 overflow-y-auto h-96">
          {activeTab === 'Asset' && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
                <div className="text-2xl font-bold">$0</div>
              </div>

              <div className="mb-4">
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search tokens"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
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
                        onClick={() => setHideDust(!hideDust)}
                        className={`w-6 h-6 border-2 rounded cursor-pointer ${
                          hideDust ? 'bg-green-400 border-green-400' : 'border-gray-400'
                        }`}
                      >
                        {hideDust && (
                          <svg
                            className="w-3 h-3 text-white mx-auto mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Asset List Header */}
              <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <span>Asset</span>
                  <span className="border-b border-dotted border-gray-400">--------</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign size={14} />
                  <span>Balance</span>
                  <TrendingDown size={14} />
                  <span className="border-b border-dotted border-gray-400">
                    -----------
                  </span>
                </div>
              </div>

              {/* Asset List */}
              <div className="space-y-3">
                {assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {asset.icon}
                      <span className="font-medium">{asset.symbol}</span>
                    </div>
                    <span className="text-gray-300">{asset.balance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Deposit' && (
            <div className="p-4 text-center text-gray-400">
              <div className="mt-8">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-600" />
                <p>Deposit functionality coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'Withdraw' && (
            <div className="p-4 text-center text-gray-400">
              <div className="mt-8">
                <TrendingDown size={48} className="mx-auto mb-4 text-gray-600" />
                <p>Withdraw functionality coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Footer Buttons */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
            <Key size={16} />
            Export Key
          </button>
          <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>
    </>
  );
};

export default EmbededPanel;
