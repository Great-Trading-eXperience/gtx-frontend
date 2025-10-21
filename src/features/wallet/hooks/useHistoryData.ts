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
    historyData?.crossChainTransferss?.items || []
  ).map((transfer: any) => {
    const getTokenInfo = (address: string) => {
      const addr = address.toLowerCase();
      if (
        addr === '0x0355B7B8cb128fA5692729Ab3AAa199C1753f726'.toLowerCase() ||
        addr === '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E'.toLowerCase()
      ) {
        return { symbol: 'WETH', decimals: 18 };
      } else if (
        addr === '0x8198f5d8F8CfFE8f9C413d98a0A55aEB8ab9FbB7'.toLowerCase() ||
        addr === '0x67d269191c92Caf3cD7723F116c85e6E9bf55933'.toLowerCase()
      ) {
        return { symbol: 'USDC', decimals: 6 };
      } else if (
        addr === '0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB'.toLowerCase() ||
        addr === '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690'.toLowerCase()
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
