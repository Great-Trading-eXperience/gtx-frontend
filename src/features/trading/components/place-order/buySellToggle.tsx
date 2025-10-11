import React from 'react';

enum OrderSideEnum {
  BUY = 0,
  SELL = 1,
}

interface BuySellToggleProps {
  side: OrderSideEnum;
  onSideChange: (side: OrderSideEnum) => void;
  OrderSideEnum: typeof OrderSideEnum;
}

const BuySellToggle: React.FC<BuySellToggleProps> = ({
  side,
  onSideChange,
  OrderSideEnum,
}) => {
  return (
    <div className="relative">
      <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-white/20 bg-black">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
            side === OrderSideEnum.BUY
              ? 'bg-emerald-600 text-white'
              : 'bg-transparent text-white hover:bg-white/10'
          }`}
          onClick={() => onSideChange(OrderSideEnum.BUY)}
        >
          <span>Buy</span>
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
            side === OrderSideEnum.SELL
              ? 'bg-rose-600 text-white'
              : 'bg-transparent text-white hover:bg-white/10'
          }`}
          onClick={() => onSideChange(OrderSideEnum.SELL)}
        >
          <span>Sell</span>
        </button>
      </div>
    </div>
  );
};

export default BuySellToggle;
