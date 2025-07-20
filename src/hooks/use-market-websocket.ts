import { WebSocketEvent, getMarketWebSocket } from '@/services/market-websocket';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

interface WebSocketMessage {
  stream: string;
  data: WebSocketEvent;
}

export function useMarketWebSocket(chainId: number, stream: string, symbol?: string) {
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Use ref to avoid recreating the WebSocket instance
  const wsRef = useRef<ReturnType<typeof getMarketWebSocket> | null>(null);
  
  // Memoize normalized symbol to prevent unnecessary recalculations
  const normalizedSymbol = useMemo(() => 
    symbol?.toLowerCase().replaceAll('/', '') || '', 
    [symbol]
  );

  // Create a stable message handler
  const handleMessage = useCallback((rawMessage: any) => {
    try {
      if (!rawMessage || typeof rawMessage !== 'object' || !('stream' in rawMessage) || !('data' in rawMessage)) {
        console.warn('Received message in unexpected format:', rawMessage);
        return;
      }

      const message = rawMessage as WebSocketMessage;
      const eventData = message.data;
      
      // More efficient stream matching
      const streamParts = message.stream.split('@');
      const messageStreamType = streamParts[1] || '';
      
      // Use a Map for faster lookups instead of multiple conditions
      const streamEventMap = new Map([
        ['trade', 'trade'],
        ['miniTicker', '24hrMiniTicker'],
        ['depth', 'depthUpdate'],
        ['kline', 'kline']
      ]);

      const shouldAcceptMessage = 
        messageStreamType === stream || 
        streamEventMap.get(stream) === eventData.e;

      if (shouldAcceptMessage) {
        setLastMessage(eventData);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message for ${stream} stream:`, error);
    }
  }, [stream]);

  // Stable connection function
  const connect = useCallback(() => {
    if (!normalizedSymbol || !stream || !chainId || connectionState === 'connecting') return;

    try {
      setConnectionState('connecting');
      
      if (!wsRef.current) {
        wsRef.current = getMarketWebSocket();
      }

      const ws = wsRef.current;
      
      console.log('Connecting to WebSocket');
      ws.connect(chainId);
      
      console.log('Subscribing to', normalizedSymbol, stream);
      ws.subscribe(normalizedSymbol, stream, chainId);
      
      setIsConnected(true);
      setConnectionState('connected');
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [normalizedSymbol, stream, chainId, connectionState]);

  // Stable disconnect function
  const disconnect = useCallback(() => {
    if (!wsRef.current || !normalizedSymbol || !stream) return;

    try {
      console.log('Unsubscribing from', normalizedSymbol, stream);
      wsRef.current.unsubscribe(normalizedSymbol, stream);
      setIsConnected(false);
      setConnectionState('disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [normalizedSymbol, stream]);

  useEffect(() => {
    if (!normalizedSymbol || !stream || !chainId) {
      setIsConnected(false);
      setConnectionState('disconnected');
      return;
    }

    // Get or create WebSocket instance
    if (!wsRef.current) {
      wsRef.current = getMarketWebSocket();
    }

    const ws = wsRef.current;
    
    // Add message handler
    ws.addMessageHandler(handleMessage);

    // Auto-connect
    connect();

    // Cleanup function
    return () => {
      if (wsRef.current && normalizedSymbol && stream) {
        wsRef.current.unsubscribe(normalizedSymbol, stream);
        wsRef.current.removeMessageHandler(handleMessage);
      }
    };
  }, [normalizedSymbol, stream, chainId, handleMessage, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current = null;
      }
    };
  }, []);

  return {
    lastMessage,
    isConnected,
    connectionState, // Added for better state tracking
    connect,
    disconnect,
  };
}