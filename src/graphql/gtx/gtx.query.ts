import { gql } from "graphql-request";

export const poolsQuery = gql`
  query GetPools {
    poolss {
      items {
        baseCurrency
        coin
        id
        lotSize
        maxOrderAmount
        orderBook
        quoteCurrency
        timestamp
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;


export const tradesQuery = gql`
  query GetTrades {
    tradess {
      items {
        id
        orderId
        poolId
        price
        quantity
        timestamp
        transactionId
        pool {
          baseCurrency
          coin
          id
          lotSize
          maxOrderAmount
          orderBook
          quoteCurrency
          timestamp
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
  }
`;

export const ordersQuery = gql`
  query GetOrders {
    orderss {
      items {
        expiry
        filled
        id
        orderId
        poolId
        price
        quantity
        side
        status
        timestamp
        type
        pool {
          baseCurrency
          coin
          id
          lotSize
          maxOrderAmount
          orderBook
          quoteCurrency
          timestamp
        }
      }
      totalCount
    }
  }
`;