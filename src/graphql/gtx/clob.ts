import { HexAddress } from "@/types/general/address";
import { gql } from "graphql-request";

export const poolsPonderQuery = gql`
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

export const poolsQuery = gql`
  query GetPools {
    pools {
      baseCurrency
      coin
      id
      orderBook
      quoteCurrency
      timestamp
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
  baseSymbol?: string
  quoteSymbol?: string
  baseDecimals?: number
  quoteDecimals?: number
}

export type PoolsPonderResponse = {
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

export type PoolsResponse = {
  pools: PoolItem[]
}

export const tradesPonderQuery = gql`
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

export const tradesQuery = gql`
  query GetTrades {
    trades {
      pool
      price
      quantity
      timestamp
      transactionId
      order {
        expiry
        filled
        id
        orderId
        orderValue
        pool
        price
        quantity
        side
        status
        timestamp
        type
        user
      }
      id
    }
  }
`;



export type TradeItem = {
  id: string;
  orderId: string;
  poolId: string;
  pool: string;
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

export type TradesPonderResponse = {
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

export type TradesResponse = {
  trades: TradeItem[]
}

export const ordersPonderQuery = gql`
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

export const ordersQuery = gql`
  query GetOrders($userAddress: String!, $poolId: String) {
    orders(
      where: { user: $userAddress, pool: $poolId }
    ) {
      expiry
      filled
      id
      orderId
      pool
      price
      quantity
      side
      status
      timestamp
      type
      user
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

export type OrdersPonderResponse = {
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

export type OrdersResponse = {
  orderss: OrderItem[]
}

export const balancesPonderQuery = gql`
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

export const balancesQuery = gql`
  query GetBalances($userAddress: String!) {
    balances(where: { user: $userAddress }) {
      amount
      currency
      lockedAmount
      name
      symbol
      user
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

export type BalancesPonderResponse = {
  balancess: {
    items: BalanceItem[]
    pageInfo: {
      endCursor: string
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
    }
    totalCount: number
  }
}

export type BalancesResponse = {
  balances: BalanceItem[]
}

export const minuteCandleStickPonderQuery = gql`
  query GetMinuteCandleStick($poolId: String!) {
    minuteBucketss(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
    ) {
      average
      close
      count
      low
      id
      high
      open
      pool
      timestamp
    }
  }
`;

export const minuteCandleStickQuery = gql`
  query GetMinuteCandleStick($poolId: String!) {
    minuteBuckets(
      where: { pool: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
    ) {
      average
      close
      count
      low
      id
      high
      open
      pool
      timestamp
    }
  }
`;

export const fiveMinuteCandleStickPonderQuery = gql`
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


export const fiveMinuteCandleStickQuery = gql`
  query GetFiveMinuteCandleStick($poolId: String!) {
    fiveMinuteBuckets(
      where: { pool: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      average
      close
      count
      id
      high
      open
      low
      openTime
      poolId
      quoteVolume
      takerBuyBaseVolume
      takerBuyQuoteVolume
      volume
      closeTime
    }
  }
`;

export const hourCandleStickPonderQuery = gql`
  query GetHourCandleStick($poolId: String!) {
    hourBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        average
        close
        count
        id
        high
        open
        low
        openTime
        poolId
        quoteVolume
        takerBuyBaseVolume
        takerBuyQuoteVolume
        volume
        closeTime
      }
    }
  }
`;

export const hourCandleStickQuery = gql`
  query GetHourCandleStick($poolId: String!) {
    hourBuckets(
      where: { pool: $poolId }
    ) {
      average
      close
      count
      low
      id
      high
      open
      pool
      timestamp
    }
  }
`;

export const dailyCandleStickPonderQuery = gql`
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

export const dailyCandleStickQuery = gql`
  query GetDailyCandleStick($poolId: String!) {
    dailyBuckets(
      where: { pool: $poolId }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: 1000
    ) {
      average
      close
      count
      low
      id
      high
      open
      pool
      timestamp
    }
  }
`;

export type CandleStickItem = {
  average: number
  close: number
  closeTime: number
  count: number
  id: string
  low: number
  high: number
  open: number
  openTime: number
  poolId: string
  quoteVolume: number
  takerBuyBaseVolume: number
  takerBuyQuoteVolume: number
  volume: number
}

export type MinuteCandleStickPonderResponse = {
  minuteBucketss: {
    items: CandleStickItem[]
  }
}

export type MinuteCandleStickResponse = {
  minuteBuckets: CandleStickItem[]
}

export type FiveMinuteCandleStickPonderResponse = {
  fiveMinuteBucketss: {
    items: CandleStickItem[]
  }
}

export type FiveMinuteCandleStickResponse = {
  fiveMinuteBuckets: CandleStickItem[]
}

export type HourCandleStickPonderResponse = {
  hourBucketss: {
    items: CandleStickItem[]
  }
}

export type HourCandleStickResponse = {
  hourBuckets: CandleStickItem[]
}

export type DailyCandleStickPonderResponse = {
  dailyBucketss: {
    items: CandleStickItem[]
  }
}

export type DailyCandleStickResponse = {
  dailyBuckets: CandleStickItem[]
}