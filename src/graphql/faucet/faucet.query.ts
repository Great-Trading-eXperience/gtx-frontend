import { gql } from "graphql-request";

export const queryFaucetTokenss = gql`
  query GetFaucetTokens($chainId: Int!) {
    faucetTokenss(orderBy: "timestamp", orderDirection: "desc", where: { chainId: $chainId }) {
        items {
          token
          id
          timestamp
          transactionId
          blockNumber
          chainId
        }
    }
  }
`;

export const queryRequestTokenss = gql`
  query GetFaucetRequests($chainId: Int!) {
    faucetRequestss(where: { chainId: $chainId }, orderBy: "timestamp", orderDirection: "desc") {
        items {
          id
          receiver
          requester
          timestamp
          token
          blockNumber
          transactionId
          chainId
        }
    }
  }
`;