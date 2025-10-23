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
      const currentChainId = walletState.externalChainId;
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
    historyData?.crossChainTransferss.items || []
  ).map((transfer: any) => {
    const getTokenInfo = (address: string) => {
      const addr = address.toLowerCase();
      if (
        addr === '0xD9d572665156732D1B61f3Bc3cfb08A5c20b2b2E'.toLowerCase() ||
        addr === '0xc96304e3c037f81dA488ed9dEa1D8F2a48278a75'.toLowerCase()
      ) {
        return { symbol: 'WETH', decimals: 18 };
      } else if (
        addr === '0x50a2DBf1c98A23f7430baC7abe71A4fD673213c1'.toLowerCase() ||
        addr === '0xc0F115A19107322cFBf1cDBC7ea011C19EbDB4F8'.toLowerCase()
      ) {
        return { symbol: 'USDC', decimals: 6 };
      } else if (
        addr === '0xb7779646a29d3510076DFDd7e60C203fa7093a29'.toLowerCase() ||
        addr === '0x34B40BA116d5Dec75548a9e9A8f15411461E8c70'.toLowerCase()
      ) {
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
          ? 'Core Devnet'
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
