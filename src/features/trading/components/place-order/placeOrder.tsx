'use client';

import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { getCoreChain, isFeatureEnabled } from '@/constants/features/features-config';
import type { HexAddress } from '@/types/general/address';
import type { ProcessedPoolItem } from '@/types/gtx/clob';
import type { DepthData, Ticker24hrData } from '@/lib/market-api';

import { useWalletSelection } from '../../hooks/place-order/useWalletSelection';
import { useTradingBalance } from '../../hooks/place-order/useTradingBalance';
import { useOrderForm } from '../../hooks/place-order/useOrderFrom';
import { useSlippageCalculation } from '../../hooks/place-order/useSlippageCalculation';
import { useOrderSubmission } from '../../hooks/place-order/useOrderSubmission';
import { useFeePercentages } from '@/hooks/web3/gtx/clob-dex/balance-manager/useFeePercentages';
import { usePlaceOrder as usePrivyPlaceOrder } from '@/hooks/web3/gtx/clob-dex/gtx-router/usePrivyPlaceOrder';

import OrderTypeSelector from './orderTypeSelector';
import BuySellToggle from './buySellToggle';
import OrderForm from './orderForm';
import OrderSummary from './orderSummary';
import SlippageSettings from './slippageSetting';
import PlaceOrderSkeleton from './placeOrderSkeleton';
import { Wallet } from 'lucide-react';

import { OrderValidationService } from '../../services/place-order/orderValidation';

export interface PlaceOrderProps {
  address?: HexAddress;
  chainId?: number;
  defaultChainId: number;
  selectedPool?: ProcessedPoolItem;
  depthData?: DepthData | null;
  ticker24hr?: Ticker24hrData | null;
  refetchAccount: () => void;
  isLoading?: boolean;
  walletPreference?: 'external' | 'embedded';
}

const PlaceOrder = ({
  address,
  chainId,
  defaultChainId,
  selectedPool,
  depthData,
  ticker24hr,
  refetchAccount,
  isLoading = false,
  walletPreference = 'embedded',
}: PlaceOrderProps) => {
  const wallet = useWalletSelection({
    privyAddress: address,
    chainId,
    defaultChainId,
    walletPreference,
  });

  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  const balanceManagerChainId = crosschainEnabled ? getCoreChain() : wallet.chainId;

  const balanceManagerAddress = useMemo(
    () =>
      getContractAddress(
        balanceManagerChainId,
        ContractName.clobBalanceManager
      ) as HexAddress,
    [balanceManagerChainId]
  );

  const pool = useMemo(() => {
    if (!selectedPool) return undefined;
    return {
      baseCurrency: selectedPool.baseTokenAddress as HexAddress,
      quoteCurrency: selectedPool.quoteTokenAddress as HexAddress,
      orderBook: selectedPool.orderBook as HexAddress,
    };
  }, [selectedPool]);

  const bestBidPrice = useMemo(() => {
    return depthData?.bids?.find(bid => bid[0] !== '0')?.[0];
  }, [depthData]);

  const bestAskPrice = useMemo(() => {
    return depthData?.asks?.find(ask => ask[0] !== '0')?.[0];
  }, [depthData]);

  const orderForm = useOrderForm({
    selectedPool,
    bestBidPrice,
    bestAskPrice,
    lastPrice: ticker24hr?.lastPrice,
    slippageInfo: null, // Will be set by slippage calculation hook
  });

  const relevantCurrency = useMemo(() => {
    if (!selectedPool) return undefined;
    return orderForm.side === orderForm.OrderSideEnum.BUY
      ? (selectedPool.quoteTokenAddress as HexAddress)
      : (selectedPool.baseTokenAddress as HexAddress);
  }, [selectedPool, orderForm.side, orderForm.OrderSideEnum.BUY]);

  const relevantDecimals = useMemo(() => {
    if (!selectedPool) return 18;
    return orderForm.side === orderForm.OrderSideEnum.BUY
      ? selectedPool.quoteDecimals
      : selectedPool.baseDecimals;
  }, [selectedPool, orderForm.side, orderForm.OrderSideEnum.BUY]);

  const balance = useTradingBalance({
    address: address as HexAddress, // Always use Privy embedded wallet for balance
    tokenAddress: relevantCurrency,
    chainId: wallet.chainId,
    decimals: relevantDecimals || 18,
    enabled: wallet.isConnected && !!relevantCurrency,
  });

  const placeOrderHook = usePrivyPlaceOrder(wallet.address);

  const {
    handlePlaceLimitOrder: originalHandlePlaceLimitOrder,
    handlePlaceMarketOrder: originalHandlePlaceMarketOrder,
    getMarketOrderSlippageInfo,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    limitSimulateError,
    marketSimulateError,
    limitOrderHash,
    marketOrderHash,
    resetLimitOrderState,
    resetMarketOrderState,
  } = placeOrderHook;

  const slippageCalc = useSlippageCalculation({
    orderType: orderForm.orderType,
    quantity: orderForm.quantity,
    side: orderForm.side,
    slippageValue: orderForm.slippageValue,
    selectedPool,
    pool,
    getMarketOrderSlippageInfo,
    enabled: orderForm.orderType === 'market' && !!orderForm.quantity,
  });

  // Update order form with slippage info
  useMemo(() => {
    // This will trigger recalculation of total in useOrderForm
    return slippageCalc.slippageInfo;
  }, [slippageCalc.slippageInfo]);

  const { takerFeePercent, makerFeePercent } = useFeePercentages(balanceManagerAddress);

  const handlePlaceLimitOrder = useCallback(
    (pool: any, price: bigint, quantity: bigint, side: number): Promise<void> => {
      return originalHandlePlaceLimitOrder(pool, price, quantity, side).then(() => {
        return undefined;
      });
    },
    [originalHandlePlaceLimitOrder]
  );

  const handlePlaceMarketOrder = useCallback(
    (pool: any, quantity: bigint, side: number, slippageBps: number): Promise<void> => {
      return originalHandlePlaceMarketOrder(pool, quantity, side, slippageBps).then(() => {
        return undefined;
      });
    },
    [originalHandlePlaceMarketOrder]
  );

  const orderSubmission = useOrderSubmission({
    handlePlaceLimitOrder,
    handlePlaceMarketOrder,
    selectedPool,
    pool,
    onSuccess: () => {
      toast.success('Order placed successfully');
      orderForm.resetForm();
      setTimeout(() => {
        balance.refresh();
        refetchAccount();
      }, 2000);
    },
    onError: error => {
      toast.error(error.message || 'Failed to place order');
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!wallet.address || !wallet.isConnected) {
        toast.error('Please connect your wallet');
        return;
      }

      // Validate form
      const validation = orderForm.validate();
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Validate balance
      const balanceValidation = OrderValidationService.validateQuantity(
        orderForm.quantity,
        balance.balance || ''
      );
      if (!balanceValidation.valid) {
        toast.error(balanceValidation.error);
        return;
      }

      // Submit order
      try {
        await orderSubmission.submitOrder(
          orderForm.orderType,
          orderForm.side,
          orderForm.price,
          orderForm.quantity,
          orderForm.slippageValue
        );
      } catch (error) {
        console.error('Order submission failed:', error);
      }
    },
    [wallet.address, wallet.isConnected, orderForm, balance.balance, orderSubmission]
  );

  // ============================================
  if (!wallet.address || isLoading) {
    return <PlaceOrderSkeleton />;
  }

  if (!selectedPool) {
    return <PlaceOrderSkeleton />;
  }

  const isPending = isLimitOrderPending || isMarketOrderPending;
  const isConfirming = isLimitOrderConfirming || isMarketOrderConfirming;
  const isConfirmed = isLimitOrderConfirmed || isMarketOrderConfirmed;

  return (
    <div className="bg-black rounded-lg mx-auto border border-white/20 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-3 p-2">
        {/* Order Type & Side Selection */}
        <div className="grid gap-3">
          <OrderTypeSelector
            orderType={orderForm.orderType}
            onOrderTypeChange={orderForm.setOrderType}
          />

          <BuySellToggle
            side={orderForm.side}
            onSideChange={orderForm.setSide}
            OrderSideEnum={orderForm.OrderSideEnum}
          />
        </div>

        {/* Order Form Inputs */}
        <OrderForm
          orderType={orderForm.orderType}
          side={orderForm.side}
          price={orderForm.price}
          quantity={orderForm.quantity}
          total={orderForm.total}
          balance={balance.balance || ''}
          balanceIsLoading={balance.isLoading}
          selectedPool={selectedPool}
          slippageInfo={slippageCalc.slippageInfo}
          isCalculatingSlippage={slippageCalc.isCalculating}
          onPriceChange={orderForm.setPrice}
          onQuantityChange={orderForm.setQuantity}
          OrderSideEnum={orderForm.OrderSideEnum}
        />

        {/* Order Summary */}
        <OrderSummary
          orderType={orderForm.orderType}
          side={orderForm.side}
          total={orderForm.total}
          slippageInfo={slippageCalc.slippageInfo}
          calculatingSlippage={slippageCalc.isCalculating}
          takerFeePercent={takerFeePercent}
          makerFeePercent={makerFeePercent}
          selectedPool={selectedPool}
          OrderSideEnum={orderForm.OrderSideEnum}
        />

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            orderForm.side === orderForm.OrderSideEnum.BUY
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-rose-500 hover:bg-rose-400 text-white'
          } ${
            isPending || isConfirming || !wallet.isConnected
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          disabled={isPending || isConfirming || !wallet.isConnected}
        >
          {isPending
            ? 'Processing...'
            : isConfirming
            ? 'Confirming...'
            : isConfirmed
            ? 'Order Placed!'
            : `${orderForm.side === orderForm.OrderSideEnum.BUY ? 'Buy' : 'Sell'} ${
                selectedPool.coin.split('/')[0]
              }`}
        </button>
      </form>

      {/* Fees Info */}
      <div className="w-full border-t-2 border-gray-600 mt-3" />
      <div className="flex flex-col w-full gap-3 text-xs text-gray-400 mt-3 px-2">
        <div className="flex flex-row justify-between">
          <span>Fees</span>
          <div className="flex flex-row gap-1 text-gray-200 font-medium">
            <span>{takerFeePercent.toFixed(2)}%</span>
            <span>/</span>
            <span>{makerFeePercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Slippage Settings Modal */}
      <SlippageSettings
        isOpen={false} // Control with state
        onClose={() => {}}
        slippageValue={orderForm.slippageValue}
        autoSlippage={orderForm.autoSlippage}
        onSlippageChange={orderForm.setSlippageValue}
        onAutoSlippageChange={orderForm.setAutoSlippage}
      />

      {/* Wallet Connection Notice */}
      {!wallet.isConnected && (
        <div className="mt-3 p-2 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Please connect wallet to trade</span>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
