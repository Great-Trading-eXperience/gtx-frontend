import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePlaceOrder, usePlaceMarketOrder } from '@/hooks/web3/gtx/clob-dex/order-book/useOrderBook'; // Adjust path as needed

// Side enum (buy = 0, sell = 1)
enum Side {
  Buy = 0,
  Sell = 1,
}

interface OrderPlacementProps {
  bestBidPrice?: number;
  bestAskPrice?: number;
  onOrderPlaced?: () => void;
}

const OrderPlacement: React.FC<OrderPlacementProps> = ({ 
  bestBidPrice = 0, 
  bestAskPrice = 0, 
  onOrderPlaced 
}) => {
  // Form state
  const [side, setSide] = useState<Side>(Side.Buy);
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  
  // User account
  const { address, isConnected } = useAccount();
  
  // Hooks
  const { placeOrder, isPlacingOrder: isPlacingLimitOrder } = usePlaceOrder({
    onSuccess: () => {
      resetForm();
      onOrderPlaced?.();
    },
  });
  
  const { placeMarketOrder, isPlacingOrder: isPlacingMarketOrder } = usePlaceMarketOrder({
    onSuccess: () => {
      resetForm();
      onOrderPlaced?.();
    },
  });

  // Reset form after order is placed
  const resetForm = () => {
    setPrice('');
    setQuantity('');
  };
  
  // Update price based on best bid/ask when side changes
  useEffect(() => {
    if (side === Side.Buy && bestBidPrice) {
      setPrice(bestBidPrice.toString());
    } else if (side === Side.Sell && bestAskPrice) {
      setPrice(bestAskPrice.toString());
    }
  }, [side, bestBidPrice, bestAskPrice]);

  // Format price with 2 decimal places
  const formatPrice = (value: string) => {
    if (!value) return '';
    return parseFloat(value).toFixed(2);
  };

  // Handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    try {
      if (orderType === 'limit') {
        if (!price || parseFloat(price) <= 0) {
          alert('Please enter a valid price');
          return;
        }
        
        await placeOrder({
          price: BigInt(Math.floor(parseFloat(price) * 100000000)), // Convert to uint64 with 8 decimals
          quantity: BigInt(Math.floor(parseFloat(quantity) * 1e18)), // Convert to uint128 with 18 decimals
          side: side,
          user: address
        });
      } else {
        await placeMarketOrder({
          quantity: BigInt(Math.floor(parseFloat(quantity) * 1e18)), // Convert to uint128 with 18 decimals
          side: side,
          user: address
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. See console for details.');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Place Order</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Order Type Selection */}
        <div className="mb-4">
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                orderType === 'limit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                orderType === 'market'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>
        </div>
        
        {/* Side Selection */}
        <div className="mb-4">
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                side === Side.Buy
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setSide(Side.Buy)}
            >
              Buy
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                side === Side.Sell
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setSide(Side.Sell)}
            >
              Sell
            </button>
          </div>
        </div>
        
        {/* Price Input (only for limit orders) */}
        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>
        )}
        
        {/* Quantity Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            step="0.01"
            min="0"
            required
          />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            side === Side.Buy
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } ${
            isPlacingLimitOrder || isPlacingMarketOrder
              ? 'opacity-70 cursor-not-allowed'
              : ''
          }`}
          disabled={isPlacingLimitOrder || isPlacingMarketOrder}
        >
          {isPlacingLimitOrder || isPlacingMarketOrder
            ? 'Processing...'
            : `${side === Side.Buy ? 'Buy' : 'Sell'} ${orderType === 'market' ? 'Market' : ''}`}
        </button>
      </form>
    </div>
  );
};

export default OrderPlacement;