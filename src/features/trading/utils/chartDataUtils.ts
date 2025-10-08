import { formatUnits } from 'viem';
import { type CandlestickData, type Time } from 'lightweight-charts';
import { BucketData } from '@/hooks/useCandlestickData';

export interface VolumeData {
  time: Time;
  value: number;
  color: string;
}

export interface ProcessedChartData {
  candlesticks: CandlestickData<Time>[];
  volumes: VolumeData[];
}

export const formatPrice = (price: number, decimals: number): string => {
  return Number(formatUnits(BigInt(price), decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const processCandleStickData = (
  data: BucketData[],
  quoteDecimals: number
): ProcessedChartData => {
  const candlesticks: CandlestickData<Time>[] = [];
  const volumes: VolumeData[] = [];

  data.forEach(candle => {
    const openPrice = Number(formatUnits(BigInt(candle.open), quoteDecimals));
    const closePrice = Number(formatUnits(BigInt(candle.close), quoteDecimals));
    const lowPrice = Number(formatUnits(BigInt(candle.low), quoteDecimals));
    const highPrice = Number(formatUnits(BigInt(candle.high), quoteDecimals));

    candlesticks.push({
      time: candle.openTime as Time,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
    });

    const volumeValue = candle.volume !== undefined ? candle.volume : candle.count;

    volumes.push({
      time: candle.openTime as Time,
      value: volumeValue,
      color:
        closePrice >= openPrice ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    });
  });

  return { candlesticks, volumes };
};

export const sortCandleData = (data: BucketData[]): BucketData[] => {
  // Check if data is already sorted to avoid unnecessary sorting
  if (data.length <= 1) return data;

  let isSorted = true;
  for (let i = 1; i < data.length; i++) {
    const prevTime = data[i - 1].openTime || data[i - 1].timestamp;
    const currentTime = data[i].openTime || data[i].timestamp;
    if (Number(prevTime) > Number(currentTime)) {
      isSorted = false;
      break;
    }
  }

  if (isSorted) return data;

  return [...data].sort((a, b) => {
    const aTime = a.openTime || a.timestamp;
    const bTime = b.openTime || b.timestamp;
    return Number(aTime) - Number(bTime);
  });
};

export const getLatestPrice = (
  candlesticks: CandlestickData<Time>[],
  quoteDecimals: number
): string | null => {
  if (!candlesticks.length) return null;

  const latestCandle = [...candlesticks].sort(
    (a, b) => Number(b.time) - Number(a.time)
  )[0];

  return latestCandle
    ? latestCandle.close.toFixed(quoteDecimals > 8 ? 8 : quoteDecimals)
    : null;
};
