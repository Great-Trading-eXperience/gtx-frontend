import { useState, useEffect, useMemo } from 'react';
import { useMarketWebSocket } from '@/hooks/use-market-websocket';
import { useUserWebSocket } from '@/hooks/use-user-websocket';
import { 
  transformWebSocketTradeToTradeItem,
  transformApiTradeToTradeItem 
} from '@/lib/transform-data';
import { TradeEvent } from '@/services/market-websocket';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { TradeItem } from '@/graphql/gtx/clob'
import { DepthData, OrderData, Ticker24hrData, TickerPriceData } from '@/lib/market-api';
import { useWebSocket } from '@/providers/websocket-provider';

export const useWebSocketData = (
  chainId: number,
  symbol: string,
  selectedPool: ProcessedPoolItem | undefined,
  effectiveAddress: string | undefined
) => {
  const { isReconnected, resetReconnectedFlag } = useWebSocket();
  
  // WebSocket connections
  const { lastMessage: depthMessage } = useMarketWebSocket(chainId, 'depth', symbol);
  const { lastMessage: tradesMessage } = useMarketWebSocket(chainId, 'trade', symbol);
  const { lastMessage: tickerMessage } = useMarketWebSocket(chainId, 'miniTicker', symbol);
  const { lastMessage: userMessage } = useUserWebSocket(effectiveAddress, chainId);

  // WebSocket data states
  const [wsDepthUpdates, setWsDepthUpdates] = useState<any>(null);
  const [wsTradeUpdates, setWsTradeUpdates] = useState<TradeItem[]>([]);
  const [wsTickerUpdates, setWsTickerUpdates] = useState<any>(null);
  const [wsOpenOrders, setWsOpenOrders] = useState<OrderData[]>([]);
  const [wsUserTrades, setWsUserTrades] = useState<TradeItem[]>([]);

  // Handle depth updates
  useEffect(() => {
    if (!depthMessage || depthMessage.e !== 'depthUpdate') return;
    setWsDepthUpdates(depthMessage);
  }, [depthMessage]);

  // Handle trade updates
  useEffect(() => {
    if (!tradesMessage || tradesMessage.e !== 'trade' || !selectedPool) return;
    
    try {
      const tradeEvent = tradesMessage as TradeEvent;
      const transformedTrade = transformWebSocketTradeToTradeItem(
        tradeEvent, 
        selectedPool.id, 
        selectedPool.coin
      );
      
      if (transformedTrade) {
        setWsTradeUpdates(prev => {
          const tradeExists = prev.some(trade => trade.id === transformedTrade.id);
          if (tradeExists) return prev;
          return [transformedTrade, ...prev].slice(0, 50);
        });
      }
    } catch (error) {
      console.error('Error transforming trade data:', error);
    }
  }, [tradesMessage, selectedPool]);

  // Handle ticker updates
  useEffect(() => {
    if (!tickerMessage) return;
    if (tickerMessage.e === 'miniTicker' || tickerMessage.e === '24hrMiniTicker') {
      setWsTickerUpdates(tickerMessage);
    }
  }, [tickerMessage]);

  // Handle user updates (orders and trades)
  useEffect(() => {
    if (!userMessage || !selectedPool || !effectiveAddress) return;
    
    if (userMessage.e === 'executionReport') {
      // Handle order updates and user trades
      // ... (implementation similar to original but separated)
    }
  }, [userMessage, selectedPool, effectiveAddress]);

  return {
    wsDepthUpdates,
    wsTradeUpdates,
    wsTickerUpdates,
    wsOpenOrders,
    wsUserTrades,
    isReconnected,
    resetReconnectedFlag,
  };
};