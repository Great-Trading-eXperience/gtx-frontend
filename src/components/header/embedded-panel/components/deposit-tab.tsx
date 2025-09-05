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
  externalBalance: string;
  displayBalance: string;
  refetch: () => void;
}

interface DepositTabProps {
  tokens: Token[];
  tokenBalances: TokenBalance[];
  selectedDepositTokenAddress: string;
  setSelectedDepositTokenAddress: (address: string) => void;
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  handlePrivyDeposit: () => void;
  depositLoading: boolean;
  crosschainDepositLoading: boolean;
  depositCurrentStep: string;
  crosschainDepositCurrentStep: string;
  externalWalletAddress: string;
  embeddedWalletAddress: string;
  allUniqueTokens: any[];
  chainId: number;
  FEATURE_FLAGS: { CROSSCHAIN_DEPOSIT_ENABLED: boolean };
}

const DepositTab: React.FC<DepositTabProps> = ({
  tokens,
  tokenBalances,
  selectedDepositTokenAddress,
  setSelectedDepositTokenAddress,
  depositAmount,
  setDepositAmount,
  handlePrivyDeposit,
  depositLoading,
  crosschainDepositLoading,
  depositCurrentStep,
  crosschainDepositCurrentStep,
  externalWalletAddress,
  embeddedWalletAddress,
  allUniqueTokens,
  chainId,
  FEATURE_FLAGS
}) => {
  const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shortenAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  const handleDepositTokenSelect = (tokenAddress: string) => {
    setSelectedDepositTokenAddress(tokenAddress);
    setIsDepositDropdownOpen(false);
  };

  const currentDepositToken = tokens.find(token => token.address === selectedDepositTokenAddress);

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">
          From connected wallet: {shortenAddress(externalWalletAddress)}
        </div>

        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setIsDepositDropdownOpen(!isDepositDropdownOpen)}
              >
                <div
                  className={`w-8 h-8 ${currentDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                >
                  {currentDepositToken?.initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {currentDepositToken?.name}
                  </span>
                  {(() => {
                    // For "From connected wallet", show the SOURCE address (external wallet's chain)
                    const selectedUniqueToken = allUniqueTokens.find(ut => ut.address === currentDepositToken?.address);
                    const sourceAddress = (selectedUniqueToken as any)?.sourceAddresses?.[chainId] || currentDepositToken?.address;
                    return sourceAddress && (
                      <span className="text-gray-400 text-xs font-mono">
                        {`${sourceAddress.slice(0, 6)}...${sourceAddress.slice(-4)}`}
                      </span>
                    );
                  })()}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isDepositDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {isDepositDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[230px] z-10">
                  {tokens.map(token => (
                    <div
                      key={token.address}
                      className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors"
                      onClick={() => handleDepositTokenSelect(token.address)}
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
                      {selectedDepositTokenAddress === token.address && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              value={depositAmount}
              onChange={e => {
                setDepositAmount(e.target.value);
              }}
              className="outline-none bg-transparent text-right font-medium w-full ml-4"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard size={14} />
            <span>{(() => {
              const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
              const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
              // Source wallet should ALWAYS show ERC20 balance (what user actually has in their external wallet)
              // This is what they can deposit from, regardless of crosschain or regular deposits
              const sourceBalance = tokenBalance?.externalBalance; // External wallet ERC20 balance
              return formatNumber(Number(sourceBalance || '0'), {decimals: 2, compact: true});
            })()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="p-2">
          <ChevronDown size={36} className="text-[#00B4C8]" />
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
          <span>To your GTX wallet: {shortenAddress(embeddedWalletAddress)}</span>
          <button
            onClick={() => copyToClipboard(embeddedWalletAddress)}
            className="ml-2 p-1 hover:bg-gray-700 rounded"
            title="Copy GTX wallet address"
          >
            <Copy size={14} className="text-gray-400" />
          </button>
        </div>
        
        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${currentDepositToken?.color} rounded-full flex items-center justify-center text-white font-medium`}
                >
                  {currentDepositToken?.initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {currentDepositToken?.name ? `gs${currentDepositToken.name}` : ''}
                  </span>
                  {currentDepositToken?.address && (
                    <span className="text-gray-400 text-xs font-mono">
                      {`${currentDepositToken.address.slice(0, 6)}...${currentDepositToken.address.slice(-4)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-right font-medium w-full ml-4 text-gray-300">
              {(() => {
                const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
                const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
                return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
              })()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard size={14} />
            <span>{(() => {
              const selectedToken = tokens.find(t => t.address === selectedDepositTokenAddress);
              const tokenBalance = tokenBalances.find(tb => tb.token.address === selectedToken?.address);
              return formatNumber(Number(tokenBalance?.displayBalance || '0'), {decimals: 2, compact: true});
            })()}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePrivyDeposit}
        className="w-full bg-[#0078D4] hover:bg-[#0064C8] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
      >
        {(depositLoading && depositCurrentStep !== 'Transaction submitted successfully!') || 
        (crosschainDepositLoading && crosschainDepositCurrentStep !== 'Crosschain deposit submitted successfully!') ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Processing Crosschain Deposit...' : 'Depositing...'}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>{FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED ? 'Crosschain Deposit' : 'Deposit'}</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default DepositTab;