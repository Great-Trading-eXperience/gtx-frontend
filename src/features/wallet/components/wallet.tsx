'use client';

import { useMemo, useState } from 'react';
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
import { Asset, BalanceHookResult, WalletTabs } from '../types/wallet.types';
import { useHistoryData } from '../hooks/useHistoryData';
import { usePoolsData } from '../hooks/usePoolsData';

export default function WalletPage() {
  const walletState = useWalletState();
  console.log(walletState);
  const [activeTab, setActiveTab] = useState<WalletTabs>('Deposit');

  const { pools } = usePoolsData(walletState.embeddedChainId);

  const realTokens = useMemo(
    () => [
      // USDC
      {
        address: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933' as `0x${string}`,
        symbol: 'USDC',
        decimals: 6,
        isQuote: true,
        chainId: walletState.externalChainId || 31338,
        // sourceAddresses: {
        //   31338: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933' as `0x${string}`,
        // },
      },
      // WETH
      {
        address: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E' as `0x${string}`,
        symbol: 'WETH',
        decimals: 18,
        isQuote: false,
        chainId: walletState.externalChainId || 31338,
        // sourceAddresses: {
        //   31338: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E' as `0x${string}`,
        // },
      },
      // WBTC
      {
        address: '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690' as `0x${string}`,
        symbol: 'WBTC',
        decimals: 8,
        isQuote: false,
        chainId: walletState.externalChainId || 31338,
        // sourceAddresses: {
        //   31338: '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690' as `0x${string}`,
        // },
      },
    ],
    [walletState.externalChainId]
  );

  const syntheticToken = TokenManager.getUniqueTokens(pools);

  const balances = useMultiTokenBalances(
    realTokens,
    syntheticToken,
    walletState.embeddedAddress,
    walletState.externalAddress,
    walletState.embeddedChainId,
    walletState.externalChainId
  );

  console.log(balances);

  const { realTokenBalances, syntheticTokenBalances } = balances.reduce<{
    realTokenBalances: BalanceHookResult[];
    syntheticTokenBalances: BalanceHookResult[];
  }>(
    (acc, token) => {
      if (token.symbol.startsWith('gs')) {
        acc.syntheticTokenBalances.push(token);
      } else {
        acc.realTokenBalances.push(token);
      }
      return acc;
    },
    { realTokenBalances: [], syntheticTokenBalances: [] }
  );

  // Get unique tokens from pools
  const tokens = TokenManager.getUniqueTokens(pools);

  // Create assets for display
  const assets: Asset[] = TokenManager.createAssets(syntheticTokenBalances);

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

  const currentChainName = ChainManager.getChainName(walletState.externalChainId);

  // Handle deposit
  const handleDeposit = async (
    amount: string,
    tokenAddress: string,
    decimals: number
  ) => {
    const sourceChainId = walletState.externalChainId;

    if (!walletState.externalWallet) return;
    crosschainDeposit({
      amount,
      tokenAddress: tokenAddress as `0x${string}`,
      recipientAddress: walletState.embeddedAddress as `0x${string}`,
      externalWallet: walletState.externalWallet,
      sourceChainId,
      decimals,
    });

    /*
    privyDeposit({
      amount,
      currencyAddress: tokenAddress as `0x${string}`,
      embeddedAddress: walletState.embeddedAddress,
      externalWallet: walletState.externalWallet,
      externalChainId: walletState.externalChainId || 31337,
      decimals: decimals,
    });
    */

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
            tokens={realTokens}
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
            tokens={realTokens}
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
