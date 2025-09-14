import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { useChainId } from 'wagmi';

// GraphQL query for crosschain transfer history filtered by sender
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

// TypeScript interfaces for crosschain transfer history
interface PairedMessageItem {
  blockNumber: string;
  chainId: string;
  type: string;
  transactionHash: string;
  timestamp: string;
  id: string;
  sender: string;
}

interface DispatchMessage {
  chainId: string;
  blockNumber: string;
  messageId: string;
  sender: string;
  timestamp: string;
  transactionHash: string;
  type: string;
  pairedMessages: {
    items: PairedMessageItem[];
  };
}

interface CrossChainTransfer {
  direction: string;
  amount: string;
  recipient: string;
  sender: string;
  sourceChainId: string;
  sourceToken: string;
  dispatchMessage: DispatchMessage;
}

interface CrossChainTransfersResponse {
  crossChainTransferss: {
    items: CrossChainTransfer[];
  };
}

interface UseCrosschainHistoryProps {
  externalWalletAddress: string;
  isOpen: boolean;
}

export const useCrosschainHistory = ({ externalWalletAddress, isOpen }: UseCrosschainHistoryProps) => {
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);

  const {
    data: crosschainHistoryData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = useQuery<CrossChainTransfersResponse>({
    queryKey: ['crosschain-history', externalWalletAddress],
    queryFn: async () => {
      if (!externalWalletAddress || externalWalletAddress === 'Not Connected') {
        throw new Error('External wallet address not available');
      }
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      
      console.log(`[HISTORY] Fetching crosschain transfers for sender: ${externalWalletAddress}`);
      return await request(url, getCrossChainTransfersQuery, { sender: externalWalletAddress });
    },
    enabled: isOpen && !!externalWalletAddress && externalWalletAddress !== 'Not Connected', // Only fetch when panel is open and external wallet is connected
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });

  return {
    crosschainHistoryData,
    historyLoading,
    historyError,
    refetchHistory
  };
};