export default interface DepositToken {
  id: string,
  depositor: string;  
  token: string;
  amount: number;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: number;
}

export type DepositTokensData = {
  requestTokens: {
    items: DepositToken[]
  };
};
