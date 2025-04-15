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
  query GetOrderHistory($userAddress: String!, $poolId: String) {
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

export const getCuratorVaultsQuery = gql`
  query GetCuratorVaults {
    assetVaults {
      items {
        asset
        blockNumber
        id
        name
        tvl
        token
        timestamp
        tokenName
        tokenSymbol
        transactionHash
        curator {
          blockNumber
          contractAddress
          curator
          id
          name
          timestamp
          transactionHash
          uri
        }
        allocations {
          items {
            allocation
            blockNumber
            curator
            id
            marketToken
            timestamp
            transactionHash
          }
        }
      }
    }
  }
`;

export const getCuratorVaultQuery = gql`
  query GetCuratorAssetVaultQuery($assetVault: String!) {
    assetVault(id: $assetVault) {
      asset
      blockNumber
      timestamp
      id
      name
      token
      tokenName
      transactionHash
      tokenSymbol
      tvl
      curator {
        blockNumber
        contractAddress
        curator
        id
        name
        timestamp
        transactionHash
        uri
      }
    }
  }
`;

export const getAllocationsQuery = gql`
  query GetAllocations($assetVault: String!) {
    allocations(where: {assetVault: $assetVault}) {
      items {
        allocation
        blockNumber
        curator
        id
        marketToken
        timestamp
        transactionHash
      }
    }
  }
`;

export const getCuratorVaultDepositQuerys = gql`
  query GetCuratorVaultDeposits($assetVault: String!)  {
    curatorVaultDeposits(where: {assetVault: $assetVault}) {
      items {
        blockNumber
        id
        timestamp
        shares
        transactionHash
        user
        amount
      }
    }
  }
`;

export const getCuratorVaultWithdrawQuerys = gql`
  query GetcuratorVaultWithdrawals($assetVault: String!)  {
    curatorVaultWithdrawals(where: {assetVault: $assetVault}) {
      items {
        blockNumber
        id
        timestamp
        shares
        transactionHash
        user
        amount
      }
    }
  }
`;
