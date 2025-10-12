import { SortableKeyOrder, SortConfigOrder } from '@/features/trading/types/trading-history';
import { ChevronDown, Clock } from 'lucide-react';

interface TableHeaderProps {
  sortConfig: SortConfigOrder;
  onSort: (key: SortableKeyOrder) => void;
}

export const TableHeader = ({ sortConfig, onSort }: TableHeaderProps) => {
  const SortButton = ({
    sortKey,
    children,
    icon,
  }: {
    sortKey: SortableKeyOrder;
    children: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
    >
      {icon}
      <span>{children}</span>
      <ChevronDown
        className={`h-4 w-4 transition-transform ${
          sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  return (
    <div className="grid grid-cols-7 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
      <SortButton sortKey="timestamp" icon={<Clock className="h-4 w-4" />}>
        Time
      </SortButton>
      <div className="text-sm font-medium text-gray-200">Pool</div>
      <SortButton sortKey="price">Price</SortButton>
      <div className="text-sm font-medium text-gray-200">Side</div>
      <SortButton sortKey="filled">Filled</SortButton>
      <div className="text-sm font-medium text-gray-200">Status</div>
      <div className="text-sm font-medium text-gray-200">Actions</div>
    </div>
  );
};
