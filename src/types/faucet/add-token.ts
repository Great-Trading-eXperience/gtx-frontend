import { HexAddress } from "../general/address";

export default interface FaucetToken {
  id: string;
  token: HexAddress;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
  symbol: string;
  decimals: number;
}

export type FaucetTokensData = {
  faucetTokenss: {
    items: FaucetToken[]
  };
};
