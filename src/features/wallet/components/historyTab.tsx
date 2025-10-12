import { History, RefreshCw, ExternalLink } from 'lucide-react';
import { HistoryTabProps } from '../types/wallet.types';

export function HistoryTab({
  transactions,
  loading = false,
  onRefresh,
  getExplorerUrl,
}: HistoryTabProps) {
  const shortenHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <p className="text-xs text-gray-400">
            Transactions initiated by your external wallet
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh history"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading history...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No transaction history yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Transactions will appear here once you make a deposit or withdrawal
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="border border-gray-600 rounded-lg p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      tx.type === 'deposit' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-medium capitalize">{tx.type}</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {tx.sourceChain} → {tx.destChain}
                  </span>
                </div>
                <span className="font-medium">
                  {tx.amount} {tx.token}
                </span>
              </div>

              {/* Details */}
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>From:</span>
                  <span className="font-mono">{shortenHash(tx.from)}</span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-mono">{shortenHash(tx.to)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{formatDate(tx.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source Tx:</span>
                  <a
                    href={getExplorerUrl(0, tx.sourceTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {shortenHash(tx.sourceTxHash)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Destination Status */}
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-500 mb-1">Destination Chain:</div>
                <div className="text-xs text-gray-400 flex justify-between items-center">
                  <span>{tx.destChain}:</span>
                  {tx.status === 'completed' && tx.destTxHash ? (
                    <a
                      href={getExplorerUrl(0, tx.destTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {shortenHash(tx.destTxHash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-yellow-400" />
                      <span className="text-yellow-400">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
