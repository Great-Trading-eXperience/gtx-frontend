export interface MatchOrderEvent {
  id: string
  is_market: boolean
  is_buy: boolean
  order_index: string
  tick: string
  timestamp: number
  user: string
  volume: string
}
  
  export interface MatchOrderEventResponse {
    matchOrderEvents: {
      items: MatchOrderEvent[];
    }
  }