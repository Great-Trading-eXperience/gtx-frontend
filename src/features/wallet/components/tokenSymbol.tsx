import { Bitcoin, DollarSign, Zap, LucideIcon } from 'lucide-react';

interface TokenSymbolProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const TOKEN_CONFIG: Record<string, { icon: LucideIcon; bgColor: string }> = {
  gsUSDC: { icon: DollarSign, bgColor: 'bg-blue-500' },
  gsWETH: { icon: Zap, bgColor: 'bg-purple-500' },
  gsWBTC: { icon: Bitcoin, bgColor: 'bg-orange-500' },
};

const SIZE_CLASSES = {
  sm: { container: 'w-6 h-6', icon: 'w-4 h-4' },
  md: { container: 'w-8 h-8', icon: 'w-5 h-5' },
  lg: { container: 'w-10 h-10', icon: 'w-6 h-6' },
};

export const TokenSymbol = ({ symbol, size = 'md' }: TokenSymbolProps) => {
  const config = TOKEN_CONFIG[symbol] || { icon: DollarSign, bgColor: 'bg-gray-400' };
  const { icon: Icon, bgColor } = config;
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full ${sizeClasses.container} ${bgColor}`}
    >
      <Icon className={`${sizeClasses.icon} text-white`} />
    </div>
  );
};
