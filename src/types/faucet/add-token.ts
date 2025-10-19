import { HexAddress } from "../general/address";

export default interface FaucetToken {
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
    items: FaucetToken[]
  };
};
