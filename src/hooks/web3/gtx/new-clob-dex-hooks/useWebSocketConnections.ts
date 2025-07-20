// hooks/useWebSocketConnections.ts
import { useEffect } from 'react';
import { useMarketWebSocket } from '@/hooks/use-market-websocket';
import { useUserWebSocket } from '@/hooks/use-user-websocket';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';

interface UseWebSocketConnectionsProps {
  effectiveAddress: HexAddress | undefined;
  chainId: number;
  symbol: string;
  selectedPool: ProcessedPoolItem | undefined;
  effectiveIsConnected: boolean;
}

export const useWebSocketConnections = ({
  effectiveAddress,
  chainId,
  symbol,
  selectedPool,
  effectiveIsConnected
}: UseWebSocketConnectionsProps) => {
  
  const {
    isConnected: isDepthConnected,
    connect: connectDepthWebSocket,
  } = useMarketWebSocket(chainId, 'depth', symbol);

  const {
    isConnected: isTradesConnected,
    connect: connectTradesWebSocket,
  } = useMarketWebSocket(chainId, 'trade', symbol);

  const {
    isConnected: isTickerConnected,
    connect: connectTickerWebSocket,
  } = useMarketWebSocket(chainId, 'miniTicker', symbol);

  const {
    isConnected: isUserConnected,
    connectedAddress,
    connectedChainId,
    connect: connectUserWebSocket,
  } = useUserWebSocket(effectiveAddress, chainId);

  // Connect market WebSockets when symbol changes
  useEffect(() => {
    if (symbol) {
      connectDepthWebSocket();
      connectTradesWebSocket();
      connectTickerWebSocket();
    }
  }, [symbol, connectDepthWebSocket, connectTradesWebSocket, connectTickerWebSocket]);

  // Connect user WebSocket when address or chain changes
  useEffect(() => {
    if (chainId !== connectedChainId || effectiveAddress !== connectedAddress) {
      connectUserWebSocket();
    }
  }, [effectiveAddress, chainId, connectedChainId, connectedAddress, connectUserWebSocket]);

  // Log connection states for debugging
  useEffect(() => {
    console.log(`Market WebSocket status - Depth: ${isDepthConnected}, Trades: ${isTradesConnected}, Ticker: ${isTickerConnected}`);
  }, [isDepthConnected, isTradesConnected, isTickerConnected]);

  useEffect(() => {
    if (effectiveAddress) {
      console.log(`User WebSocket status: ${isUserConnected}`);
    }
  }, [isUserConnected, effectiveAddress]);

  return {
    isDepthConnected,
    isTradesConnected,
    isTickerConnected,
    isUserConnected
  };
};