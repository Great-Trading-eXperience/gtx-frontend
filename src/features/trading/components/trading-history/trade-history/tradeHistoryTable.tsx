import { BookOpen } from 'lucide-react';
import { TradeItem } from '@/graphql/gtx/clob';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import TableHeader from './tableHeader';
import TradeRow from './tradeRow';
import { SortConfigTrade } from '@/features/trading/types/trading-history';

interface TradeTableProps {
  trades: TradeItem[];
  sortConfig: SortConfigTrade;
  onSort: (key: SortConfigTrade['key']) => void;
  selectedPool?: ProcessedPoolItem;
  baseDecimals: number;
  quoteDecimals: number;
  chainId?: number;
  defaultChainId: number;
}

const TradeTable = ({
  trades,
  sortConfig,
  onSort,
  selectedPool,
  baseDecimals,
  quoteDecimals,
  chainId,
  defaultChainId,
}: TradeTableProps) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
      <TableHeader sortConfig={sortConfig} onSort={onSort} />

      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
        {trades.length > 0 ? (
          trades.map(trade => (
            <TradeRow
              key={`${trade.id}-${trade.timestamp}`}
              trade={trade}
              selectedPool={selectedPool}
              baseDecimals={baseDecimals}
              quoteDecimals={quoteDecimals}
              chainId={chainId}
              defaultChainId={defaultChainId}
            />
          ))
        ) : (
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <BookOpen className="h-8 w-8 text-gray-400" />
              <p className="text-gray-200">No trades found for this pool</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeTable;
