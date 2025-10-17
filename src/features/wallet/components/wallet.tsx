'use client';

import { useState } from 'react';
import { useWalletState } from '../hooks/useWalletState';
import { useMultiTokenBalances } from '../hooks/useMultiTokenBalance';
import { usePrivyDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyDeposit';
import { usePrivyWithdraw } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/usePrivyWithdraw';
import { useCrosschainDeposit } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useCrosschainDeposit';
import { WalletHeader } from './walletHeader';
import { TabNavigation } from './tabNavigation';
import { WalletFooter } from './walletFooter';
import { AssetTab } from './assetTab';
import { DepositTab } from './depositTab';
import { WithdrawTab } from './withdrawTab';
import { HistoryTab } from './historyTab';
import { ChainManager } from '../lib/balanceManager';
import { TokenManager } from '../lib/tokenManager';
import { FEATURE_FLAGS, getCoreChain } from '@/constants/features/features-config';
import { Asset, WalletTabs } from '../types/wallet.types';
import { useHistoryData } from '../hooks/useHistoryData';
import { usePoolsData } from '../hooks/usePoolsData';

export default function WalletPage() {
  const walletState = useWalletState();
  const [activeTab, setActiveTab] = useState<WalletTabs>('Deposit');

  const displayChainId =
    walletState.embeddedChainId || walletState.connectedChainId || getCoreChain();

  // Fetch pools data
  const { pools } = usePoolsData(displayChainId);

  // Get unique tokens from pools
  const tokens = TokenManager.getUniqueTokens(pools);

  // Get all balances dynamically
  const balances = useMultiTokenBalances(
    tokens,
    walletState.embeddedAddress,
    walletState.externalAddress,
    walletState.embeddedChainId || displayChainId,
    walletState.connectedChainId || displayChainId,
    FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED
  );

  // Create assets for display
  const assets: Asset[] = TokenManager.createAssets(balances);

  // Deposit/Withdraw operations
  const { deposit: privyDeposit, loading: depositLoading } = usePrivyDeposit();

  const { deposit: crosschainDeposit, loading: crosschainDepositLoading } =
    useCrosschainDeposit();

  const { withdraw: privyWithdraw, loading: withdrawLoading } = usePrivyWithdraw();

  const { transactions, historyLoading, refetchHistory } = useHistoryData();

  // Utility functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const currentChainName = ChainManager.getChainName(
    walletState.connectedChainId || walletState.embeddedChainId || displayChainId
  );

  // Handle deposit
  const handleDeposit = async (amount: string, tokenAddress: string) => {
    if (FEATURE_FLAGS.CROSSCHAIN_DEPOSIT_ENABLED) {
      const sourceChainId = walletState.connectedChainId;

      // Validate chain support
      if (!ChainManager.isCrosschainSupported(sourceChainId)) {
        alert('Current chain not supported for crosschain deposits');
        return;
      }

      // Check if chain switch needed
      if (walletState.externalChainId && walletState.externalChainId !== sourceChainId) {
        try {
          await ChainManager.switchChain(walletState.externalWallet, sourceChainId);
          // Wait for chain switch to reflect
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Chain switch failed:', error);
          alert('Please manually switch your wallet to the correct network');
          return;
        }
      }

      // Get source token address for crosschain
      const selectedToken = tokens.find(t => t.address === tokenAddress);
      const sourceTokenAddress =
        selectedToken?.sourceAddresses?.[sourceChainId] || tokenAddress;

      crosschainDeposit(
        amount,
        sourceTokenAddress as `0x${string}`,
        walletState.embeddedAddress as `0x${string}`,
        sourceChainId
      );
    } else {
      privyDeposit(amount, tokenAddress as `0x${string}`);
    }

    // Refetch balances after deposit
    setTimeout(() => {
      balances.forEach(b => b.refetch());
    }, 1000);
  };

  // Handle withdraw
  const handleWithdraw = (
    amount: string,
    tokenAddress: string,
    recipientAddress: string
  ) => {
    privyWithdraw(recipientAddress, amount, tokenAddress as `0x${string}`);

    // Refetch balances after withdraw
    setTimeout(() => {
      balances.forEach(b => b.refetch());
    }, 1000);
  };

  // Get explorer URL helper
  const getExplorerUrl = (chainId: number, txHash: string) => {
    const explorers: Record<number, string> = {
      4661: 'https://explorer.appchain.testnet.espresso.network/tx/',
      421614: 'https://sepolia.arbiscan.io/tx/',
      1918988905: 'https://testnet.explorer.rarichain.org/tx/',
    };
    return explorers[chainId] ? `${explorers[chainId]}${txHash}` : '#';
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <WalletHeader
        externalAddress={walletState.externalAddress}
        embeddedAddress={walletState.embeddedAddress}
        externalWalletIcon={walletState.externalWallet?.meta.icon}
        currentChainName={currentChainName}
        onCopy={copyToClipboard}
      />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto h-96">
        {activeTab === 'Asset' && <AssetTab assets={assets} />}

        {activeTab === 'Deposit' && (
          <DepositTab
            tokens={tokens}
            balances={balances}
            embeddedAddress={walletState.embeddedAddress}
            externalAddress={walletState.externalAddress}
            onDeposit={handleDeposit}
            loading={depositLoading || crosschainDepositLoading}
            onCopy={copyToClipboard}
          />
        )}

        {activeTab === 'Withdraw' && (
          <WithdrawTab
            tokens={tokens}
            balances={balances}
            embeddedAddress={walletState.embeddedAddress}
            externalAddress={walletState.externalAddress}
            onWithdraw={handleWithdraw}
            loading={withdrawLoading}
          />
        )}

        {activeTab === 'History' && (
          <HistoryTab
            transactions={transactions}
            loading={historyLoading}
            onRefresh={refetchHistory}
            getExplorerUrl={getExplorerUrl}
          />
        )}
      </div>

      <WalletFooter />
    </div>
  );
}
