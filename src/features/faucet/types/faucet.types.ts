export type HexAddress = `0x${string}`;

export interface FaucetToken {
  id: string;
  token: HexAddress;
  symbol: string;
  decimals: number;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
}

export type FaucetTokensData = {
  faucetTokenss: {
    items: FaucetToken[];
  };
};

export interface FaucetRequest {
  id: string;
  requester: string;
  receiver: string;
  token: HexAddress;
  blockNumber: number;
  timestamp: number;
  transactionId: number;
}

export type FaucetRequestsData = {
  faucetRequestss: {
    items: FaucetRequest[];
  };
};

export interface UseFaucetCooldownResponse {
  faucetCooldown: bigint | undefined;
  loading: boolean;
  hasError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFaucetRequestDataResponse {
  faucetRequestsData: FaucetRequestsData | undefined;
  loading: boolean;
  hasErrors: boolean;
  error: Error | null;
  refetchAll: () => Promise<void>;
}

export interface UseFaucetTokensDataResponse {
  faucetTokensData: FaucetTokensData | undefined;
  loading: boolean;
  hasErrors: boolean;
  error: Error | null;
  refetchAll: () => Promise<void>;
}

export interface UseLastRequestTimeResponse {
  lastRequestTime: bigint | undefined;
  loading: boolean;
  hasError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseUserAndFaucetBalancesResponse {
  userBalance: bigint | undefined;
  faucetBalance: bigint | undefined;
  loading: boolean;
  hasError: boolean;
  error: Error | null;
  refetch: () => void;
}
