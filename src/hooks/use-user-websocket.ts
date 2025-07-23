import { WebSocketEvent, getUserWebSocket } from '@/services/market-websocket';
import { useCallback, useEffect, useState } from 'react';

export function useUserWebSocket(walletAddress: string | undefined, chainId: number) {
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);

  const handleMessage = useCallback((message: WebSocketEvent) => {
    try {
      if (message.e === 'executionReport' || message.e === 'balanceUpdate') {
        setLastMessage(message);
      }
    } catch (error) {
      console.error('Error handling user WebSocket message:', error);
    }
  }, []);

  useEffect(() => {
    if (!walletAddress || !chainId) return;

    const effectId = Math.random().toString(36).substr(2, 9);
    console.log(`[USER-WS] Effect started for ${walletAddress} - ID: ${effectId}`);

    if (walletAddress !== connectedAddress || chainId !== connectedChainId) {
      setConnectedAddress(walletAddress);
      setConnectedChainId(chainId);
    }

    const ws = getUserWebSocket(walletAddress, chainId);
    
    const connect = () => {
      ws.connect(chainId);
      setIsConnected(true);
    };
    ws.addMessageHandler(handleMessage);
    
    connect();

    return () => {
      console.log(`[USER-WS] Effect cleanup for ${walletAddress} - ID: ${effectId}`);
      ws.disconnect();
      ws.removeMessageHandler(handleMessage);
    };
  }, [walletAddress, chainId]);

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