import { ColorType } from 'lightweight-charts';

// Memoized chart options to prevent unnecessary recreations
const chartOptionsCache = new Map<string, any>();

export const getChartOptions = (theme: string | undefined, height: number) => {
  const cacheKey = `${theme}-${height}`;

  if (chartOptionsCache.has(cacheKey)) {
    return chartOptionsCache.get(cacheKey);
  }

  const options = {
    layout: {
      textColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
      background: {
        type: ColorType.Solid,
        color: theme === 'dark' ? '#151924' : '#ffffff',
      },
    },
    grid: {
      vertLines: {
        color: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
      },
      horzLines: {
        color: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
      },
    },
    timeScale: {
      borderColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    },
    crosshair: {
      mode: 1,
      vertLine: {
        color: theme === 'dark' ? '#758696' : '#9B9B9B',
        width: 1,
        style: 3,
        labelBackgroundColor: theme === 'dark' ? '#758696' : '#9B9B9B',
      },
      horzLine: {
        color: theme === 'dark' ? '#758696' : '#9B9B9B',
        width: 1,
        style: 3,
        labelBackgroundColor: theme === 'dark' ? '#758696' : '#9B9B9B',
      },
    },
    height,
  };

  chartOptionsCache.set(cacheKey, options);
  return options;
};

// Static options that never change - create once
export const getCandlestickSeriesOptions = (() => {
  const options = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  };
  return () => options;
})();

export const getVolumeSeriesOptions = (() => {
  const options = {
    color: '#26a69a',
    priceFormat: {
      type: 'volume' as const,
    },
    priceScaleId: '',
  };
  return () => options;
})();

export const getVolumePriceScaleOptions = (() => {
  const options = {
    scaleMargins: {
      top: 0.8,
      bottom: 0,
    },
    borderVisible: false,
  };
  return () => options;
})();
