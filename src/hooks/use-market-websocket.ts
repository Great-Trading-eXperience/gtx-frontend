import { useState, useCallback, useEffect } from 'react';
import { WebSocketEvent, getMarketWebSocket, getUserWebSocket } from '@/services/market-websocket';

// Define the actual WebSocket message format
interface WebSocketMessage {
  stream: string;
  data: WebSocketEvent;
}

/**
 * A safer version of the market WebSocket hook that properly handles WebSocket connections
 * and maintains consistent hook order
 */
export function useMarketWebSocket(stream: string, symbol?: string) {
  // These state hooks must be called in the same order on every render
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((rawMessage: any) => {
    try {
      // Check if the message matches the expected format with stream and data properties
      if (rawMessage && typeof rawMessage === 'object' && 'stream' in rawMessage && 'data' in rawMessage) {
        // Cast to our expected format
        const message = rawMessage as WebSocketMessage;
        const eventData = message.data;
        
        // Extract the stream type from the message.stream (format: symbol@streamType)
        const streamParts = message.stream.split('@');
        const messageStreamType = streamParts.length > 1 ? streamParts[1] : '';
        
        // Check if this message is for our subscribed stream
        if (
          // Match based on the stream part of the message.stream
          messageStreamType === stream ||
          // Special cases for events with different naming conventions
          (stream === 'trade' && eventData.e === 'trade') ||
          (stream === 'miniTicker' && eventData.e === '24hrMiniTicker') ||
          (stream === 'depth' && eventData.e === 'depthUpdate') ||
          (stream === 'kline' && eventData.e === 'kline')
        ) {
          console.log(`Received ${eventData.e} message for ${stream} stream:`, eventData);
          setLastMessage(eventData);
        }
      } else {
        // Handle legacy format or unexpected message format
        console.warn('Received message in unexpected format:', rawMessage);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message for ${stream} stream:`, error);
    }
  }, [stream]);

  useEffect(() => {
    if (!symbol || !stream) return;

    const ws = getMarketWebSocket();
    
    // Connect to WebSocket and subscribe to stream
    const connect = () => {
      console.log('Connecting to WebSocket');
      ws.connect();
      console.log('Subscribing to', symbol.toLowerCase().replaceAll('/', ''), stream);
      ws.subscribe(symbol.toLowerCase().replaceAll('/', ''), stream);
      setIsConnected(true);
    };

    // Register message handler
    ws.addMessageHandler(handleMessage);
    
    // Initial connection
    connect();

    return () => {
      // Clean up on unmount
      if (symbol && stream) {
        ws.unsubscribe(symbol.toLowerCase().replaceAll('/', ''), stream);
      }
      ws.removeMessageHandler(handleMessage);
    };
  }, [symbol, stream, handleMessage]);

  // Return consistent interface
  return {
    lastMessage,
    isConnected,
    connect: () => {
      const ws = getMarketWebSocket();
      ws.connect();
      if (symbol && stream) {
        console.log('Subscribing to', symbol.toLowerCase().replaceAll('/', ''), stream);
        ws.subscribe(symbol.toLowerCase().replaceAll('/', ''), stream);
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

/**
 * A safer version of the user-specific WebSocket hook that properly handles WebSocket connections
 * @param walletAddress User's wallet address
 */
export function useSafeUserWebSocket(walletAddress: string | undefined) {
  // These state hooks must be called in the same order on every render
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleMessage = useCallback((message: WebSocketEvent) => {
    try {
      // Only set messages that are relevant to user events
      if (message.e === 'executionReport' || message.e === 'balanceUpdate') {
        setLastMessage(message);
      }
    } catch (error) {
      console.error('Error handling user WebSocket message:', error);
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) return;

    const ws = getUserWebSocket(walletAddress);
    
    // Connect to WebSocket
    const connect = () => {
      ws.connect();
      setIsConnected(true);
    };

    // Register message handler
    ws.addMessageHandler(handleMessage);
    
    // Initial connection
    connect();

    return () => {
      // Clean up on unmount
      ws.disconnect();
      ws.removeMessageHandler(handleMessage);
    };
  }, [walletAddress, handleMessage]);

  // Return consistent interface
  return {
    lastMessage,
    isConnected,
    connect: () => {
      if (walletAddress) {
        const ws = getUserWebSocket(walletAddress);
        ws.connect();
      }
    },
    disconnect: () => {
      if (walletAddress) {
        const ws = getUserWebSocket(walletAddress);
        ws.disconnect();
      }
    },
  };
}
