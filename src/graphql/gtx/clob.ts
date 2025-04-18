import { HexAddress } from "@/types/general/address";
import { gql } from "graphql-request";

export const poolsQuery = gql`
  query GetPools {
    poolss {
      items {
      baseCurrency
        coin
        id
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

export type PoolItem = {
  baseCurrency: string
  coin: string
  id: string
  lotSize: string
  maxOrderAmount: string
  orderBook: string
  quoteCurrency: string
  timestamp: number
}

export type PoolsResponse = {
  poolss: {
    items: PoolItem[]
    totalCount: number
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
  }
}

export const tradesQuery = gql`
  query GetTrades($poolId: String) {
    tradess(
      where: { 
        poolId: $poolId
      }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 20
    ) {
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
    }
  }
`;

export type TradeItem = {
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  transactionId: string;
  order: {
    expiry: number;
    filled: string;
    id: string;
    orderId: string;
    poolId: string;
    price: string;
    type: string;
    timestamp: number;
    status: string;
    side: 'Buy' | 'Sell';
    quantity: string;
    user: {
      amount: string;
      currency: string;
      lockedAmount: string;
      name: string;
      symbol: string;
      user: HexAddress;
    };
    pool: {
      baseCurrency: string;
      coin: string;
      id: string;
      lotSize: string;
      maxOrderAmount: string;
      orderBook: string;
      quoteCurrency: string;
      timestamp: number;
    };
  };
}

export type TradesResponse = {
  tradess: {
    items: TradeItem[]
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  }
}

export const ordersQuery = gql`
  query GetOrders($userAddress: String!, $poolId: String) {
    orderss(
      where: { user: $userAddress, poolId: $poolId }
    ) {
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
    }
  }
`;

export type OrderItem = {
  expiry: string
  filled: string
  id: string
  orderId: string
  poolId: string
  price: string
  quantity: string
  side: string
  status: string
  timestamp: number
  type: string
  user: {
    amount: string
    currency: string
    lockedAmount: string
    name: string
    symbol: string
    user: string
  }
}

export type OrdersResponse = {
  orderss: {
    items: OrderItem[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount: number
  }
}

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

export type BalanceItem = {
  amount: string
  currency: string
  lockedAmount: string
  name: string
  symbol: string
  user: string
}

export type BalancesResponse = {
  balancess: {
    items: BalanceItem[]
  }
}

export const minuteCandleStickQuery = gql`
  query GetMinuteCandleStick($poolId: String!) {
    minuteBucketss(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
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
  query GetFiveMinuteCandleStick($poolId: String!) {
    fiveMinuteBucketss(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
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
  query GetHourCandleStick($poolId: String!) {
    hourBucketss(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
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
  query GetDailyCandleStick($poolId: String!) {
    dailyBucketss(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
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

export type CandleStickItem = {
  open: string
  close: string
  low: string
  high: string
  average: string
  count: string
  timestamp: string
}

export type MinuteCandleStickResponse = {
  minuteBucketss: {
    items: CandleStickItem[]
  }
}

export type FiveMinuteCandleStickResponse = {
  fiveMinuteBucketss: {
    items: CandleStickItem[]
  }
}

export type HourCandleStickResponse = {
  hourBucketss: {
    items: CandleStickItem[]
  }
}

export type DailyCandleStickResponse = {
  dailyBucketss: {
    items: CandleStickItem[]
  }
}