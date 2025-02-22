import { HexAddress } from "../general/address";

export default interface AddToken {
  id: string;
  address: HexAddress;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: string;
}

export type AddTokensData = {
  addTokens: {
    items: AddToken[]
  };
};
