import { EmptyStateProps } from '@/features/trading/types/trading-history';

const EmptyState = ({ icon: Icon, message, variant = 'default' }: EmptyStateProps) => {
  const borderColor = variant === 'error' ? 'border-rose-800/30' : 'border-gray-800/30';
  const bgColor = variant === 'error' ? 'bg-rose-900/20' : 'bg-gray-900/20';
  const iconColor = variant === 'error' ? 'text-rose-500' : 'text-gray-400';
  const textColor = variant === 'error' ? 'text-rose-200' : 'text-gray-200';

  return (
    <div
      className={`flex min-h-[300px] items-center justify-center rounded-lg border ${borderColor} ${bgColor} p-8`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon className={`h-12 w-12 ${iconColor}`} />
        <p className={`text-lg ${textColor}`}>{message}</p>
      </div>
    </div>
  );
};

export default EmptyState;
