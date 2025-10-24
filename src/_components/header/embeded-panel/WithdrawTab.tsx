'use client';

import React, { useState } from 'react';
import { ChevronDown, Copy, CreditCard } from 'lucide-react';
import { usePrivyWithdraw } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyWithdraw';
import { formatNumber } from '@/lib/utils';

interface WithdrawTabProps {
  allUniqueTokens: any[];
  embeddedWalletAddress: string;
  externalWalletAddress: string;
  isOpen: boolean;
  activeTab: string;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const WithdrawTab: React.FC<WithdrawTabProps> = ({
  allUniqueTokens,
  embeddedWalletAddress,
  externalWalletAddress,
  isOpen,
  activeTab,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedWithdrawTokenAddress, setSelectedWithdrawTokenAddress] = useState('');
  const [isWithdrawDropdownOpen, setIsWithdrawDropdownOpen] = useState(false);
  const [withdrawToDifferentWallet, setWithdrawToDifferentWallet] = useState(false);
  const [withdrawWallet, setWithdrawWallet] = useState(externalWalletAddress);

  // Generate tokens from API data
  const tokens = React.useMemo(() => {
    if (!allUniqueTokens.length) return [];

    const colorMap = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
    ];

    return allUniqueTokens.map((token, index) => ({
      symbol: token.symbol,
      name: token.symbol,
      color: colorMap[index % colorMap.length],
      initial: token.symbol.charAt(0).toUpperCase(),
      address: token.address,
      decimals: token.decimals,
    }));
  }, [allUniqueTokens]);

  // Set default selected token
  React.useEffect(() => {
    if (tokens.length > 0 && !selectedWithdrawTokenAddress) {
      const defaultToken = tokens[0];
      setSelectedWithdrawTokenAddress(defaultToken.address);
    }
  }, [tokens, selectedWithdrawTokenAddress]);

  const selectedWithdrawToken = tokens.find(t => t.address === selectedWithdrawTokenAddress);

  const {
    withdraw,
    loading: withdrawLoading,
    resetState: withdrawResetState,
  } = usePrivyWithdraw();

  const handleWithdraw = () => {
    if (!withdrawAmount || !selectedWithdrawToken) return;

    const targetAddress = withdrawToDifferentWallet ? withdrawWallet : externalWalletAddress;
    
    withdraw(targetAddress, withdrawAmount, selectedWithdrawToken.address);
    
    // Reset form
    setWithdrawAmount('');
    setTimeout(() => {
      // TODO: Refresh balances after withdrawal
    }, 1000);
  };

  if (!isOpen || activeTab !== 'Withdraw') return null;

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">From your GTX wallet</div>
        <div className="border border-gray-600 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">GTX</div>
            <span className="text-sm text-gray-300 font-mono break-all">{embeddedWalletAddress}</span>
          </div>
          <button
            onClick={() => copyToClipboard(embeddedWalletAddress)}
            className="ml-2 p-1 hover:bg-gray-700 rounded"
          >
            <Copy size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="p-2">
          <ChevronDown size={36} className="text-[#00B4C8]" />
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">Send to {withdrawToDifferentWallet ? 'custom wallet' : 'login wallet'}</div>
        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setIsWithdrawDropdownOpen(!isWithdrawDropdownOpen)}
              >
                <div
                  className={`w-8 h-8 ${selectedWithdrawToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                >
                  {selectedWithdrawToken?.initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {selectedWithdrawToken?.name}
                  </span>
                  <span className="text-gray-400 text-xs font-mono">
                    {selectedWithdrawToken?.address &&
                      `${selectedWithdrawToken.address.slice(0, 6)}...${selectedWithdrawToken.address.slice(-4)}`
                    }
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isWithdrawDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 0-6 6" />
                </svg>
              </div>

              {isWithdrawDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
                  {tokens.map(token => (
                    <div
                      key={token.address}
                      className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                      onClick={() => setSelectedWithdrawTokenAddress(token.address)}
                    >
                      <div
                        className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                      >
                        {token.initial}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {token.name}
                          </span>
                          {token.address && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                copyToClipboard(token.address);
                              }}
                              className="p-1 hover:bg-gray-600 rounded opacity-70 hover:opacity-100 transition-opacity"
                              title={`Copy ${token.name} address`}
                            >
                              <Copy size={10} className="text-gray-400" />
                            </button>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs font-mono">
                          {token.address
                            ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                            : ''}
                        </span>
                      </div>
                      {selectedWithdrawTokenAddress === token.address && (
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            type="number"
            placeholder="0.00"
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            className="bg-transparent text-white text-right font-medium outline-none w-full"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={withdrawToDifferentWallet}
              onChange={e => setWithdrawToDifferentWallet(e.target.checked)}
              className="sr-only"
            />
            <div className="w-6 h-6 border-2 rounded cursor-pointer" onClick={() => setWithdrawToDifferentWallet(!withdrawToDifferentWallet)}>
              <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${withdrawToDifferentWallet ? 'bg-green-400 border-green-400' : 'border-gray-400'}`}>
                <span>{withdrawToDifferentWallet ? '✓' : ''}</span>
              </div>
            </div>
            <span>Withdraw to a different wallet</span>
          </label>

          {withdrawToDifferentWallet && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="0x0000...0000"
                value={withdrawWallet}
                onChange={e => setWithdrawWallet(e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleWithdraw}
          disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
            !withdrawAmount || parseFloat(withdrawAmount) <= 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
          }`}
        >
          {withdrawLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-t-2 border-r-2 border-b border-l animate-spin" role="status"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Send</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};