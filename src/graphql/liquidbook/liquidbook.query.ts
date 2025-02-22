import { gql } from "graphql-request";

// Add the correct query here
export const placeOrderEvents = gql`
  query GetOrderHistory {
    placeOrderEvents {
      items {
        volume
        user
        timestamp
        tick
        remaining_volume
        order_index
        is_market
        is_buy
        id
      }
    }
  }
`;

export const ticks = gql`
  query GetAllTicks {
    ticks(where: {volume_gt: "0"}) {
    items {
      id
      is_buy
      tick
      volume
      timestamp
      }
    }
  }
`;

export const askTicks = gql`
  query GetAllTicks {
     ticks(
    where: {volume_gt: "0", is_buy: false}
    limit: 5
    orderBy: "tick"
    orderDirection: "-1"
  ) {
    items {
      id
      is_buy
      tick
      volume
      timestamp
    }
  }
  }
`;


export const bidTicks = gql`
  query GetAllTicks {
     ticks(
    where: {volume_gt: "0", is_buy: true}
    limit: 5
    orderBy: "tick"
    orderDirection: "1"
  ) {
    items {
      id
      is_buy
      tick
      volume
      timestamp
    }
  }
  }
`;

export const setCurrentTickEvents = gql`
  query setCurrentTickEvents {
    setCurrentTickEvents(orderBy: "timestamp", orderDirection: "-1") {
      items {
        id
        tick
        timestamp
      }
    }
  }
`;

export const matchOrderEvents = gql`
  query GetMatchOrders {
    matchOrderEvents {
      items {
        id
        is_buy
        is_market
        order_index
        tick
        timestamp
        user
        volume
      }
    }
  }
`;