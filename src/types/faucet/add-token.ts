import { HexAddress } from "../general/address";

export default interface FaucetToken {
  id: string;
  token: HexAddress;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
}

export type FaucetTokensData = {
  faucetTokenss: {
    items: FaucetToken[]
  };
};
