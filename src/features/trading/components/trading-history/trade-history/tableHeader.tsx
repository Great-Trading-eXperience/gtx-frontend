import {
  SortableKeyTrades,
  TableHeaderProps,
} from '@/features/trading/types/trading-history';
import { ChevronDown, Clock } from 'lucide-react';

const TableHeader = ({ sortConfig, onSort }: TableHeaderProps) => {
  const SortButton = ({
    field,
    label,
    icon: Icon,
  }: {
    field: SortableKeyTrades;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    const isActive = sortConfig.key === field;
    const isAscending = isActive && sortConfig.direction === 'asc';

    return (
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isAscending ? 'rotate-180' : ''}`}
        />
      </button>
    );
  };

  const StaticHeader = ({ label }: { label: string }) => (
    <div className="text-sm font-medium text-gray-200">{label}</div>
  );

  return (
    <div className="grid grid-cols-6 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
      <SortButton field="timestamp" label="Time" icon={Clock} />
      <StaticHeader label="Pair" />
      <SortButton field="price" label="Price" />
      <StaticHeader label="Side" />
      <SortButton field="quantity" label="Amount" />
      <StaticHeader label="Transaction" />
    </div>
  );
};

export default TableHeader;
