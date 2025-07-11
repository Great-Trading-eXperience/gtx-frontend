import { gql } from "graphql-request";

export const queryAddTokens = gql`{
    addTokens(orderBy: "timestamp", orderDirection: "desc") {
        items {
          address
          id
          lastRequestTime
          timestamp
          transactionHash
          blockNumber
        }
    }
}`

export const queryRequestTokens = gql`{
    requestTokens {
        items {
          id
          receiver
          requester
          timestamp
          token
          blockNumber
          transactionHash
        }
  }
}`