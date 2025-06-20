export default interface FaucetRequest {
  id: string,
  requester: string;  
  receiver: string;
  token: string;
  blockNumber: number;
  timestamp: number;
  transactionId: number;
}

export type FaucetRequestsData = {
  faucetRequestss: {
    items: FaucetRequest[]
  };
};
