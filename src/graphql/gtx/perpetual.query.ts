import { gql } from "graphql-request";

export const pricesQuery = gql`
  query GetPrices {
    prices {
      items {
        id
        token
        price
        timestamp
        blockNumber
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

export const positionsQuery = gql`
  query GetPositions {
    positions {
      items {
        id
        account
        key
        marketToken
        collateralToken
        isLong
        collateralAmount
        sizeInTokens
        sizeInUsd
        timestamp
        blockNumber
        increasedAtTime
        decreasedAtTime
        liquidatedAtTime
        cumulativeFundingFee
        cumulativeBorrowingFee
        transactionHash
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
    orders {
      items {
        id
        key
        account
        receiver
        callbackContract
        marketToken
        initialCollateralToken
        orderType
        sizeDeltaUsd
        initialCollateralDeltaAmount
        triggerPrice
        acceptablePrice
        executionFee
        isLong
        isFrozen
        isExecuted
        isCancelled
        validFromTime
        updatedAtTime
        cancellationReceiver
        uiFeeReceiver
        timestamp
        blockNumber
        transactionHash
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

export const openInterestsQuery = gql`
  query GetOpenInterests {
    openInterests {
      items {
        id
        market
        token
        openInterest
        timestamp
        blockNumber
        transactionHash
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

export const marketsQuery = gql`
  query GetMarkets {
    markets {
      items {
        id
        marketToken
        longToken
        shortToken
        timestamp
        blockNumber
        transactionHash
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

export const liquidationsQuery = gql`
  query GetLiquidations {
    liquidations {
      items {
        id
        key
        account
        liquidator
        marketToken
        collateralToken
        collateralAmount
        liquidationPrice
        liquidationFee
        timestamp
        blockNumber
        transactionHash
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

export const fundingFeesQuery = gql`
  query GetFundingFees {
    fundingFees {
      items {
        id
        marketToken
        collateralToken
        fundingFee
        timestamp
        blockNumber
        transactionHash
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

export const depositsQuery = gql`
  query GetDeposits {
    deposits {
      items {
        id
        key
        account
        receiver
        marketToken
        initialLongToken
        initialLongTokenAmount
        initialShortToken
        initialShortTokenAmount
        executionFee
        isExecuted
        isCancelled
        updatedAtTime
        uiFeeReceiver
        timestamp
        blockNumber
        transactionHash
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