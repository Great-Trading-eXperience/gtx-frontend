import { 
  PoolsResponse, 
  PoolsPonderResponse, 
  TradesResponse, 
  TradesPonderResponse,
  OrdersResponse,
  OrdersPonderResponse,
  BalancesResponse,
  BalancesPonderResponse,
  PoolItem,
  TradeItem,
  OrderItem,
  BalanceItem
} from '@/graphql/gtx/clob'

export function transformPoolsData(data: PoolsResponse | PoolsPonderResponse | undefined): PoolItem[] {
  if (!data) return []

  if ('poolss' in data) {
    // Handle PonderResponse
    return data.poolss.items
  } else if ('pools' in data) {
    // Handle regular Response
    return data.pools
  }

  return []
}

export function transformTradesData(data: TradesResponse | TradesPonderResponse | undefined): TradeItem[] {
  if (!data) return []

  if ('tradess' in data) {
    // Handle PonderResponse
    return data.tradess.items
  } else if ('trades' in data) {
    // Handle regular Response
    return data.trades
  }

  return []
}

export function transformOrdersData(data: OrdersResponse | OrdersPonderResponse | undefined): OrderItem[] {
  if (!data) return []

  // Both types use 'orderss' but with different structures
  if ('orderss' in data) {
    if ('items' in data.orderss) {
      // Handle PonderResponse
      return data.orderss.items
    } else {
      // Handle regular Response
      return data.orderss
    }
  }

  return []
}

export function transformBalancesData(data: BalancesResponse | BalancesPonderResponse | undefined): BalanceItem[] {
  if (!data) return []

  // Both types use 'balancess' but with different structures
  if ('balancess' in data) {
    if ('items' in data.balancess) {
      // Handle PonderResponse
      return data.balancess.items
    } else {
      // Handle regular Response
      return data.balancess
    }
  }

  return []
} 