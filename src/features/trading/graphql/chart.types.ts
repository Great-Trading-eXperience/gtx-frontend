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

export type MinuteCandleStickResponse = {
  minuteBucketss: {
    items: CandleStickItem[];
  };
};

export type FiveMinuteCandleStickResponse = {
  fiveMinuteBucketss: {
    items: CandleStickItem[];
  };
};

export type ThirtyMinuteCandleStickResponse = {
  thirtyMinuteBucketss: {
    items: CandleStickItem[];
  };
};

export type HourCandleStickResponse = {
  hourBucketss: {
    items: CandleStickItem[];
  };
};

export type DailyCandleStickResponse = {
  dailyBucketss: {
    items: CandleStickItem[];
  };
};