import { HexAddress } from '@/types/general/address';
import { gql } from 'graphql-request';

export const CurrencyFields = gql`
  fragment CurrencyFields on currencies {
    address
    decimals
    symbol
    name
  }
`;

export type CurrencyType = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export const OrderFields = gql`
  fragment OrderFields on orders {
    side
    price
    quantity
    type
  }
`;

export type OrderType = {
  side: 'Buy' | 'Sell';
  price: string;
  quantity: string;
  type: string;
};

export const poolsPonderQuery = gql`
  ${CurrencyFields}
  query GetPools {
    poolss {
      items {
        baseCurrency {
          ...CurrencyFields
        }
        quoteCurrency {
          ...CurrencyFields
        }
        coin
        id
        orderBook
        timestamp
        volume
        volumeInQuote
        baseDecimals
        quoteDecimals
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
  ${CurrencyFields}
  query GetPools {
    pools {
      baseCurrency {
        ...CurrencyFields
      }
      quoteCurrency {
        ...CurrencyFields
      }
      coin
      id
      orderBook
      timestamp
    }
  }
`;

export type PoolItem = {
  coin: string;
  id: string;
  orderBook: string;
  timestamp: number;
  baseCurrency: CurrencyType;
  quoteCurrency: CurrencyType;
  volume: string;
  lotSize: string;
  maxOrderAmount: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseDecimals?: number;
  quoteDecimals?: number;
};

export type PoolsPonderResponse = {
  poolss: {
    items: PoolItem[];
    totalCount: number;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
  };
};

export type PoolsResponse = {
  pools: PoolItem[];
};

export const tradesPonderQuery = gql`
  ${CurrencyFields}
  query GetTrades($poolId: String, $limit: Int = 20) {
    tradess(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
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
            currency {
              ...CurrencyFields
            }
            lockedAmount
            user
          }
          pool {
            coin
            baseCurrency {
              ...CurrencyFields
            }
            quoteCurrency {
              ...CurrencyFields
            }
            id
            orderBook
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
      currency: CurrencyType;
      lockedAmount: string;
      symbol: string;
      user: HexAddress;
    };
    pool: {
      coin: string;
      id: string;
      lotSize: string;
      maxOrderAmount: string;
      orderBook: string;
      timestamp: number;
      baseCurrency: CurrencyType;
      quoteCurrency: CurrencyType;
    };
  };
};

export type TradesPonderResponse = {
  tradess: {
    items: TradeItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
};

export type TradesResponse = {
  trades: TradeItem[];
};

export const recentTradesPonderQuery = gql`
  query GetRecentTrades($poolId: String!, $limit: Int = 50) {
    orderBookTradess(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        chainId
        price
        quantity
        timestamp
        side
        transactionId
      }
      totalCount
    }
  }
`;

export const recentTradesQuery = gql`
  query GetRecentTrades($poolId: String!, $limit: Int = 50) {
    orderBookTrades(
      where: { poolId: $poolId }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      chainId
      price
      quantity
      timestamp
      side
      poolId
      transactionId
      id
    }
  }
`;

export type RecentTradeItem = {
  id: string;
  chainId: number;
  poolId: string;
  price: string;
  quantity: string;
  timestamp: number;
  side: 'Buy' | 'Sell';
  transactionId: string;
};

export type RecentTradesPonderResponse = {
  orderBookTradess: {
    items: RecentTradeItem[];
    totalCount: number;
  };
};

export type RecentTradesResponse = {
  orderBookTrades: RecentTradeItem[];
};

export const ordersPonderQuery = gql`
  query GetOrders($userAddress: String!, $poolId: String) {
    orderss(where: { user: $userAddress, poolId: $poolId }) {
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
          user
        }
      }
    }
  }
`;

export const ordersQuery = gql`
  query GetOrders($userAddress: String!, $poolId: String) {
    orders(where: { user: $userAddress, pool: $poolId }) {
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
  expiry: string;
  filled: string;
  id: string;
  orderId: string;
  poolId: string;
  price: string;
  quantity: string;
  side: string;
  status: string;
  timestamp: number;
  type: string;
  user: {
    amount: string;
    currency: string;
    lockedAmount: string;
    user: string;
  };
};

export type OrdersPonderResponse = {
  orderss: {
    items: OrderItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
};

export type OrdersResponse = {
  orderss: OrderItem[];
};

export const balancesPonderQuery = gql`
  ${CurrencyFields}
  query GetBalances($userAddress: String!) {
    balancess(where: { user: $userAddress }) {
      items {
        amount
        currency {
          ...CurrencyFields
        }
        lockedAmount
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
  ${CurrencyFields}
  query GetBalances($userAddress: String!) {
    balances(where: { user: $userAddress }) {
      id
      amount
      lockedAmount
      user
      currency {
        ...CurrencyFields
      }
    }
  }
`;

export type BalanceItem = {
  id: string;
  currency: CurrencyType;
  amount: string;
  lockedAmount: string;
  user: string;
};

export type BalancesPonderResponse = {
  balancess: {
    items: BalanceItem[];
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
    };
    totalCount: number;
  };
};

export type BalancesResponse = {
  balances: BalanceItem[];
};

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
    hourBuckets(where: { pool: $poolId }) {
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
  average: number;
  close: number;
  closeTime: number;
  count: number;
  id: string;
  low: number;
  high: number;
  open: number;
  openTime: number;
  poolId: string;
  quoteVolume: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
  volume: number;
};

export type MinuteCandleStickPonderResponse = {
  minuteBucketss: {
    items: CandleStickItem[];
  };
};

export type MinuteCandleStickResponse = {
  minuteBuckets: CandleStickItem[];
};

export type FiveMinuteCandleStickPonderResponse = {
  fiveMinuteBucketss: {
    items: CandleStickItem[];
  };
};

export type FiveMinuteCandleStickResponse = {
  fiveMinuteBuckets: CandleStickItem[];
};

export type HourCandleStickPonderResponse = {
  hourBucketss: {
    items: CandleStickItem[];
  };
};

export type HourCandleStickResponse = {
  hourBuckets: CandleStickItem[];
};

export type DailyCandleStickPonderResponse = {
  dailyBucketss: {
    items: CandleStickItem[];
  };
};

export type DailyCandleStickResponse = {
  dailyBuckets: CandleStickItem[];
};

export const openOrdersPonderQuery = gql`
  query GetUserOpenOrders($userAddress: String!, $status: String) {
    orderss(
      where: { user: $userAddress, status: $status }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 50
    ) {
      items {
        chainId
        poolId
        id
        orderId
        side
        timestamp
        transactionId
        price
        quantity
        filled
        type
        status
        expiry
      }
      totalCount
    }
  }
`;

export const openOrdersQuery = gql`
  query GetOpenOrders($userAddress: String!) {
    orders(
      where: { user: $userAddress }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 50
    ) {
      chainId
      poolId
      id
      orderId
      side
      timestamp
      transactionId
      price
      quantity
      filled
      type
      status
      expiry
    }
  }
`;

export type OpenOrderItem = {
  chainId: number;
  poolId: string;
  orderId: bigint;
  id: string;
  side: string;
  timestamp: number;
  transactionId: string;
  price: string;
  quantity: string;
  filled: string;
  type: string;
  status: string;
  expiry: number;
};

export type OpenOrdersPonderResponse = {
  orderss: {
    items: OpenOrderItem[];
    totalCount: number;
  };
};

export type OpenOrdersResponse = {
  orders: OpenOrderItem[];
};

export const tradeHistoryPonderQuery = gql`
  ${OrderFields}
  query GetUserTradeHistory($orderIds: [BigInt!]) {
    orderHistorys(
      where: { orderId_in: $orderIds }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 100
    ) {
      items {
        chainId
        orderId
        timestamp
        filled
        status
        id
        transactionId
        order {
          ...OrderFields
        }
      }
      totalCount
    }
  }
`;

export const tradeHistoryQuery = gql`
  ${OrderFields}
  query GetTradeHistory($orderIds: [BigInt!]) {
    orderHistorys(
      where: { orderId_in: $orderIds }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 100
    ) {
      chainId
      orderId
      timestamp
      filled
      status
      id
      transactionId
      order {
        ...OrderFields
      }
    }
  }
`;
export type TradeHistoryItem = {
  chainId: number;
  orderId: string;
  timestamp: number;
  filled: string;
  status: string;
  transactionId: string;
  id: string;
  order: OrderType;
};

export type TradeHistoryPonderResponse = {
  orderHistorys: {
    items: TradeHistoryItem[];
    totalCount: number;
  };
};

export type TradeHistoryResponse = {
  orderHistorys: TradeHistoryItem[];
};
