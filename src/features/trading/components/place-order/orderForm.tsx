import React from 'react';
import GTXSlider from '@/_components/slider';

interface OrderFormProps {
  orderType: 'limit' | 'market';
  side: number;
  price: string;
  quantity: string;
  total: string;
  balance: string;
  selectedPool: any;
  onPriceChange: (price: string) => void;
  onQuantityChange: (quantity: string) => void;
  OrderSideEnum: any;
}

const OrderForm: React.FC<OrderFormProps> = ({
  orderType,
  side,
  price,
  quantity,
  total,
  balance,
  selectedPool,
  onPriceChange,
  onQuantityChange,
  OrderSideEnum,
}) => {
  return (
    <>
      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          appearance: textfield;
        }
      `}</style>

      {/* Price - Only for Limit Orders */}
      {orderType === 'limit' && (
        <div className="space-y-1">
          <label className="text-sm text-white flex items-center gap-1.5 ml-1">
            <span>Price</span>
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-black text-white text-sm rounded-lg py-2 px-3 pr-16 border border-white/20 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              value={price}
              onChange={e => onPriceChange(e.target.value)}
              placeholder="Enter price"
              // step={`0.${'0'.repeat(Number(selectedPool?.quoteDecimals) - 1)}1`}
              min="0"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {selectedPool?.coin.split('/')[1] || 'USDC'}
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-1">
        <label className="text-sm text-white flex items-center justify-between ml-1">
          <span>Quantity</span>
        </label>
        <div className="relative">
          <input
            type="number"
            className="w-full bg-black text-white text-sm rounded-lg py-2 px-3 pr-16 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            placeholder="0.00"
            value={quantity}
            onChange={e => onQuantityChange(e.target.value)}
            // step={
            //   side === OrderSideEnum.BUY && orderType === 'market'
            //     ? '0.000001'
            //     : '0.000000000000000001'
            // }
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
            {side === OrderSideEnum.BUY
              ? orderType === 'market'
                ? 'USDC'
                : selectedPool?.coin.split('/')[0]
              : selectedPool?.coin.split('/')[0]}
          </div>
        </div>
        <GTXSlider quantity={balance || '0'} setQuantity={onQuantityChange} />
      </div>

      {/* Total / Minimum Received */}
      <div className="space-y-1">
        <label className="text-sm text-white flex items-center justify-between ml-1">
          <span>
            {orderType === 'limit'
              ? 'Order Value'
              : side === OrderSideEnum.BUY
              ? 'Minimum Received'
              : 'Minimum Proceeds'}
          </span>
        </label>
        <div className="relative bg-black rounded-lg py-2 px-3 pr-16 border border-white/20">
          <div className="text-white text-sm">{total}</div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
            {orderType === 'limit'
              ? 'USDC'
              : side === OrderSideEnum.BUY
              ? selectedPool?.coin.split('/')[0]
              : 'USDC'}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderForm;
