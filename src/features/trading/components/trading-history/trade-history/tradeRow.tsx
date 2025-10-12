import { ExternalLink } from 'lucide-react';
import { formatUnits } from 'viem';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { formatDate } from '@/helper';
import { EXPLORER_URL } from '@/constants/explorer-url';
import { TradeRowProps } from '@/features/trading/types/trading-history';
import { formatTransactionId } from '@/features/trading/utils/trading-history/trade-history-helper';

const TradeRow = ({
  trade,
  selectedPool,
  baseDecimals,
  quoteDecimals,
  chainId,
  defaultChainId,
}: TradeRowProps) => {
  const isBuy = trade.order.side === 'Buy';
  const pair = selectedPool?.coin;
  const price = formatUnits(BigInt(trade.order.price), quoteDecimals);
  const quantity = formatUnits(BigInt(trade.order.quantity), baseDecimals);
  const explorerUrl = EXPLORER_URL(chainId ?? defaultChainId);

  return (
    <div className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40">
      {/* Timestamp */}
      <div className="text-gray-200">{formatDate(trade.timestamp.toString())}</div>

      {/* Pair */}
      <div className="text-gray-200">{pair}</div>

      {/* Price */}
      <div className="font-medium text-white">${formatPrice(price)}</div>

      {/* Side */}
      <div className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>
        {isBuy ? 'Buy' : 'Sell'}
      </div>

      {/* Amount */}
      <div className="font-medium text-white">{formatQuantity(quantity)}</div>

      {/* Transaction Link */}
      <div className="truncate text-blue-400 transition-colors hover:text-blue-300">
        <a
          href={`${explorerUrl}${trade.transactionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {formatTransactionId(trade.transactionId)}
          <ExternalLink className="inline h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default TradeRow;
