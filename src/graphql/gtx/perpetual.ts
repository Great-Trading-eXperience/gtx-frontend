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
        blockNumber
        id
        longToken
        marketToken
        name
        shortToken
        timestamp
        transactionHash
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