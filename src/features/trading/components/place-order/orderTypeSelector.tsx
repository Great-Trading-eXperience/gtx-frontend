import React from 'react';

interface OrderTypeSelectorProps {
  orderType: 'limit' | 'market';
  onOrderTypeChange: (type: 'limit' | 'market') => void;
}

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  orderType,
  onOrderTypeChange,
}) => {
  return (
    <div className="relative">
      <div className="flex w-full gap-6 bg-transparent">
        <button
          type="button"
          className={`group relative flex flex-1 items-center justify-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 ${
            orderType === 'market' ? 'text-white' : ''
          }`}
          onClick={() => onOrderTypeChange('market')}
        >
          <span>Market</span>
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full origin-left transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out ${
              orderType === 'market' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </button>

        <button
          type="button"
          className={`group relative flex flex-1 items-center justify-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:text-gray-200 ${
            orderType === 'limit' ? 'text-white' : ''
          }`}
          onClick={() => onOrderTypeChange('limit')}
        >
          <span>Limit</span>
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full origin-left transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out ${
              orderType === 'limit' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default OrderTypeSelector;
