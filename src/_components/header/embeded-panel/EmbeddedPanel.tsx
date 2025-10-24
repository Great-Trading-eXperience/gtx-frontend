'use client';

import { useTokenMappings } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useTokenMappings';
import { useBalancesFromIndexer } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useBalancesFromIndexer';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AssetTab } from './AssetTab';
import { DepositTab } from './DepositTab';
import { HistoryTab } from './HistoryTab';
import { WithdrawTab } from './WithdrawTab';

export interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmbeddedPanel: React.FC<RightPanelProps> = ({ isOpen, onClose }) => {
  const { logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const externalWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');

  const externalWalletAddress = externalWallet?.address || 'Not Connected';
  const embeddedWalletAddress = embeddedWallet?.address || 'Not Created';

  const [activeTab, setActiveTab] = useState<'Asset' | 'Deposit' | 'Withdraw' | 'History'>('Asset');

  // Get token mappings from API
  const {
    data: tokenMappings,
    isLoading: tokenMappingsLoading,
    error: tokenMappingsError,
  } = useTokenMappings(externalWalletAddress, isOpen);

  // Get token balances from indexer for the embedded wallet
  const {
    data: indexedBalances,
    isLoading: indexedBalancesLoading,
    error: indexedBalancesError,
    refetch: refetchIndexedBalances,
  } = useBalancesFromIndexer(embeddedWalletAddress, isOpen, activeTab);

  // Use token mappings directly
  const allUniqueTokens = tokenMappings || [];

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <aside
        className={`fixed top-0 right-0 h-full w-[] bg-[#18191B] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col rounded-l-lg embedded-panel`}
        role="dialog"
        aria-modal="true"
        aria-label="Side navigation panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">GTX Wallet</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <LogOut size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
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
                {externalWalletAddress.slice(0, 6)}...{externalWalletAddress.slice(-4)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">GTX wallet</span>
              <LogOut size={16} className="text-gray-400" />
            </div>
            <div className="text-xs text-gray-400">Not Created</div>
          </div>

          <div className="mt-3 border border border-gray-600 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-300 font-mono break-all">
              {embeddedWalletAddress}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(embeddedWalletAddress)}
              className="ml-2 p-1 hover:bg-gray-700 rounded"
            >
              <LogOut size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-700">
          {(['Asset', 'Deposit', 'Withdraw', 'History'] as const).map(tab => (
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

        <div className="flex-1 overflow-y-auto h-96">
          {activeTab === 'Asset' && (
            <AssetTab
              allUniqueTokens={allUniqueTokens}
              embeddedWalletAddress={embeddedWalletAddress}
              isOpen={isOpen}
              activeTab={activeTab}
              indexedBalances={indexedBalances}
              indexedBalancesLoading={indexedBalancesLoading}
              indexedBalancesError={indexedBalancesError}
              refetchIndexedBalances={refetchIndexedBalances}
            />
          )}
          {activeTab === 'Deposit' && (
            <DepositTab
              allUniqueTokens={allUniqueTokens}
              embeddedWalletAddress={embeddedWalletAddress}
              externalWalletAddress={externalWalletAddress}
              isOpen={isOpen}
              activeTab={activeTab}
            />
          )}
          {activeTab === 'Withdraw' && (
            <WithdrawTab
              allUniqueTokens={allUniqueTokens}
              embeddedWalletAddress={embeddedWalletAddress}
              externalWalletAddress={externalWalletAddress}
              isOpen={isOpen}
              activeTab={activeTab}
            />
          )}
          {activeTab === 'History' && (
            <HistoryTab
              externalWalletAddress={externalWalletAddress}
              isOpen={isOpen}
              activeTab={activeTab}
            />
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={exportWallet}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Export Key
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Disconnect
          </button>
        </div>
      </aside>
    </>
  );
};

export default EmbeddedPanel;