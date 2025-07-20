import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserWebSocket } from '@/hooks/use-user-websocket';
import {
  fetchAllOrders,
  fetchOpenOrders,
  fetchAccountData,
  fetchTrades,
  OrderData
} from '@/lib/market-api';
import { transformApiTradeToTradeItem } from '@/lib/transform-data';
import { HexAddress, ProcessedPoolItem, TradeItem } from '@/types/gtx/clob';
import { useChainId } from 'wagmi';

export const useUserData = (
  effectiveAddress: HexAddress | undefined,
  selectedPool: ProcessedPoolItem | undefined,
  effectiveIsConnected: boolean
) => {
  const [userTrades, setUserTrades] = useState<TradeItem[]>([]);
  const [wsOpenOrders, setWsOpenOrders] = useState<OrderData[]>([]);
  const [previousConnectionState, setPreviousConnectionState] = useState(effectiveIsConnected);

  const chainId = useChainId();

  const { lastMessage: userMessage } = useUserWebSocket(effectiveAddress, chainId);

  // React Query hooks for user data
  const {
    data: marketAllOrdersData,
    refetch: refetchAllOrders
  } = useQuery({
    queryKey: ['marketAllOrders', effectiveAddress, selectedPool?.baseSymbol, selectedPool?.quoteSymbol],
    queryFn: () => effectiveAddress ? fetchAllOrders(effectiveAddress) : [],
    enabled: !!effectiveAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const {
    data: marketOpenOrdersData,
    isLoading: marketOpenOrdersLoading,
    refetch: refetchOpenOrders
  } = useQuery({
    queryKey: ['marketOpenOrders', effectiveAddress, selectedPool?.baseSymbol, selectedPool?.quoteSymbol],
    queryFn: () => effectiveAddress ? fetchOpenOrders(effectiveAddress) : [],
    enabled: !!effectiveAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const {
    data: marketAccountData,
    isLoading: marketAccountLoading,
    error: marketAccountError,
    refetch: refetchAccount
  } = useQuery({
    queryKey: ['marketAccount', effectiveAddress],
    queryFn: () => effectiveAddress ? fetchAccountData(effectiveAddress) : null,
    enabled: !!effectiveAddress,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: 60000,
  });

  // Transform balances
  const transformedBalances = useMemo(() => {
    if (!marketAccountData) return [];

    return marketAccountData.balances.map(balance => ({
      id: balance.asset.toLowerCase(),
      currency: {
        address: '',
        name: balance.asset,
        symbol: balance.asset,
        decimals: 18
      },
      amount: balance.free,
      lockedAmount: balance.locked,
      user: ''
    }));
  }, [marketAccountData]);

  // Transform open orders
  const transformedOpenOrders = useMemo(() => {
    const apiOrders = marketOpenOrdersData || [];
    const orderMap = new Map(apiOrders.map(order => [order.orderId, true]));
    const wsOrdersToAdd = wsOpenOrders.filter(wsOrder => !orderMap.has(wsOrder.orderId));

    return [...apiOrders, ...wsOrdersToAdd].map(order => ({
      id: order.orderId,
      chainId: 1, // You might want to pass this as a parameter
      poolId: order.symbol || '',
      orderId: BigInt(order.orderId),
      price: order.price,
      quantity: order.origQty,
      side: order.side,
      status: order.status,
      timestamp: Number(order.time || 0),
      transactionId: order.orderId,
      type: order.type || '',
      filled: order.executedQty || '0',
      expiry: 0
    }));
  }, [marketOpenOrdersData, wsOpenOrders]);

  // Fetch user trades
  const fetchUserTradesData = useCallback(async () => {
    if (!selectedPool || !effectiveAddress) return;

    try {
      const userData = await fetchTrades(selectedPool.coin, 500, effectiveAddress);
      if (userData) {
        const transformedUserData = transformApiTradeToTradeItem(
          userData,
          selectedPool.id,
          selectedPool.coin
        );

        const uniqueTradesMap = new Map();
        transformedUserData.forEach(trade => {
          uniqueTradesMap.set(trade.id, trade);
        });

        const uniqueUserTrades = Array.from(uniqueTradesMap.values())
          .sort((a, b) => b.timestamp - a.timestamp);

        setUserTrades(uniqueUserTrades);
      }
    } catch (error) {
      console.error('Error fetching user trades:', error);
    }
  }, [selectedPool, effectiveAddress]);

  // Handle WebSocket user messages (execution reports) - FOCUSED ON setUserTrades
  useEffect(() => {
    if (!userMessage || !selectedPool || !effectiveAddress) return;

    if (userMessage && userMessage.e === 'executionReport') {
      try {
        const execReport = userMessage as any;

        const orderId = execReport.i || '';
        const status = execReport.X || '';
        const symbol = execReport.s || '';

        // Update WebSocket open orders state
        const updatedOrder: OrderData = {
          id: orderId,
          orderId: orderId,
          symbol: symbol,
          clientOrderId: execReport.c || '',
          price: execReport.p || '0',
          origQty: execReport.q || '0',
          executedQty: execReport.z || '0',
          status: status,
          time: execReport.E || Date.now(),
          type: execReport.o || 'LIMIT',
          side: execReport.S || 'BUY',
          updateTime: execReport.E || Date.now(),
        };

        setWsOpenOrders(prevOrders => {
          if (['FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(status)) {
            return prevOrders.filter(order => order.orderId !== orderId);
          }

          const existingOrderIndex = prevOrders.findIndex(order => order.orderId === orderId);

          if (existingOrderIndex >= 0) {
            const updatedOrders = [...prevOrders];
            updatedOrders[existingOrderIndex] = updatedOrder;
            return updatedOrders;
          } else if (status === 'NEW' || status === 'PARTIALLY_FILLED') {
            return [updatedOrder, ...prevOrders];
          }

          return prevOrders;
        });

        // Handle trade-related statuses - MAIN FOCUS: setUserTrades logic
        if (['TRADE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(status)) {
          // Refetch trades data for comprehensive updates
          fetchUserTradesData();

          // Create new trade item for TRADE and PARTIALLY_FILLED statuses
          if (status === 'TRADE' || status === 'PARTIALLY_FILLED') {
            const newUserTrade: TradeItem = {
              id: execReport.t || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              orderId: orderId,
              poolId: selectedPool.id,
              pool: selectedPool.coin,
              price: execReport.p || '0',
              quantity: execReport.l || '0', // Last executed quantity
              timestamp: execReport.E || Date.now(),
              transactionId: execReport.t || '',
              order: {
                id: orderId,
                user: {
                  amount: '0',
                  currency: {
                    address: selectedPool.baseTokenAddress || '',
                    name: selectedPool.baseSymbol || '',
                    symbol: selectedPool.baseSymbol || '',
                    decimals: selectedPool.baseDecimals || 18
                  },
                  lockedAmount: '0',
                  symbol: selectedPool.baseSymbol || '',
                  user: effectiveAddress as `0x${string}`
                },
                price: execReport.p || '0',
                quantity: execReport.q || '0', // Original quantity
                side: execReport.S === 'BUY' ? 'Buy' : 'Sell',
                status: status,
                type: execReport.o || 'LIMIT',
                timestamp: execReport.E || Date.now(),
                poolId: selectedPool.id,
                orderId: orderId,
                expiry: 0,
                filled: execReport.l || '0',
                pool: {
                  coin: selectedPool.coin,
                  id: selectedPool.id,
                  lotSize: '0',
                  maxOrderAmount: '0',
                  orderBook: selectedPool.orderBook,
                  timestamp: selectedPool.timestamp,
                  baseCurrency: {
                    address: selectedPool.baseTokenAddress,
                    name: selectedPool.baseSymbol || '',
                    symbol: selectedPool.baseSymbol || '',
                    decimals: selectedPool.baseDecimals || 18
                  },
                  quoteCurrency: {
                    address: selectedPool.quoteTokenAddress,
                    name: selectedPool.quoteSymbol || '',
                    symbol: selectedPool.quoteSymbol || '',
                    decimals: selectedPool.quoteDecimals || 6
                  }
                }
              }
            };

            // Update userTrades state with the new trade - KEY LOGIC
            setUserTrades(prevUserTrades => {
              // Prevent duplicate trades by ID
              if (prevUserTrades.some(trade => trade.id === newUserTrade.id)) {
                return prevUserTrades;
              }

              // Prevent duplicate trades by orderId, price, and timestamp proximity
              if (prevUserTrades.some(trade =>
                trade.orderId === newUserTrade.orderId &&
                trade.price === newUserTrade.price &&
                Math.abs(trade.timestamp - newUserTrade.timestamp) < 1000
              )) {
                return prevUserTrades;
              }

              // Add new trade to the beginning of the array
              const updatedTrades = [newUserTrade, ...prevUserTrades];

              // Remove duplicates using Map (keeps latest occurrence)
              const uniqueTradesMap = new Map();
              updatedTrades.forEach(trade => {
                uniqueTradesMap.set(trade.id, trade);
              });

              // Return sorted and limited array
              return Array.from(uniqueTradesMap.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 50); // Limit to 50 trades for performance
            });
          }
        }
      } catch (error) {
        console.error('Error processing execution report:', error);
      }
    }
  }, [userMessage, selectedPool, effectiveAddress, fetchUserTradesData]);

  // Handle connection state changes
  useEffect(() => {
    if (effectiveIsConnected && !previousConnectionState && effectiveAddress) {
      refetchAllOrders();
      refetchOpenOrders();
      refetchAccount();
    }
    setPreviousConnectionState(effectiveIsConnected);
  }, [effectiveIsConnected, previousConnectionState, effectiveAddress]);

  // Fetch user trades when pool or address changes
  useEffect(() => {
    if (effectiveAddress) {
      fetchUserTradesData();
    }
  }, [fetchUserTradesData]);

  return {
    userTrades,
    transformedBalances,
    transformedOpenOrders,
    marketAccountLoading,
    marketAccountError,
    marketOpenOrdersLoading,
    refetchAccount,
    refetchOpenOrders,
    refetchAllOrders
  };
};