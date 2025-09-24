import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import {
  dailyCandleStickPonderQuery,
  DailyCandleStickPonderResponse,
  dailyCandleStickQuery,
  DailyCandleStickResponse,
  FiveMinuteCandleStickPonderResponse,
  fiveMinuteCandleStickQuery,
  FiveMinuteCandleStickResponse,
  hourCandleStickPonderQuery,
  HourCandleStickPonderResponse,
  hourCandleStickQuery,
  HourCandleStickResponse,
  MinuteCandleStickPonderResponse,
  MinuteCandleStickResponse,
} from '@/graphql/gtx/clob';
import { TimeFrame } from '@/lib/enums/clob.enum';
import { getUseSubgraph } from '@/utils/env';

export interface BucketData {
  id: string;
  openTime: number;
  closeTime: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  average: number;
  count: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
  poolId: string;
}

interface CandleStickItem extends BucketData {}

interface UseCandlestickDataParams {
  chainId?: string | number;
  defaultChainId?: string | number;
  selectedTimeFrame: TimeFrame;
  poolId?: string;
}

export const useCandlestickData = ({
  chainId,
  defaultChainId,
  selectedTimeFrame,
  poolId,
}: UseCandlestickDataParams) => {
  return useQuery<CandleStickItem[]>({
    queryKey: ['candlesticks', selectedTimeFrame, poolId],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      
      if (!url) {
        throw new Error('GraphQL URL not found');
      }

      const query = getQueryByTimeFrame(selectedTimeFrame);
      const result = await request(url, query, { poolId });

      const items = extractItemsFromResponse(result, selectedTimeFrame);

      return (
        items?.map((item: any) => ({
          ...item,
          openTime: item.openTime || item.timestamp,
          timestamp: item.timestamp || item.openTime,
        })) || []
      );
    },
    enabled: !!poolId,
    refetchInterval: 60000,
    staleTime: 60000,
  });
};

const getQueryByTimeFrame = (timeFrame: TimeFrame) => {
  const useSubgraph = getUseSubgraph();
  
  switch (timeFrame) {
    case TimeFrame.DAILY:
      return useSubgraph ? dailyCandleStickQuery : dailyCandleStickPonderQuery;
    case TimeFrame.HOURLY:
      return useSubgraph ? hourCandleStickQuery : hourCandleStickPonderQuery;
    case TimeFrame.FIVE_MINUTE:
      return fiveMinuteCandleStickQuery;
    case TimeFrame.MINUTE:
      return fiveMinuteCandleStickQuery;
    default:
      return fiveMinuteCandleStickQuery;
  }
};

const extractItemsFromResponse = (result: any, timeFrame: TimeFrame) => {
  const useSubgraph = getUseSubgraph();

  switch (timeFrame) {
    case TimeFrame.DAILY:
      return useSubgraph
        ? (result as DailyCandleStickPonderResponse)?.dailyBucketss?.items
        : (result as DailyCandleStickResponse).dailyBuckets;
    case TimeFrame.HOURLY:
      return useSubgraph
        ? (result as HourCandleStickPonderResponse)?.hourBucketss?.items
        : (result as HourCandleStickResponse).hourBuckets;
    case TimeFrame.FIVE_MINUTE:
      return useSubgraph
        ? (result as FiveMinuteCandleStickPonderResponse)?.fiveMinuteBucketss?.items
        : (result as FiveMinuteCandleStickResponse).fiveMinuteBuckets;
    case TimeFrame.MINUTE:
      return useSubgraph
        ? (result as MinuteCandleStickPonderResponse)?.minuteBucketss?.items
        : (result as MinuteCandleStickResponse).minuteBuckets;
    default:
      return [];
  }
};