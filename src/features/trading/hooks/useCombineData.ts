import { useMemo } from 'react';
import { TradeItem } from '@/graphql/gtx/clob'
import { DepthData, OrderData } from '@/lib/market-api';

export const useCombinedTrades = (
  apiTrades: TradeItem[] = [],
  wsTrades: TradeItem[] = []
) => {
  return useMemo(() => {
    const combined = [...apiTrades];

    wsTrades.forEach(wsTrade => {
      if (!combined.some(apiTrade => apiTrade.id === wsTrade.id)) {
        combined.unshift(wsTrade);
      }
    });

    const uniqueTradesMap = new Map();
    combined.forEach(trade => {
      if (!uniqueTradesMap.has(trade.id)) {
        uniqueTradesMap.set(trade.id, trade);
      }
    });

    return Array.from(uniqueTradesMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  }, [apiTrades, wsTrades]);
};

export const useCombinedDepth = (
  apiDepth: DepthData | null | undefined,
  wsDepthUpdates: any
) => {
  return useMemo(() => {
    if (!apiDepth) return null;
    if (!wsDepthUpdates) return apiDepth;

    const updatedDepth = { ...apiDepth };

    // Apply WebSocket depth updates
    if (wsDepthUpdates.b && wsDepthUpdates.b.length > 0) {
      const updatedBids = [...updatedDepth.bids];

      wsDepthUpdates.b.forEach(([price, quantity]: [string, string]) => {
        const index = updatedBids.findIndex(bid => bid[0] === price);
        if (parseFloat(quantity) === 0) {
          if (index !== -1) updatedBids.splice(index, 1);
        } else if (index !== -1) {
          updatedBids[index] = [price, quantity];
        } else {
          updatedBids.push([price, quantity]);
        }
      });

      updatedBids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
      updatedDepth.bids = updatedBids;
    }

    if (wsDepthUpdates.a && wsDepthUpdates.a.length > 0) {
      const updatedAsks = [...updatedDepth.asks];

      wsDepthUpdates.a.forEach(([price, quantity]: [string, string]) => {
        const index = updatedAsks.findIndex(ask => ask[0] === price);
        if (parseFloat(quantity) === 0) {
          if (index !== -1) updatedAsks.splice(index, 1);
        } else if (index !== -1) {
          updatedAsks[index] = [price, quantity];
        } else {
          updatedAsks.push([price, quantity]);
        }
      });

      updatedAsks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
      updatedDepth.asks = updatedAsks;
    }

    return updatedDepth;
  }, [apiDepth, wsDepthUpdates]);
};

export const useCombinedOrders = (
  apiOrders: OrderData[] = [],
  wsOrders: OrderData[] = [],
  chainId: number
) => {
  return useMemo(() => {
    const orderMap = new Map();
    apiOrders.forEach(order => {
      orderMap.set(order.orderId, true);
    });

    const wsOrdersToAdd = wsOrders.filter(wsOrder => !orderMap.has(wsOrder.orderId));

    return [...apiOrders, ...wsOrdersToAdd].map(order => ({
      id: order.orderId,
      chainId: Number(chainId),
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
      expiry: 0,
    }));
  }, [apiOrders, wsOrders, chainId]);
};
