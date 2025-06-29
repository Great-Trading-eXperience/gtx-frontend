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
export function useMarketWebSocket(chainId: number, stream: string, symbol?: string) {
  // These state hooks must be called in the same order on every render
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

/**
 * A safer version of the user-specific WebSocket hook that properly handles WebSocket connections
 * @param walletAddress User's wallet address
 */
export function useSafeUserWebSocket(walletAddress: string | undefined, chainId: number) {
  // These state hooks must be called in the same order on every render
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);

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
    if (!walletAddress || !chainId) return;

    if (walletAddress !== connectedAddress || chainId !== connectedChainId) {
      setConnectedAddress(walletAddress);
      setConnectedChainId(chainId);
    }

    const ws = getUserWebSocket(walletAddress, chainId);
    
    // Connect to WebSocket
    const connect = () => {
      ws.connect(chainId);
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
    connectedAddress,
    connectedChainId,
    connect: () => {
      if (walletAddress) {
        const ws = getUserWebSocket(walletAddress, chainId);
        ws.connect(chainId);
      }
    },
    disconnect: () => {
      if (walletAddress) {
        const ws = getUserWebSocket(walletAddress, chainId);
        ws.disconnect();
      }
    },
  };
}
