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
  ChevronDown,
  Key,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useWallets, usePrivy } from '@privy-io/react-auth';

interface Asset {
  symbol: string;
  balance: string;
  icon: React.ReactNode;
}

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function shortenAddress(
  address: string | undefined | null,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

const EmbededPanel: React.FC<RightPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const { logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');

  const externalWalletAddress = externalWallet?.address || 'Not Connected';
  const embeddedWalletAddress = embeddedWallet?.address || 'Not Created';

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

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToDifferentWallet, setWithdrawToDifferentWallet] = useState(false);
  const [differentWalletAddress, setDifferentWalletAddress] = useState('');

  const handleDeposit = () => {
    console.log('Processing deposit...');
  };

  const handleWithdraw = () => {
    console.log('Processing withdrawal...', {
      amount: withdrawAmount,
      toDifferentWallet: withdrawToDifferentWallet,
      address: withdrawToDifferentWallet ? differentWalletAddress : externalWalletAddress,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
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
              <div className="w-fit border-b border-dashed border-gray-400">
                <span className="text-sm text-gray-300">Login wallet</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <img
                  src={externalWallet?.meta.icon}
                  alt="Wallet Icon"
                  height={20}
                  width={20}
                />
              </div>
              <span className="text-sm text-gray-300">
                {shortenAddress(externalWalletAddress)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">GTX wallet</span>
              <QrCode size={16} className="text-gray-400" />
              <Edit3 size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="mt-3 border border-gray-600 rounded-lg p-3 flex items-center justify-between">
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

        {/* Wallet Tabs */}
        <div className="flex border-b border-gray-700">
          {(['Asset', 'Deposit', 'Withdraw'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-[#00B4C8] border-b-2 border-[#00B4C8]'
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
            <div className="p-4">
              {/* Deposit Info Banner */}
              {/* <div className="mb-6 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                <div className="text-center text-sm text-gray-300">
                  Kuru supports only MON deposits
                </div>
              </div> */}

              {/* From Connected Wallet */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">
                  From connected wallet: {shortenAddress(externalWalletAddress)}
                </div>

                {/* Token Selection */}
                <div className="mb-4 p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <img
                          src="/network/rise.svg"
                          alt="Logo Rise"
                          height={12}
                          width={12}
                        />
                      </div>
                      <span className="text-white font-medium">RIS</span>
                    </div>
                    <input
                      type="number"
                      className="outline-none bg-transparent text-right font-medium w-full ml-4"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Fee Display */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>0.95</span>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-6">
                <div className="p-2">
                  <ChevronDown size={36} className="text-[#00B4C8]" />
                </div>
              </div>

              {/* To Your GTX Wallet */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">To your GTX wallet</div>
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

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                className="w-full bg-[#0078D4] hover:bg-[#0064C8] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Deposit
              </button>
            </div>
          )}

          {activeTab === 'Withdraw' && (
            <div className="p-4">
              {/* From Your Kuru Wallet */}
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

              {/* Arrow Down */}
              <div className="flex justify-center mb-6">
                <div className="p-2">
                  <ChevronDown size={36} className="text-[#00B4C8]" />
                </div>
              </div>

              {/* Send To Section */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">
                  Send to login wallet: {shortenAddress(externalWalletAddress)}
                </div>

                {/* Token and Amount */}
                <div className="mb-4 p-4 border border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <img
                          src="/network/rise.svg"
                          alt="Logo Rise"
                          height={12}
                          width={12}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">RIS</span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="bg-transparent text-white text-right font-medium outline-none w-full ml-4"
                    />
                  </div>

                  {/* Fee Display */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard size={14} />
                    <span>0.95</span>
                  </div>
                </div>
              </div>

              {/* Withdraw to Different Wallet Option */}
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

                {/* Different Wallet Address Input */}
                {withdrawToDifferentWallet && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="0x0000...0000"
                      value={differentWalletAddress}
                      onChange={e => setDifferentWalletAddress(e.target.value)}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  !withdrawAmount || parseFloat(withdrawAmount) <= 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0078D4] hover:bg-[#0064C8] text-white'
                }`}
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Wallet Footer Buttons */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={exportWallet}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Key size={16} />
            Export Key
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>
    </>
  );
};

export default EmbededPanel;
