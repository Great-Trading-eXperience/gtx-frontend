import { gql } from 'graphql-request';

export const minuteCandleStickQuery = gql`
  query GetMinuteCandleStick($poolId: String!) {
    minuteBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        average
        chainId
        close
        closeTime
        count
        high
        id
        low
        open
        openTime
        poolId
        takerBuyQuoteVolume
        volume
        takerBuyBaseVolume
        quoteVolume
      }
    }
  }
`;

export const fiveMinuteCandleStickQuery = gql`
  query GetFiveMinuteCandleStick($poolId: String!) {
    fiveMinuteBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        volume
        takerBuyQuoteVolume
        takerBuyBaseVolume
        quoteVolume
        poolId
        openTime
        open
        low
        id
        high
        count
        closeTime
        close
        chainId
        average
      }
    }
  }
`;

export const thirtyMinuteCandleStickQuery = gql`
  query GetThirtyMinuteCandleStick($poolId: String!) {
    thirtyMinuteBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        volume
        takerBuyQuoteVolume
        takerBuyBaseVolume
        quoteVolume
        poolId
        openTime
        open
        low
        id
        high
        count
        closeTime
        close
        chainId
        average
      }
    }
  }
`;

export const hourCandleStickQuery = gql`
  query GetHourCandleStick($poolId: String!) {
    hourBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        average
        chainId
        close
        closeTime
        count
        high
        id
        low
        open
        openTime
        poolId
        quoteVolume
        takerBuyBaseVolume
        takerBuyQuoteVolume
        volume
      }
    }
  }
`;

export const dailyCandleStickQuery = gql`
  query GetDailyCandleStick($poolId: String!) {
    dailyBucketss(
      where: { poolId: $poolId }
      orderBy: "openTime"
      orderDirection: "asc"
      limit: 1000
    ) {
      items {
        volume
        takerBuyQuoteVolume
        takerBuyBaseVolume
        quoteVolume
        poolId
        openTime
        open
        low
        id
        high
        count
        closeTime
        close
        average
      }
    }
  }
`;
