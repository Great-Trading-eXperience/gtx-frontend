import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { CrossChainTransfersResponse, Transaction } from '../types/wallet.types';
import request from 'graphql-request';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { ConnectedWallet } from '@privy-io/react-auth';
import { ChainManager } from '../lib/balanceManager';
import { useWalletState } from './useWalletState';

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

export function useHistoryData() {
  const walletState = useWalletState();

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
      const currentChainId = walletState.connectedChainId || Number(DEFAULT_CHAIN);
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
  const transactions: Transaction[] = (
    historyData?.crossChainTransferss?.items || []
  ).map((transfer: any) => {
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
  });

  return {
    transactions,
    historyLoading,
    historyError,
    refetchHistory,
  };
}
