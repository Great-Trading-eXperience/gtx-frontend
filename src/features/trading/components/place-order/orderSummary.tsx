import React from 'react';

interface OrderSummaryProps {
  orderType: 'limit' | 'market';
  side: number;
  total: string;
  slippageInfo: any;
  calculatingSlippage: boolean;
  takerFeePercent: number;
  makerFeePercent: number;
  selectedPool: any;
  OrderSideEnum: any;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderType,
  side,
  total,
  slippageInfo,
  calculatingSlippage,
  takerFeePercent,
  makerFeePercent,
  selectedPool,
  OrderSideEnum,
}) => {
  return (
    <>
      {/* Slippage Info for Market Orders */}
      {orderType === 'market' && (
        <div className="bg-black">
          {slippageInfo ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage:</span>
                <span
                  className={`font-medium ${
                    slippageInfo.actualSlippage > slippageInfo.slippageTolerance
                      ? 'text-red-400'
                      : slippageInfo.actualSlippage > 1.0
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {slippageInfo.actualSlippage.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : calculatingSlippage ? (
            <div className="text-xs text-gray-400">Calculating slippage...</div>
          ) : (
            <div className="text-xs text-gray-400">Enter amount to see slippage info</div>
          )}
        </div>
      )}
    </>
  );
};

export default OrderSummary;
