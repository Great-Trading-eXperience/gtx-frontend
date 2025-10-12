import { useState } from 'react';
import { ChevronDown, CreditCard, RefreshCw } from 'lucide-react';
import { TokenSelector } from './tokenSelector';
import { formatNumber } from '@/lib/utils';
import { BalanceHookResult, Token } from '../types/wallet.types';

interface WithdrawTabProps {
  tokens: Token[];
  balances: BalanceHookResult[];
  embeddedAddress: string;
  externalAddress: string;
  onWithdraw: (amount: string, tokenAddress: string, recipientAddress: string) => void;
  loading?: boolean;
}

export function WithdrawTab({
  tokens,
  balances,
  embeddedAddress,
  externalAddress,
  onWithdraw,
  loading = false,
}: WithdrawTabProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(tokens[0]?.address || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customWallet, setCustomWallet] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(externalAddress);

  const currentToken = tokens.find(t => t.address === selectedToken);
  const currentBalance = balances.find(b => b.token.address === selectedToken);

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    onWithdraw(withdrawAmount, selectedToken, recipientAddress);
  };

  const setMaxAmount = () => {
    if (currentBalance?.displayBalance) {
      setWithdrawAmount(currentBalance.displayBalance);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="p-4">
      {/* From Section */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-3">From your GTX wallet</div>
        <div className="border border-gray-600 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-gray-300 font-mono break-all">
            {embeddedAddress}
          </span>
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
        <div className="text-sm text-gray-400 mb-3">
          Send to: {shortenAddress(recipientAddress)}
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
              onCopy={addr => navigator.clipboard.writeText(addr)}
            />

            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              className="outline-none bg-transparent text-right font-medium w-full ml-4"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CreditCard size={14} />
              <span>
                {formatNumber(Number(currentBalance?.displayBalance || '0'), {
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

      {/* Custom Wallet Option */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={customWallet}
            onChange={e => {
              setCustomWallet(e.target.checked);
              if (!e.target.checked) setRecipientAddress(externalAddress);
            }}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 border-2 rounded transition-colors duration-200 ${
              customWallet ? 'bg-green-400 border-green-400' : 'border-gray-400'
            }`}
          >
            {customWallet && (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <span>Withdraw to a different wallet</span>
        </label>

        {customWallet && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="0x0000...0000"
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
          </div>
        )}
      </div>

      {/* Withdraw Button */}
      <button
        onClick={handleWithdraw}
        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
          !withdrawAmount || parseFloat(withdrawAmount) <= 0 || loading
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
          'Send'
        )}
      </button>
    </div>
  );
}
