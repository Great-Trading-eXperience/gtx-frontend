'use client';

import React from 'react';
import { ExternalLink, History, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from '@/lib/utils';
import urlsConfig from '@/constants/urls/urls-config.json';
import { ProcessedTokenMapping } from '@/hooks/web3/gtx/clob-dex/embedded-wallet/useTokenMappings';
import { getChainName } from '@/utils/chain-override';

interface HistoryTabProps {
  externalWalletAddress: string;
  isOpen: boolean;
  activeTab: string;
  tokenMappings?: ProcessedTokenMapping[];
}

interface CrossChainTransfer {
  id: string;
  amount: string;
  direction: string;
  sourceChainId: number;
  sourceToken: string;
  sourceBlockNumber: string;
  sourceTransactionHash: string;
  destinationChainId: number;
  destinationBlockNumber: string;
  destinationTimestamp: number;
  destinationTransactionHash: string;
  destinationToken: string | null;
  sender: string;
  recipient: string;
  status: string;
  timestamp: number;
  messageId: string;
  dispatchMessage: {
    chainId: number;
    blockNumber: string;
    messageId: string;
    sender: string;
    timestamp: number;
    transactionHash: string;
    type: string;
  };
  processMessage: {
    chainId: number;
    blockNumber: string;
    messageId: string;
    sender: string;
    timestamp: number;
    transactionHash: string;
    type: string;
  };
}

interface CrossChainTransfersResponse {
  items: CrossChainTransfer[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  externalWalletAddress,
  isOpen,
  activeTab,
  tokenMappings = [],
}) => {

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<CrossChainTransfersResponse>({
    queryKey: ['crosschain-history', externalWalletAddress],
    queryFn: async () => {
      if (!externalWalletAddress || externalWalletAddress === 'Not Connected') {
        throw new Error('External wallet address not available');
      }
      
      // Use the new REST API endpoint for cross-chain transfers
      const url = `https://side-indexer-devnet.gtxdex.xyz/api/cross-chain-deposits?user=${externalWalletAddress}`;
      
      console.log(`[HISTORY] Fetching crosschain transfers for user: ${externalWalletAddress} from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'origin': window.location.origin,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crosschain transfers: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[HISTORY] Raw API response:', data);
      
      return data;
    },
    enabled: isOpen && activeTab === 'History' && !!externalWalletAddress && externalWalletAddress !== 'Not Connected',
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });


  const getExplorerUrl = (chainId: number, txHash: string) => {
    const id = chainId.toString();
    const baseUrl = urlsConfig.EXPLORER_URLS[id as keyof typeof urlsConfig.EXPLORER_URLS];
    return baseUrl ? `${baseUrl}${txHash}` : '#';
  };

  const getTokenInfo = (address: string) => {
    const addr = address.toLowerCase();
    
    // First try to find token info from tokenMappings
    const tokenMapping = tokenMappings.find(token => 
      token.address.toLowerCase() === addr ||
      Object.values(token.sourceAddresses).some(sourceAddr => sourceAddr.toLowerCase() === addr)
    );
    
    if (tokenMapping) {
      return { symbol: tokenMapping.symbol, decimals: tokenMapping.decimals };
    }
  };

  if (!isOpen || activeTab !== 'History') return null;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Transaction History</h3>
            <p className="text-xs text-gray-400">
              Transactions initiated by your external wallet
            </p>
          </div>
          <button
            onClick={() => refetchHistory()}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh history"
          >
            <RefreshCw
              className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {!externalWalletAddress || externalWalletAddress === 'Not Connected' ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">External wallet not connected</p>
            <p className="text-gray-500 text-sm mt-1">
              Connect your external wallet to view transaction history
            </p>
          </div>
        ) : historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading history...</span>
          </div>
        ) : historyError ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">Error loading history</p>
            <button
              onClick={() => refetchHistory()}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Try again
            </button>
          </div>
        ) : !historyData?.items?.length ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">No transaction history yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Crosschain transactions initiated from your external wallet will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyData?.items?.map((transfer, index) => {
              const isIncoming = transfer.direction === 'DEPOSIT';
              const timestamp = new Date(transfer.timestamp * 1000);
              const tokenInfo = getTokenInfo(transfer.sourceToken);
              const amount = parseFloat(transfer.amount) / Math.pow(10, tokenInfo?.decimals ?? 18);
              const sourceChainName = getChainName(transfer.sourceChainId);
              const destChainName = transfer.direction === 'DEPOSIT' ? getChainName(transfer.destinationChainId) : getChainName(transfer.destinationChainId);

              return (
                <div
                  key={`${transfer.dispatchMessage.transactionHash}-${index}`}
                  className="border border-gray-600 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isIncoming ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-medium">
                        {isIncoming ? 'Deposit' : 'Withdrawal'}
                      </span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {sourceChainName} → {destChainName}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(amount, { decimals: 4 })} {tokenInfo?.symbol ?? 'Unknown'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>From:</span>
                      <span className="font-mono">
                        {transfer.sender.slice(0, 8)}...{transfer.sender.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>To:</span>
                      <span className="font-mono">
                        {transfer.recipient.slice(0, 8)}...{transfer.recipient.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>
                        {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source Tx Hash:</span>
                      <a
                        href={getExplorerUrl(transfer.dispatchMessage.chainId, transfer.dispatchMessage.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        title="View source transaction on explorer"
                      >
                        {transfer.dispatchMessage.transactionHash.slice(0, 8)}...{transfer.dispatchMessage.transactionHash.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span>Message ID:</span>
                      <a
                        href={`https://hyperlane-explorer.gtxdex.xyz/message/${transfer.dispatchMessage.messageId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                        title="View message on Hyperlane explorer"
                      >
                        {transfer.dispatchMessage.messageId.slice(0, 8)}...{transfer.dispatchMessage.messageId.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Show destination chain status */}
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">
                      Destination Chain:
                    </div>
                    {(() => {
                      const processMessage = transfer.processMessage;

                      if (processMessage) {
                        return (
                          <div className="text-xs text-gray-400 flex justify-between items-center">
                            <span>{getChainName(processMessage.chainId)}:</span>
                            <a
                              href={getExplorerUrl(processMessage.chainId, processMessage.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              title="View destination transaction on explorer"
                            >
                              {processMessage.transactionHash.slice(0, 8)}...{processMessage.transactionHash.slice(-6)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-gray-400 flex justify-between items-center">
                            <span>Rari:</span>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-yellow-400">Processing...</span>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};