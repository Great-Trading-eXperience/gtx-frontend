import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract, useAccount } from 'wagmi';
import OrderBookABI from '@/abis/gtx/clob-dex/OrderBookABI';
import { HexAddress } from '@/types/web3/general/address';

// Define types
type Side = 0 | 1; // 0 = BUY, 1 = SELL
type Status = 0 | 1 | 2 | 3; // Assuming: 0 = OPEN, 1 = FILLED, 2 = CANCELLED, 3 = EXPIRED
type OrderParams = {
  price: bigint;   // Price as uint64
  quantity: bigint; // Quantity as uint128
  side: Side;
  orderBookAddress: HexAddress;
};

type MarketOrderParams = {
  quantity: bigint; // Quantity as uint128
  side: Side;
  orderBookAddress: HexAddress;
};

/**
 * Custom hook for placing limit and market orders on the OrderBook contract
 */
export const usePlaceOrder = () => {
  // Get user account
  const { address } = useAccount();
  
  // State for order parameters
  const [orderParams, setOrderParams] = useState<OrderParams>();
  const [marketOrderParams, setMarketOrderParams] = useState<MarketOrderParams>();
  
  // Limit order simulation
  const {
    data: simulateLimitData,
    isError: isLimitSimulationError,
    isLoading: isLimitSimulationLoading,
    refetch: refetchLimitSimulation,
    error: limitSimulateError,
  } = useSimulateContract({
    address: orderParams?.orderBookAddress,
    abi: OrderBookABI,
    functionName: 'placeOrder',
    args: orderParams && address ? [
      orderParams.price,
      orderParams.quantity,
      orderParams.side,
      address,
    ] : undefined,
  });

  // Market order simulation
  const {
    data: simulateMarketData,
    isError: isMarketSimulationError,
    isLoading: isMarketSimulationLoading,
    refetch: refetchMarketSimulation,
    error: marketSimulateError,
  } = useSimulateContract({
    address: marketOrderParams?.orderBookAddress,
    abi: OrderBookABI,
    functionName: 'placeMarketOrder',
    args: marketOrderParams && address ? [
      marketOrderParams.quantity,
      marketOrderParams.side,
      address,
    ] : undefined,
  });

  // Limit order transaction hooks
  const {
    data: limitOrderHash,
    isPending: isLimitOrderPending,
    writeContract: writeLimitOrder
  } = useWriteContract();

  // Market order transaction hooks
  const {
    data: marketOrderHash,
    isPending: isMarketOrderPending,
    writeContract: writeMarketOrder
  } = useWriteContract();

  // Transaction receipt hooks
  const {
    isLoading: isLimitOrderConfirming,
    isSuccess: isLimitOrderConfirmed
  } = useWaitForTransactionReceipt({
    hash: limitOrderHash,
  });

  const {
    isLoading: isMarketOrderConfirming,
    isSuccess: isMarketOrderConfirmed
  } = useWaitForTransactionReceipt({
    hash: marketOrderHash,
  });

  // Handler for placing limit orders
  const handlePlaceLimitOrder = async (
    orderBookAddress: HexAddress,
    price: bigint,
    quantity: bigint,
    side: Side
  ) => {
    try {
      console.log('============ Limit Order Parameters ============');
      console.log('Contract Details:');
      console.log(`Address: ${orderBookAddress}`);
      console.log(`Function: placeOrder`);
      console.log('\nArguments:');
      console.log(`Price: ${price}`);
      console.log(`Quantity: ${quantity}`);
      console.log(`Side: ${side === 0 ? 'BUY' : 'SELL'}`);
      console.log(`User: ${address}`);
      console.log('===============================================');

      setOrderParams({
        orderBookAddress,
        price,
        quantity,
        side
      });
    } catch (error) {
      console.error('Error preparing limit order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place limit order. Please try again.');
    }
  };

  // Handler for placing market orders
  const handlePlaceMarketOrder = async (
    orderBookAddress: HexAddress,
    quantity: bigint,
    side: Side
  ) => {
    try {
      console.log('============ Market Order Parameters ============');
      console.log('Contract Details:');
      console.log(`Address: ${orderBookAddress}`);
      console.log(`Function: placeMarketOrder`);
      console.log('\nArguments:');
      console.log(`Quantity: ${quantity}`);
      console.log(`Side: ${side === 0 ? 'BUY' : 'SELL'}`);
      console.log(`User: ${address}`);
      console.log('===============================================');

      setMarketOrderParams({
        orderBookAddress,
        quantity,
        side
      });
    } catch (error) {
      console.error('Error preparing market order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place market order. Please try again.');
    }
  };

  // Effect for limit order simulation
  useEffect(() => {
    if (!orderParams || isLimitSimulationLoading) {
      return;
    }
    console.log("Triggering limit order simulation with params:", orderParams);
    refetchLimitSimulation();
  }, [orderParams, isLimitSimulationLoading, refetchLimitSimulation]);

  // Effect for market order simulation
  useEffect(() => {
    if (!marketOrderParams || isMarketSimulationLoading) {
      return;
    }
    console.log("Triggering market order simulation with params:", marketOrderParams);
    refetchMarketSimulation();
  }, [marketOrderParams, isMarketSimulationLoading, refetchMarketSimulation]);

  // Effect for executing limit order after successful simulation
  useEffect(() => {
    if (!simulateLimitData || !orderParams) {
      return;
    }
    
    console.log('Limit order simulation successful:', simulateLimitData);
    
    try {
      toast.info(`Placing ${orderParams.side === 0 ? 'buy' : 'sell'} limit order...`);
      writeLimitOrder(simulateLimitData.request);
      // Don't clear orderParams here - wait for the hash
    } catch (error) {
      console.error('Error executing limit order:', error);
      toast.error('Failed to execute limit order transaction');
      setOrderParams(undefined);
    }
  }, [simulateLimitData, orderParams, writeLimitOrder]);

  // Effect for executing market order after successful simulation
  useEffect(() => {
    if (!simulateMarketData || !marketOrderParams) {
      return;
    }
    
    console.log('Market order simulation successful:', simulateMarketData);
    
    try {
      toast.info(`Placing ${marketOrderParams.side === 0 ? 'buy' : 'sell'} market order...`);
      writeMarketOrder(simulateMarketData.request);
      // Don't clear marketOrderParams here - wait for the hash
    } catch (error) {
      console.error('Error executing market order:', error);
      toast.error('Failed to execute market order transaction');
      setMarketOrderParams(undefined);
    }
  }, [simulateMarketData, marketOrderParams, writeMarketOrder]);

  // Clear parameters after transaction hash is received
  useEffect(() => {
    if (limitOrderHash) {
      console.log("Limit order transaction submitted with hash:", limitOrderHash);
      setOrderParams(undefined);
    }
  }, [limitOrderHash]);

  useEffect(() => {
    if (marketOrderHash) {
      console.log("Market order transaction submitted with hash:", marketOrderHash);
      setMarketOrderParams(undefined);
    }
  }, [marketOrderHash]);

  // Effect for success messages
  useEffect(() => {
    if (isLimitOrderConfirmed) {
      console.log("Limit order confirmed!");
      toast.success('Limit order has been placed successfully');
    }
  }, [isLimitOrderConfirmed]);

  useEffect(() => {
    if (isMarketOrderConfirmed) {
      console.log("Market order confirmed!");
      toast.success('Market order has been placed successfully');
    }
  }, [isMarketOrderConfirmed]);

  // Effect for simulation errors
  useEffect(() => {
    if (limitSimulateError && isLimitSimulationError && !isLimitSimulationLoading) {
      console.error("Limit order simulation error:", limitSimulateError);
      toast.error(`Limit order simulation failed: ${limitSimulateError.toString()}`);
      setOrderParams(undefined);
    }
  }, [limitSimulateError, isLimitSimulationError, isLimitSimulationLoading]);

  useEffect(() => {
    if (marketSimulateError && isMarketSimulationError && !isMarketSimulationLoading) {
      console.error("Market order simulation error:", marketSimulateError);
      toast.error(`Market order simulation failed: ${marketSimulateError.toString()}`);
      setMarketOrderParams(undefined);
    }
  }, [marketSimulateError, isMarketSimulationError, isMarketSimulationLoading]);

  return {
    // Limit order functions and states
    handlePlaceLimitOrder,
    isLimitOrderPending,
    isLimitOrderConfirming,
    isLimitOrderConfirmed,
    isLimitSimulationError,
    isLimitSimulationLoading,
    limitOrderHash,
    limitSimulateError,

    // Market order functions and states
    handlePlaceMarketOrder,
    isMarketOrderPending,
    isMarketOrderConfirming,
    isMarketOrderConfirmed,
    isMarketSimulationError,
    isMarketSimulationLoading,
    marketOrderHash,
    marketSimulateError,
  };
};