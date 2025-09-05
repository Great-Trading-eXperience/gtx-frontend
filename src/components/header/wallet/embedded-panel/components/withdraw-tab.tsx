"use client"

import { formatNumber } from "@/lib/utils";
import { ChevronDown, Copy, CreditCard, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Token {
  symbol: string;
  name: string;
  color: string;
  initial: string;
  address: string;
  decimals: number;
}

interface TokenBalance {
  token: { address: string; symbol: string };
  displayBalance: string;
  refetch: () => void;
}

interface WithdrawTabProps {
  tokens: Token[];
  tokenBalances: TokenBalance[];
  selectedWithdrawTokenAddress: string;
  setSelectedWithdrawTokenAddress: (address: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  withdrawToDifferentWallet: boolean;
  setWithdrawToDifferentWallet: (value: boolean) => void;
  withdrawWallet: string;
  setwithdrawWallet: (wallet: string) => void;
  handlePrivyWithdraw: () => void;
  withdrawLoading: boolean;
  withdrawCurrentStep: string;
  externalWalletAddress: string;
  embeddedWalletAddress: string;
}

const WithdrawTab: React.FC<WithdrawTabProps> = ({
  tokens,
  tokenBalances,
  selectedWithdrawTokenAddress,
  setSelectedWithdrawTokenAddress,
  withdrawAmount,
  setWithdrawAmount,
  withdrawToDifferentWallet,
  setWithdrawToDifferentWallet,
  withdrawWallet,
  setwithdrawWallet,
  handlePrivyWithdraw,
  withdrawLoading,
  withdrawCurrentStep,
  externalWalletAddress,
  embeddedWalletAddress
}) => {
  const [isWithdrawDropdownOpen, setIsWithdrawDropdownOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shortenAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  const handleWithdrawTokenSelect = (tokenAddress: string) => {
    setSelectedWithdrawTokenAddress(tokenAddress);
    setIsWithdrawDropdownOpen(false);
  };

  const currentWithdrawToken = tokens.find(token => token.address === selectedWithdrawTokenAddress);

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">From your GTX wallet</div>
        <div className="border border-gray-600 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-gray-300 font-mono break-all">
            {embeddedWalletAddress}
          </span>
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
        <div className="text-sm text-gray-400 mb-3">
          Send to login wallet: {shortenAddress(externalWalletAddress)}
        </div>

        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setIsWithdrawDropdownOpen(!isWithdrawDropdownOpen)}
              >
                <div
                  className={`w-8 h-8 ${currentWithdrawToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                >
                  {currentWithdrawToken?.initial}
                </div>
                <span className="text-white font-medium">
                  {currentWithdrawToken?.name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isWithdrawDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isWithdrawDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
                  {tokens.map(token => (
                    <div
                      key={token.address}
                      className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                      onClick={() => handleWithdrawTokenSelect(token.address)}
                    >
                      <div
                        className={`w-6 h-6 ${token.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                      >
                        {token.initial}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{token.name}</span>
                          {token.address && (
                            <button
                              onClick={(e) => {
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
                          {token.address ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}` : ''}
                        </span>
                      </div>
                      {selectedWithdrawTokenAddress === token.address && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              className="bg-transparent text-white text-right font-medium outline-none w-full ml-4"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard size={14} />
            <span>{(() => {
              const selectedToken = tokens.find(t => t.address === selectedWithdrawTokenAddress);
              const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
              return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
            })()}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={withdrawToDifferentWallet}
            onChange={e => setWithdrawToDifferentWallet(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 border-2 rounded transition-colors duration-200 ${
              withdrawToDifferentWallet
                ? 'bg-green-400 border-green-400'
                : 'border-gray-400'
            }`}
          >
            {withdrawToDifferentWallet && (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <span>Withdraw to a different wallet</span>
        </label>

        {withdrawToDifferentWallet && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="0x0000...0000"
              value={withdrawWallet}
              onChange={e => setwithdrawWallet(e.target.value)}
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      <button
        onClick={handlePrivyWithdraw}
        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
          !withdrawAmount || parseFloat(withdrawAmount) <= 0
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
        }`}
      >
        {withdrawLoading &&
        withdrawCurrentStep !== 'Transaction submitted successfully!' ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Send</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default WithdrawTab;