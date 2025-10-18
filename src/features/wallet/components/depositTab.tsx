import { useState } from 'react';
import { ChevronDown, CreditCard, Copy, RefreshCw } from 'lucide-react';
import { TokenSelector } from './tokenSelector';
import { formatNumber } from '@/lib/utils';
import { BalanceHookResult, Token } from '../types/wallet.types';
import { TokenSymbol } from './tokenSymbol';

interface DepositTabProps {
  tokens: Token[];
  balances: BalanceHookResult[];
  embeddedAddress: string;
  externalAddress: string;
  onDeposit: (amount: string, tokenAddress: string, decimals: number) => void;
  loading?: boolean;
  onCopy: (text: string) => void;
}

export function DepositTab({
  tokens,
  balances,
  embeddedAddress,
  externalAddress,
  onDeposit,
  loading = false,
  onCopy,
}: DepositTabProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(tokens[0]?.address || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentToken = tokens.find(t => t.address === selectedToken);
  const currentBalance = balances.find(b => b.token.address === selectedToken);
  const syntheticBalance = balances.find(b => b.symbol === `gs${currentToken?.symbol}`);

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !syntheticBalance) return;
    onDeposit(
      depositAmount,
      syntheticBalance.token.address,
      syntheticBalance.token.decimals
    );
  };

  const setMaxAmount = () => {
    if (currentBalance?.externalBalance) {
      setDepositAmount(currentBalance.externalBalance);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="p-4">
      {/* From Section */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">
          From connected wallet: {shortenAddress(externalAddress)}
        </div>

        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <TokenSelector
              tokens={tokens}
              selected={selectedToken}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onSelect={addr => {
                setSelectedToken(addr);
                setIsDropdownOpen(false);
              }}
              onCopy={onCopy}
            />

            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="outline-none bg-transparent text-right font-medium w-full ml-4"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CreditCard size={14} />
              <span>
                {formatNumber(Number(currentBalance?.externalBalance || '0'), {
                  decimals: 2,
                  compact: true,
                })}
              </span>
            </div>
            <button
              onClick={setMaxAmount}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mb-6">
        <div className="p-2">
          <ChevronDown size={36} className="text-[#00B4C8]" />
        </div>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
          <span>To your GTX wallet: {shortenAddress(embeddedAddress)}</span>
          <button
            onClick={() => onCopy(embeddedAddress)}
            className="ml-2 p-1 hover:bg-gray-700 rounded"
            title="Copy GTX wallet address"
          >
            <Copy size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="mb-4 p-4 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium`}
              >
                <TokenSymbol symbol={syntheticBalance?.symbol || ''} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">gs{currentToken?.symbol}</span>
                <span className="text-gray-400 text-xs font-mono">
                  {syntheticBalance?.token.address
                    ? shortenAddress(syntheticBalance?.token.address)
                    : ''}
                </span>
              </div>
            </div>
            {/* <span className="text-right font-medium text-gray-300">
              {formatNumber(Number(syntheticBalance?.displayBalance || '0'), {
                decimals: 2,
                compact: true,
              })}
            </span> */}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard size={14} />
            <span>
              {formatNumber(Number(syntheticBalance?.displayBalance || '0'), {
                decimals: 2,
                compact: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Deposit Button */}
      <button
        onClick={handleDeposit}
        disabled={!depositAmount || parseFloat(depositAmount) <= 0 || loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
          !depositAmount || parseFloat(depositAmount) <= 0 || loading
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          'Deposit'
        )}
      </button>
    </div>
  );
}
