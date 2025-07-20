import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useMarketWebSocket } from '@/hooks/use-market-websocket';
import {
  fetchDepth,
  fetchTrades,
  fetchTickerPrice,
  fetchTicker24hr,
  DepthData,
  TickerPriceData,
  Ticker24hrData
} from '@/lib/market-api';
import {
  transformApiTradeToTradeItem,
  transformWebSocketTradeToTradeItem
} from '@/lib/transform-data';
import { ProcessedPoolItem, TradeItem } from '@/types/gtx/clob';
import { useChainId } from 'wagmi';
import { updateOrderBookSide } from '@/utils/clob-dex/orderBook';

export const useMarketData = (selectedPool: ProcessedPoolItem | undefined, symbol: string) => {
  const [depthData, setDepthData] = useState<DepthData | null>(null);
  const [tickerPrice, setTickerPrice] = useState<TickerPriceData | null>(null);
  const [ticker24hr, setTicker24hr] = useState<Ticker24hrData>();
  const [transformedWsTrades, setTransformedWsTrades] = useState<TradeItem[]>([]);
  const [transformedTrades, setTransformedTrades] = useState<TradeItem[]>([]);
  const [isLoadingTickerPrice, setIsLoadingTickerPrice] = useState(false);
  const [isLoadingApiTrades, setIsLoadingApiTrades] = useState(false);

  const { isReconnected, resetReconnectedFlag } = useWebSocket();

  const chainId = useChainId();

  // WebSocket connections
  const { lastMessage: depthMessage } = useMarketWebSocket(chainId, 'depth', symbol);
  const { lastMessage: tradesMessage } = useMarketWebSocket(chainId, 'trade', symbol);
  const { lastMessage: tickerMessage } = useMarketWebSocket(chainId, 'miniTicker', symbol);

  // Combined trades with deduplication
  const combinedTrades = useMemo(() => {
    const combined = [...transformedTrades];
    
    transformedWsTrades.forEach(wsTrade => {
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
  }, [transformedTrades, transformedWsTrades]);

  // Data fetching functions
  const fetchInitialData = useCallback(async () => {
    if (!selectedPool || !symbol) return;

    try {
      const [depthResult, tradesResult, tickerPriceResult, ticker24hrResult] = await Promise.allSettled([
        fetchDepth(selectedPool.coin),
        fetchTrades(selectedPool.coin),
        fetchTickerPrice(symbol),
        fetchTicker24hr(symbol)
      ]);

      if (depthResult.status === 'fulfilled' && depthResult.value) {
        setDepthData(depthResult.value);
      }

      if (tradesResult.status === 'fulfilled' && tradesResult.value) {
        const transformed = transformApiTradeToTradeItem(
          tradesResult.value,
          selectedPool.id,
          selectedPool.coin
        );
        setTransformedTrades(transformed);
      }

      if (tickerPriceResult.status === 'fulfilled' && tickerPriceResult.value) {
        setTickerPrice(tickerPriceResult.value);
      }

      if (ticker24hrResult.status === 'fulfilled' && ticker24hrResult.value) {
        setTicker24hr(ticker24hrResult.value);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }, [selectedPool, symbol]);

  // WebSocket message handlers
  useEffect(() => {
    if (!depthMessage || !depthData) return;

    if (depthMessage.e === 'depthUpdate') {
      setDepthData(prevDepth => {
        if (!prevDepth) return prevDepth;
        
        const updatedDepth = { ...prevDepth };

        // Update bids
        if (depthMessage.b?.length) {
          updatedDepth.bids = updateOrderBookSide(updatedDepth.bids, depthMessage.b, 'desc');
        }

        // Update asks
        if (depthMessage.a?.length) {
          updatedDepth.asks = updateOrderBookSide(updatedDepth.asks, depthMessage.a, 'asc');
        }

        return updatedDepth;
      });
    }
  }, [depthMessage, depthData]);

  useEffect(() => {
    if (!tradesMessage || !selectedPool) return;

    if (tradesMessage.e === 'trade') {
      const transformedTrade = transformWebSocketTradeToTradeItem(
        tradesMessage,
        selectedPool.id,
        selectedPool.coin
      );
      
      if (transformedTrade) {
        setTransformedWsTrades(prev => {
          const exists = prev.some(trade => trade.id === transformedTrade.id);
          return exists ? prev : [transformedTrade, ...prev].slice(0, 50);
        });
      }
    }
  }, [tradesMessage, selectedPool]);

  useEffect(() => {
    if (!tickerMessage) return;

    if (tickerMessage.e === 'miniTicker' || tickerMessage.e === '24hrMiniTicker') {
      const ticker = tickerMessage as any;

      if (ticker.c) {
        setTickerPrice({
          symbol: ticker.s,
          price: ticker.c
        });
      }

      setTicker24hr(prev => prev ? {
        ...prev,
        lastPrice: ticker.c,
        highPrice: ticker.h || prev.highPrice,
        lowPrice: ticker.l || prev.lowPrice,
        quoteVolume: ticker.v || prev.volume
      } : undefined);
    }
  }, [tickerMessage]);

  // Initial data fetch and reconnection handling
  useEffect(() => {
    if (symbol) {
      fetchInitialData();
    }
  }, [symbol, fetchInitialData]);

  useEffect(() => {
    if (isReconnected && selectedPool) {
      fetchInitialData();
      resetReconnectedFlag();
    }
  }, [isReconnected, selectedPool, fetchInitialData, resetReconnectedFlag]);

  return {
    depthData,
    combinedTrades,
    ticker24hr,
    tickerPrice,
    tradesLoading: isLoadingApiTrades || isLoadingTickerPrice
  };
};
