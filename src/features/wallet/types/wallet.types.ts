export interface Asset {
  token: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
  };
  balance: string;
  displayBalance: string;
  symbol: string;
  managerBalance?: string;
  externalBalance?: string;
  externalManagerBalance?: string;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  sourceAddresses?: Record<number, string>;  // For cross-chain support
}

export interface Balance {
  token: Token;
  externalBalance: string;
  displayBalance: string;
  symbol: string;
}

export interface BalanceHookResult {
  token: Token;
  tokenBalance: string | null;
  managerBalance: string | null;
  externalBalance: string | null;
  externalManagerBalance: string | null;
  displayBalance: string | null;
  symbol: string;
  refetch: () => void;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: string;
  token: string;
  sourceChain: string;
  destChain: string;
  from: string;
  to: string;
  timestamp: number;
  sourceTxHash: string;
  destTxHash?: string;
  messageId: string;
  status: 'completed' | 'processing';
}

export interface HistoryTabProps {
  transactions: Transaction[];
  loading?: boolean;
  onRefresh: () => void;
  getExplorerUrl: (chainId: number, txHash: string) => string;
}

export type CurrencyType = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type PoolItem = {
  coin: string;
  id: string;
  orderBook: string;
  timestamp: number;
  baseCurrency: CurrencyType;
  quoteCurrency: CurrencyType;
  volume: string;
  lotSize: string;
  maxOrderAmount: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseDecimals?: number;
  quoteDecimals?: number;
};

export type PoolsResponse = {
  pools: PoolItem[];
};

export interface PairedMessageItem {
  blockNumber: string;
  chainId: string;
  type: string;
  transactionHash: string;
  timestamp: string;
  id: string;
  sender: string;
}

export interface DispatchMessage {
  chainId: string;
  blockNumber: string;
  messageId: string;
  sender: string;
  timestamp: string;
  transactionHash: string;
  type: string;
  pairedMessages: {
    items: PairedMessageItem[];
  };
}

export interface CrossChainTransfer {
  direction: string;
  amount: string;
  recipient: string;
  sender: string;
  sourceChainId: string;
  sourceToken: string;
  dispatchMessage: DispatchMessage;
}

export interface CrossChainTransfersResponse {
  crossChainTransferss: {
    items: CrossChainTransfer[];
  };
}
