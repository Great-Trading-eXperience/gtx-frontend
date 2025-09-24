'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';

import { TimeFrame } from '@/lib/enums/clob.enum';
import { useMarketStore } from '@/store/market-store';
import TradingViewChartContainer, {
  TradingPair,
} from '@/_components/trading-view-chart/trading-view-chart';

import { ChartComponentProps } from '../../types/chart.types';

import ChartSkeleton from './chart-skeleton';
import TimeFrameSelector from './time-frame-selector';

// Custom hooks
import { useCandlestickData } from '../../hooks/chart/useCandlestickData';
import { useProcessedChartData } from '../../hooks/chart/useProcessedChartData';

// Utils
import {
  getChartOptions,
  getCandlestickSeriesOptions,
  getVolumeSeriesOptions,
  getVolumePriceScaleOptions,
} from '../../utils/chartConfig';

function ChartComponent({
  chainId,
  defaultChainId,
  selectedPool,
  poolsData,
  poolsLoading,
  poolsError,
  height = 380,
}: ChartComponentProps) {
  // State
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.HOURLY);
  const [availablePairs, setAvailablePairs] = useState<TradingPair[]>();
  const [currentTime, setCurrentTime] = useState('');

  // Refs for chart management
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const isChartInitializedRef = useRef(false);

  // Hooks
  const { theme } = useTheme();
  const { quoteDecimals } = useMarketStore();

  const { data, isLoading, error } = useCandlestickData({
    chainId,
    defaultChainId,
    selectedTimeFrame,
    poolId: selectedPool?.orderBook,
  });

  const { processedData, currentPrice } = useProcessedChartData({
    data,
    quoteDecimals,
  });

  // Memoized available pairs to prevent unnecessary recalculations
  const memoizedAvailablePairs = useMemo(() => {
    if (!poolsData || poolsData.length === 0) return [];

    return poolsData.map(pool => ({
      symbol: `${pool.baseSymbol}/${pool.quoteSymbol}`,
      baseAsset: pool.baseSymbol,
      quoteAsset: pool.quoteSymbol,
      displayName: `${pool.baseSymbol}/${pool.quoteSymbol}`,
    }));
  }, [poolsData]);

  // Update available pairs only when memoized value changes
  useEffect(() => {
    setAvailablePairs(memoizedAvailablePairs);
  }, [memoizedAvailablePairs]);

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height || chartContainerRef.current.clientHeight,
        });
      }
    };

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
  }, [height]);

  // Initialize chart only once
  useEffect(() => {
    if (!chartContainerRef.current || isChartInitializedRef.current) return;

    const chartOptions = getChartOptions(theme, height);
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Create series once
    const candlestickSeries = chart.addCandlestickSeries(getCandlestickSeriesOptions());
    const volumeSeries = chart.addHistogramSeries(getVolumeSeriesOptions());

    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Configure volume scale
    const volumePriceScale = chart.priceScale('');
    volumePriceScale.applyOptions(getVolumePriceScaleOptions());

    // Add resize listener with debouncing
    const resizeHandler = debouncedResize();
    window.addEventListener('resize', resizeHandler);

    isChartInitializedRef.current = true;

    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
        isChartInitializedRef.current = false;
      }
    };
  }, [theme, height, debouncedResize]);

  // Update chart data separately from chart creation
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    if (!processedData.candlesticks.length) return;

    // Update data without recreating chart
    candlestickSeriesRef.current.setData(processedData.candlesticks);
    volumeSeriesRef.current.setData(processedData.volumes);

    // Fit content only when data changes significantly
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [processedData]);

  // Update theme options separately
  useEffect(() => {
    if (!chartRef.current) return;

    const chartOptions = getChartOptions(theme, height);
    chartRef.current.applyOptions({
      layout: chartOptions.layout,
      grid: chartOptions.grid,
      timeScale: chartOptions.timeScale,
      rightPriceScale: chartOptions.rightPriceScale,
      crosshair: chartOptions.crosshair,
    });
  }, [theme]);

  // Update height separately
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    chartRef.current.applyOptions({
      height: height || chartContainerRef.current.clientHeight,
    });
  }, [height]);

  // Time update with cleanup
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString());
    };

    const timer = setInterval(updateTime, 1000);
    updateTime(); // Initial call

    return () => clearInterval(timer);
  }, []);

  // Memoized event handler to prevent unnecessary re-renders
  const handleTimeFrameChange = useCallback((timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
  }, []);

  // Render loading state
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
        Error: {error?.message || String(error) || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black border border-white/20 rounded-b-lg">
      {!selectedPool?.coin && (
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold">
            {currentPrice && <span>{currentPrice}</span>}
          </div>
          <TimeFrameSelector
            selectedTimeFrame={selectedTimeFrame}
            onTimeFrameChange={handleTimeFrameChange}
          />
        </div>
      )}

      <div className="p-2 h-full">
        {selectedPool?.coin ? (
          <TradingViewChartContainer
            chainId={chainId}
            symbol={selectedPool?.coin}
            availablePairs={availablePairs}
          />
        ) : (
          <div ref={chartContainerRef} className="w-full" style={{ height }} />
        )}
      </div>
    </div>
  );
}

export default ChartComponent;
