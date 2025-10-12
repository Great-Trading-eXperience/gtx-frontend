'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
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
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { poolsQuery, poolsPonderQuery } from '@/graphql/gtx/clob';
import { getUseSubgraph } from '@/utils/env';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { Asset, Balance, CrossChainTransfersResponse, PoolsResponse, Transaction } from '../types/wallet.types';

// GraphQL query for crosschain history
const getCrossChainTransfersQuery = `
  query GetCrossChainTransferss($sender: String!) {
    crossChainTransferss(
      where: {
        amount_gt: "0"
        sender: $sender
      }
      orderBy: "timestamp"
      orderDirection: "desc"
    ) {
      items {
        direction
        amount
        recipient
        sender
        sourceChainId
        sourceToken
        dispatchMessage {
          chainId
          blockNumber
          messageId
          sender
          timestamp
          transactionHash
          type
          pairedMessages {
            items {
              blockNumber
              chainId
              type
              transactionHash
              timestamp
              id
              sender
            }
          }
        }
      }
    }
  }
`;

export default function WalletPage() {
  const { logout, exportWallet } = usePrivy();
  const walletState = useWalletState();
  const [activeTab, setActiveTab] = useState<
    'Asset' | 'Deposit' | 'Withdraw' | 'History'
  >('Deposit');

  const defaultChainId = Number(DEFAULT_CHAIN);
  const displayChainId =
    walletState.embeddedChainId || walletState.connectedChainId || getCoreChain();

  // Fetch pools data
  const { data: poolsData } = useQuery<PoolsResponse>({
    queryKey: ['pools', displayChainId],
    queryFn: async () => {
      const url = GTX_GRAPHQL_URL(displayChainId);
      if (!url) throw new Error('GraphQL URL not found');

      const useSubgraph = getUseSubgraph();
      const query = useSubgraph ? poolsQuery : poolsPonderQuery;

      return await request(url, query);
    },
    enabled: !!displayChainId,
  });

  // Get unique tokens from pools
  const pools = poolsData?.pools || [];
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
  const {
    deposit: privyDeposit,
    loading: depositLoading,
    currentStep: depositCurrentStep,
    error: depositError,
    resetState: depositResetState,
  } = usePrivyDeposit();

  const {
    deposit: crosschainDeposit,
    loading: crosschainDepositLoading,
    currentStep: crosschainDepositCurrentStep,
    error: crosschainDepositError,
    resetState: crosschainDepositResetState,
  } = useCrosschainDeposit();

  const {
    withdraw: privyWithdraw,
    loading: withdrawLoading,
    currentStep: withdrawCurrentStep,
    error: withdrawError,
    resetState: withdrawResetState,
  } = usePrivyWithdraw();

  // Fetch crosschain history
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<CrossChainTransfersResponse>({
    queryKey: ['crosschain-history', walletState.externalAddress],
    queryFn: async () => {
      if (
        !walletState.externalAddress ||
        walletState.externalAddress === 'Not Connected'
      ) {
        throw new Error('External wallet address not available');
      }
      const currentChainId = walletState.connectedChainId || defaultChainId;
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');

      return await request(url, getCrossChainTransfersQuery, {
        sender: walletState.externalAddress,
      });
    },
    enabled:
      !!walletState.externalAddress && walletState.externalAddress !== 'Not Connected',
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });

  // Transform history data for HistoryTab component
  const transactions: Transaction[] = (historyData?.crossChainTransferss?.items || []).map(
    (transfer: any) => {
      const getTokenInfo = (address: string) => {
        const addr = address.toLowerCase();
        if (
          addr === '0x1362dd75d8f1579a0ebd62df92d8f3852c3a7516' ||
          addr === '0x5eafc52d170ff391d41fba99a7e91b9c4d49929a'
        ) {
          return { symbol: 'USDT', decimals: 6 };
        } else if (
          addr === '0xb2e9eabb827b78e2ac66be17327603778d117d18' ||
          addr === '0x6b4c6c7521b3ed61a9fa02e926b73d278b2a6ca7'
        ) {
          return { symbol: 'WETH', decimals: 18 };
        } else if (addr === '0x02950119c4ccd1993f7938a55b8ab8384c3cce4f') {
          return { symbol: 'USDC', decimals: 18 };
        } else if (addr === '0x24e55f604ff98a03b9493b53ba3ddebd7d02733a') {
          return { symbol: 'WBTC', decimals: 8 };
        }
        return { symbol: 'Token', decimals: 18 };
      };

      const tokenInfo = getTokenInfo(transfer.sourceToken);
      const amount = parseFloat(transfer.amount) / Math.pow(10, tokenInfo.decimals);
      const processMessage = transfer.dispatchMessage.pairedMessages?.items?.find(
        (msg: any) => msg.type === 'PROCESS'
      );

      return {
        id: transfer.dispatchMessage.transactionHash,
        type: transfer.direction === 'DEPOSIT' ? 'deposit' : 'withdrawal',
        amount: amount.toFixed(4),
        token: tokenInfo.symbol,
        sourceChain: ChainManager.getChainName(parseInt(transfer.sourceChainId)),
        destChain:
          transfer.direction === 'DEPOSIT'
            ? 'Rari'
            : ChainManager.getChainName(parseInt(transfer.dispatchMessage.chainId)),
        from: transfer.sender,
        to: transfer.recipient,
        timestamp: parseInt(transfer.dispatchMessage.timestamp),
        sourceTxHash: transfer.dispatchMessage.transactionHash,
        destTxHash: processMessage?.transactionHash,
        messageId: transfer.dispatchMessage.messageId,
        status: processMessage ? 'completed' : 'processing',
        sourceChainId: parseInt(transfer.sourceChainId),
        destChainId: processMessage ? parseInt(processMessage.chainId) : 1918988905,
      };
    }
  );

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
      const sourceChainId = walletState.connectedChainId || defaultChainId;

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
        (selectedToken as any)?.sourceAddresses?.[sourceChainId] || tokenAddress;

      crosschainDeposit(
        amount,
        sourceTokenAddress,
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
    <div className="flex flex-col h-full">
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

      <WalletFooter onExport={exportWallet} onLogout={logout} />
    </div>
  );
}
