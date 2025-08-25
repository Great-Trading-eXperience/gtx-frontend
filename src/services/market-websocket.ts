/**
 * Market WebSocket Service
 * Handles connections to the WebSocket gateway for market data and user-specific streams
 */

import { getWebsocketUrl } from "@/constants/urls/urls-config";

// Types for WebSocket messages
export interface WebSocketSubscribeMessage {
  method: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'LIST_SUBSCRIPTIONS';
  params?: string[];
  id: number;
}

export interface ExecutionReportEvent {
  e: 'executionReport';
  E: number; // Event time
  s: string; // Symbol
  i: string; // Order ID
  S: 'BUY' | 'SELL'; // Side
  o: 'MARKET' | 'LIMIT'; // Order type
  x: 'NEW' | 'TRADE' | 'CANCELED'; // Execution type
  X: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED'; // Order status
  q: string; // Total order quantity
  z: string; // Cumulative filled quantity
  p: string; // Limit price
  L: string; // Last executed price
  T: number; // Timestamp
}

export interface BalanceUpdateEvent {
  e: 'balanceUpdate';
  E: number; // Event time
  a: string; // Token address
  b: string; // Available balance
  l: string; // Locked balance
}

export interface DepthEvent {
  e: 'depthUpdate';
  E: number; // Event time
  s: string; // Symbol
  b: [string, string][]; // Bids [price, quantity]
  a: [string, string][]; // Asks [price, quantity]
}

export interface TradeEvent {
  e: 'trade';
  E: number; // Event time
  s: string; // Symbol
  t: string; // Trade ID
  p: string; // Price
  q: string; // Quantity
  T: number; // Trade time
  m: boolean; // Is buyer market maker
}

export interface KlineEvent {
  e: 'kline';
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Volume
  };
}

export interface MiniTickerEvent {
  e: 'miniTicker' | '24hrMiniTicker';
  E: number; // Event time
  s: string; // Symbol
  c: string; // Close price
  h: string; // High price
  l: string; // Low price
  v: string; // Volume
}

// We can add more event types here as needed in the future

export type WebSocketEvent = 
  | ExecutionReportEvent 
  | BalanceUpdateEvent 
  | DepthEvent 
  | TradeEvent 
  | KlineEvent 
  | MiniTickerEvent;

// Message ID counter
let messageIdCounter = 1;

// File logging utility
const logToFile = (message: string) => {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment - use localStorage or send to server
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} - ${message}\n`;
      
      // Store in localStorage (limited but available)
      const existingLogs = localStorage.getItem('websocket-logs') || '';
      const newLogs = existingLogs + logEntry;
      
      // Keep only last 1000 lines to prevent overflow
      const lines = newLogs.split('\n');
      if (lines.length > 1000) {
        lines.splice(0, lines.length - 1000);
      }
      
      localStorage.setItem('websocket-logs', lines.join('\n'));
    }
  } catch (error) {
    // Fallback to console if localStorage fails
    console.error('Failed to write to log file:', error);
  }
};

// Enhanced logging function
const logWS = (prefix: string, message: string, data?: any) => {
  const fullMessage = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  console.log(fullMessage);
  logToFile(fullMessage);
};

// Export logs function
export const exportWebSocketLogs = () => {
  try {
    const logs = localStorage.getItem('websocket-logs') || 'No logs found';
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('WebSocket logs exported successfully');
  } catch (error) {
    console.error('Failed to export logs:', error);
  }
};

// Clear logs function
export const clearWebSocketLogs = () => {
  localStorage.removeItem('websocket-logs');
  console.log('WebSocket logs cleared');
};

/**
 * Market WebSocket class for handling market data streams
 */
export class MarketWebSocket {
  private socket: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private pingInterval = 30000; // 30 seconds
  private messageHandlers: ((event: WebSocketEvent) => void)[] = [];
  private chainId: number = 11155931;
  private isConnecting = false;

  /**
   * Connect to the market WebSocket
   */
  public connect(chainId: number): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('[MARKET-WS] Already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('[MARKET-WS] Connection in progress');
      return;
    }

    // Close any existing socket first
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = true;

    try {
      const wsUrl = getWebsocketUrl(chainId);
      logWS('[MARKET-WS]', 'Connecting to market WebSocket...', { url: wsUrl, chainId });
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[MARKET-WS] Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnect(): void {
    console.log('[MARKET-WS] Disconnect called');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
    this.subscriptions.clear();
  }

  /**
   * Subscribe to a market stream
   * @param symbol Symbol (e.g., 'ethusdc')
   * @param streamType Stream type (e.g., 'depth', 'trade', 'kline_1m')
   */
  public subscribe(symbol: string, streamType: string, chainId: number): void {
    const stream = `${symbol.toLowerCase()}@${streamType}`;

    this.chainId = chainId;
    
    if (this.subscriptions.has(stream)) {
      console.log(`[MARKET-WS] Already subscribed to ${stream}`);
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[MARKET-WS] Not connected, connecting first...');
      this.subscriptions.add(stream);
      this.connect(chainId);
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'SUBSCRIBE',
      params: [stream],
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
    this.subscriptions.add(stream);
    console.log(`[MARKET-WS] Subscribed to ${stream}`);
  }

  /**
   * Unsubscribe from a market stream
   * @param symbol Symbol (e.g., 'ethusdc')
   * @param streamType Stream type (e.g., 'depth', 'trade', 'kline_1m')
   */
  public unsubscribe(symbol: string, streamType: string): void {
    const stream = `${symbol.toLowerCase()}@${streamType}`;
    
    if (!this.subscriptions.has(stream)) {
      console.log(`[MARKET-WS] Not subscribed to ${stream}`);
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[MARKET-WS] Not connected');
      this.subscriptions.delete(stream);
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: [stream],
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
    this.subscriptions.delete(stream);
    console.log(`[MARKET-WS] Unsubscribed from ${stream}`);
  }

  /**
   * List current subscriptions
   */
  public listSubscriptions(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[MARKET-WS] Not connected');
      return;
    }

    const message: WebSocketSubscribeMessage = {
      method: 'LIST_SUBSCRIPTIONS',
      id: messageIdCounter++
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Add a message handler
   * @param handler Function to handle WebSocket messages
   */
  public addMessageHandler(handler: (event: WebSocketEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   * @param handler Function to remove
   */
  public removeMessageHandler(handler: (event: WebSocketEvent) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[MARKET-WS] Market WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ method: 'PING' }));
        console.log('[MARKET-WS] Sent ping');
      }
    }, this.pingInterval);

    // Resubscribe to all streams
    if (this.subscriptions.size > 0) {
      const streams = Array.from(this.subscriptions);
      const message: WebSocketSubscribeMessage = {
        method: 'SUBSCRIBE',
        params: streams,
        id: messageIdCounter++
      };

      this.socket?.send(JSON.stringify(message));
      console.log(`[MARKET-WS] Resubscribed to ${streams.length} streams`);
    }
  }

  /**
   * Handle WebSocket messages
   * @param event WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Safely parse the message data
      const data = JSON.parse(event.data);
      
      // Add validation to ensure data is a valid WebSocketEvent
      if (data && typeof data === 'object') {
        // Notify all handlers with the validated data
        for (const handler of this.messageHandlers) {
          try {
            handler(data);
          } catch (handlerError) {
            console.error('[MARKET-WS] Error in message handler:', handlerError);
          }
        }
      }
    } catch (error) {
      console.error('[MARKET-WS] Error parsing message:', error, 'Raw data:', event.data);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[MARKET-WS] Closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error
   * @param event WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[MARKET-WS] Error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`[MARKET-WS] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.chainId);
      }, delay);
    } else {
      console.error(`[MARKET-WS] Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
  }
}

/**
 * User WebSocket class for handling user-specific streams
 */
export class UserWebSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private pingInterval = 30000; // 30 seconds
  private messageHandlers: ((event: WebSocketEvent) => void)[] = [];
  private walletAddress: string;
  private chainId: number;
  private isConnecting = false;
  private shouldStayConnected = false;

  /**
   * Create a new UserWebSocket instance
   * @param walletAddress User's wallet address
   */
  constructor(walletAddress: string, chainId: number) {
    this.walletAddress = walletAddress;
    this.chainId = chainId;
  }

  /**
   * Connect to the user WebSocket
   */
  public connect(chainId: number): void {
    if (!this.walletAddress) {
      // console.error('[USER-WS] Wallet address is required');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      // console.log('[USER-WS] Already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      // console.log('[USER-WS] Connection in progress');
      return;
    }

    // Close any existing socket first
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = true;
    this.shouldStayConnected = true;

    try {
      const baseUrl = getWebsocketUrl(chainId);
      const wsUrl = `${baseUrl}/ws/${this.walletAddress}`;
      // console.log('[USER-WS] Base URL:', baseUrl, 'Final URL:', wsUrl);
      // console.log(`[USER-WS] Connecting for ${this.walletAddress}...`, wsUrl, 'chainId:', chainId);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[USER-WS] Error connecting:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnect(): void {
    console.log('[USER-WS] Disconnect called');
    
    this.shouldStayConnected = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
  }

  /**
   * Update the wallet address and reconnect
   * @param walletAddress New wallet address
   */
  public updateWalletAddress(walletAddress: string, chainId: number): void {
    if (this.walletAddress === walletAddress) {
      return;
    }

    this.walletAddress = walletAddress;
    this.chainId = chainId;
    
    // Disconnect and reconnect with new address
    this.disconnect();
    if (walletAddress) {
      this.connect(chainId);
    }
  }

  /**
   * Add a message handler
   * @param handler Function to handle WebSocket messages
   */
  public addMessageHandler(handler: (event: WebSocketEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   * @param handler Function to remove
   */
  public removeMessageHandler(handler: (event: WebSocketEvent) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log(`[USER-WS] Connected for ${this.walletAddress}`);
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ method: 'PING' }));
        console.log('[USER-WS] Sent ping');
      }
    }, this.pingInterval);

    // Send initial ping
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ method: 'PING' }));
      console.log('[USER-WS] Sent initial ping');
    }
  }

  /**
   * Handle WebSocket messages
   * @param event WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[USER-WS] Message:', data);

      // Notify all handlers
      for (const handler of this.messageHandlers) {
        handler(data);
      }
    } catch (error) {
      console.error('[USER-WS] Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[USER-WS] Closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error
   * @param event WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[USER-WS] Error:', event);
    this.isConnecting = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.shouldStayConnected) {
      console.log('[USER-WS] Not reconnecting - shouldStayConnected is false');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`[USER-WS] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        if (this.shouldStayConnected) {
          this.connect(this.chainId);
        }
      }, delay);
    } else {
      console.error(`[USER-WS] Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
  }
}

// Create singleton instances
const marketWs = new MarketWebSocket();
const userWsInstances = new Map<string, UserWebSocket>();

/**
 * Get the market WebSocket instance
 */
export const getMarketWebSocket = (): MarketWebSocket => {
  return marketWs;
};

/**
 * Get a user WebSocket instance for a specific wallet address
 * @param walletAddress User's wallet address
 */
export const getUserWebSocket = (walletAddress: string, chainId: number): UserWebSocket => {
  if (!userWsInstances.has(walletAddress)) {
    userWsInstances.set(walletAddress, new UserWebSocket(walletAddress, chainId));
  }
  return userWsInstances.get(walletAddress)!;
};

/**
 * Force disconnect all user WebSocket instances (for development debugging)
 */
export const disconnectAllUserWebSockets = (): void => {
  console.log('[USER-WS] Disconnecting all user WebSocket instances');
  for (const [address, ws] of userWsInstances) {
    ws.disconnect();
  }
  userWsInstances.clear();
};
