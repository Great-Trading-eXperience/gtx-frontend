import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { TimeFrame } from '../../types/chart.types';
import {
  minuteCandleStickQuery,
  fiveMinuteCandleStickQuery,
  thirtyMinuteCandleStickQuery,
  hourCandleStickQuery,
  dailyCandleStickQuery,
} from '../../graphql/chart.query';
import {
  CandleStickItem,
  MinuteCandleStickResponse,
  FiveMinuteCandleStickResponse,
  ThirtyMinuteCandleStickResponse,
  HourCandleStickResponse,
  DailyCandleStickResponse,
} from '../../graphql/chart.types';

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
  const query = useQuery<CandleStickItem[]>({
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

  return {
    ...query,
    refetch: query.refetch,
  };
};

const getQueryByTimeFrame = (timeFrame: TimeFrame) => {
  switch (timeFrame) {
    case TimeFrame.MINUTE:
      return minuteCandleStickQuery;
    case TimeFrame.FIVE_MINUTE:
      return fiveMinuteCandleStickQuery;
    case TimeFrame.THIRTY_MINUTE:
      return thirtyMinuteCandleStickQuery;
    case TimeFrame.HOURLY:
      return hourCandleStickQuery;
    case TimeFrame.DAILY:
      return dailyCandleStickQuery;
    default:
      return fiveMinuteCandleStickQuery;
  }
};

const extractItemsFromResponse = (result: any, timeFrame: TimeFrame) => {
  switch (timeFrame) {
    case TimeFrame.MINUTE:
      return (result as MinuteCandleStickResponse).minuteBucketss.items;
    case TimeFrame.FIVE_MINUTE:
      return (result as FiveMinuteCandleStickResponse).fiveMinuteBucketss.items;
    case TimeFrame.THIRTY_MINUTE:
      return (result as ThirtyMinuteCandleStickResponse).thirtyMinuteBucketss.items;
    case TimeFrame.HOURLY:
      return (result as HourCandleStickResponse).hourBucketss.items;
    case TimeFrame.DAILY:
      return (result as DailyCandleStickResponse).dailyBucketss.items;
    default:
      return [];
  }
};
