import { WebSocketEvent, getMarketWebSocket } from '@/services/market-websocket';
import { useCallback, useEffect, useState } from 'react';

interface WebSocketMessage {
  stream: string;
  data: WebSocketEvent;
}

export function useMarketWebSocket(chainId: number, stream: string, symbol?: string) {
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((rawMessage: any) => {
    try {
      if (rawMessage && typeof rawMessage === 'object' && 'stream' in rawMessage && 'data' in rawMessage) {
        const message = rawMessage as WebSocketMessage;
        const eventData = message.data;
        
        const streamParts = message.stream.split('@');
        const messageStreamType = streamParts.length > 1 ? streamParts[1] : '';
        
        if (
          messageStreamType === stream ||
          (stream === 'trade' && eventData.e === 'trade') ||
          (stream === 'miniTicker' && eventData.e === '24hrMiniTicker') ||
          (stream === 'depth' && eventData.e === 'depthUpdate') ||
          (stream === 'kline' && eventData.e === 'kline')
        ) {
          setLastMessage(eventData);
        }
      } else {
        console.warn('Received message in unexpected format:', rawMessage);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message for ${stream} stream:`, error);
    }
  }, [stream]);

  useEffect(() => {
    if (!symbol || !stream) return;

    if(!chainId) return;

    const ws = getMarketWebSocket();
    
    const connect = () => {
      console.log('Connecting to WebSocket');
      ws.connect(chainId);
      console.log('Subscribing to', symbol.toLowerCase().replaceAll('/', ''), stream);
      ws.subscribe(symbol.toLowerCase().replaceAll('/', ''), stream, chainId);
      setIsConnected(true);
    };

    ws.addMessageHandler(handleMessage);

    return () => {
      if (symbol && stream) {
        ws.unsubscribe(symbol.toLowerCase().replaceAll('/', ''), stream);
      }
      ws.removeMessageHandler(handleMessage);
    };
  }, [symbol, stream, handleMessage]);

  return {
    lastMessage,
    isConnected,
    connect: () => {
      const ws = getMarketWebSocket();
      ws.connect(chainId);
      if (symbol && stream) {
        console.log('Subscribing to', symbol.toLowerCase().replaceAll('/', ''), stream);
        ws.subscribe(symbol.toLowerCase().replaceAll('/', ''), stream, chainId);
      }
    },
    disconnect: () => {
      const ws = getMarketWebSocket();
      if (symbol && stream) {
        console.log('Unsubscribing from', symbol, stream);
        ws.unsubscribe(symbol.toLowerCase().replaceAll('/', ''), stream);
      }
    },
  };
}