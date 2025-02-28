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
        order {
          expiry
          filled
          id
          orderId
          poolId
          price
          type
          timestamp
          status
          side
          quantity
          user {
            amount
            currency
            lockedAmount
            name
            symbol
            user
          }
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
        orderId
        poolId
        price
        quantity
        timestamp
        transactionId
      }
      totalCount
      pageInfo {
        startCursor
        hasPreviousPage
        hasNextPage
        endCursor
      }
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

export const orderHistorysQuery = gql`
  query GetOrderHistory($userAddress: String!) {
    orderss(where: { user: $userAddress }) {
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
        user {
          amount
          currency
          lockedAmount
          name
          symbol
          user
        }
      }
      totalCount
      pageInfo {
        startCursor
        hasPreviousPage
        hasNextPage
        endCursor
      }
    }
  }
`;


export const balancesQuery = gql`
  query GetBalances($userAddress: String!) {
    balancess(where: { user: $userAddress }) {
      items {
        amount
        currency
        lockedAmount
        name
        symbol
        user
      }
      pageInfo {
        startCursor
        hasPreviousPage
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

// Export the GraphQL queries
export const minuteCandleStickQuery = gql`
  query GetMinuteCandleStick {
    minuteBucketss(
      where: { poolId: "0x4c1e6bcdca3644b245081ff512e3a3c79cd18391" }
      orderBy: "timestamp"
      orderDirection: "asc"
    ) {
      items {
        open
        close
        low
        high
        average
        count
        timestamp
      }
    }
  }
`;

export const fiveMinuteCandleStickQuery = gql`
  query GetFiveMinuteCandleStick {
    fiveMinuteBucketss(
      where: { poolId: "0x4c1e6bcdca3644b245081ff512e3a3c79cd18391" }
      orderBy: "timestamp"
      orderDirection: "asc"
    ) {
      items {
        open
        close
        low
        high
        average
        count
        timestamp
      }
    }
  }
`;

export const hourCandleStickQuery = gql`
  query GetHourCandleStick {
    hourBucketss(
      where: { poolId: "0x4c1e6bcdca3644b245081ff512e3a3c79cd18391" }
      orderBy: "timestamp"
      orderDirection: "asc"
    ) {
      items {
        open
        close
        low
        high
        average
        count
        timestamp
      }
    }
  }
`;

export const dailyCandleStickQuery = gql`
  query GetDailyCandleStick {
    dailyBucketss(
      where: { poolId: "0x4c1e6bcdca3644b245081ff512e3a3c79cd18391" }
      orderBy: "timestamp"
      orderDirection: "asc"
    ) {
      items {
        open
        close
        low
        high
        average
        count
        timestamp
      }
    }
  }
`;