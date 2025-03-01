import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, Time, IChartApi, CandlestickData } from 'lightweight-charts';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import request from 'graphql-request';

import { formatUnits } from 'viem';
import { calculatePrice } from '../../helper';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { matchOrderEvents } from '@/graphql/liquidbook/liquidbook.query';

const formatVolume = (value: bigint, decimals: number = 6) => {
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    
    const config = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    
    if (num >= 1e9) {
        return (num / 1e9).toLocaleString('en-US', config) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toLocaleString('en-US', config) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toLocaleString('en-US', config) + 'K';
    } else {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    }
};

interface VolumeData {
    time: Time;
    value: number;
    color: string;
}

interface MatchOrderEvent {
    id: string;
    tick: string;
    timestamp: number;
    volume: string;
}

interface MatchOrderEventResponse {
    matchOrderEvents: {
        items: MatchOrderEvent[];
    }
}

function processTickData(data: MatchOrderEvent[]): {
    candlesticks: CandlestickData<Time>[];
    volumes: VolumeData[];
} {
    const candlesticks: CandlestickData<Time>[] = [];
    const volumes: VolumeData[] = [];
    
    for (let i = 0; i < data.length; i++) {
        const currentPrice = calculatePrice(data[i].tick);
        let open, high, low, close;
        
        if (i === 0) {
            open = high = low = close = currentPrice;
        } else {
            const previousPrice = calculatePrice(data[i - 1].tick);
            open = previousPrice;
            close = currentPrice;
            high = Math.max(open, close);
            low = Math.min(open, close);
        }

        const candlestick = {
            time: data[i].timestamp as Time,
            open,
            high,
            low,
            close
        };
        candlesticks.push(candlestick);

        // Use real volume data
        const volumeValue = parseFloat(formatUnits(BigInt(data[i].volume), 6));
        volumes.push({
            time: data[i].timestamp as Time,
            value: volumeValue,
            color: close >= open ? '#26a69a' : '#ef5350'
        });
    }

    return { candlesticks, volumes };
}

function filterUniqueTimestamps(data: MatchOrderEvent[]) {
    const uniqueMap = new Map();
    data.forEach((item) => {
        if (!uniqueMap.has(item.timestamp)) {
            uniqueMap.set(item.timestamp, item);
        }
    });
    return Array.from(uniqueMap.values());
}

const TradingChart: React.FC = () => {
    const [queryClient] = useState(() => new QueryClient());
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const { theme } = useTheme();
    
    const { data, isLoading, error } = useQuery<MatchOrderEventResponse>({
        queryKey: ['tickEvents'],
        queryFn: async () => {
            return await request(GTX_GRAPHQL_URL, matchOrderEvents);
        },
        refetchInterval: 500,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!chartContainerRef.current || isLoading || !data) return;

        const isDarkMode = theme === 'dark';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                textColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                background: { type: ColorType.Solid, color: isDarkMode ? '#151924' : '#ffffff' },
            },
            grid: {
                vertLines: { color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)' },
                horzLines: { color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)' },
            },
            timeScale: {
                borderColor: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
            },
            rightPriceScale: {
                borderColor: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.35,
                },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: isDarkMode ? '#758696' : '#9B9B9B',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: isDarkMode ? '#758696' : '#9B9B9B',
                },
                horzLine: {
                    color: isDarkMode ? '#758696' : '#9B9B9B',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: isDarkMode ? '#758696' : '#9B9B9B',
                },
            },
            height: 600
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'custom',
                minMove: 0.01,
                formatter: (price: number) => {
                    if (price >= 1000000) return `${(price / 1000000).toFixed(2)}M`;
                    if (price >= 1000) return `${(price / 1000).toFixed(2)}K`;
                    return price.toFixed(2);
                }
            },
            priceScaleId: 'volume'
        });

        // Configure volume price scale
        const volumePriceScale = chart.priceScale('volume');
        if (volumePriceScale) {
            volumePriceScale.applyOptions({
                autoScale: true,
                visible: true,
                scaleMargins: {
                    top: 0.7,
                    bottom: 0,
                }
            });
        }

        // Process and set data
        if (data?.matchOrderEvents?.items) {
            const sortedItems = [...data.matchOrderEvents.items].sort(
                (a, b) => a.timestamp - b.timestamp
            );
            
            const uniqueItems = filterUniqueTimestamps(sortedItems);
            const { candlesticks, volumes } = processTickData(uniqueItems);
            
            candlestickSeries.setData(candlesticks);
            volumeSeries.setData(volumes);
            
            chart.timeScale().fitContent();
            chart.timeScale().scrollToPosition(5, false);
        }

        const handleResize = () => {
            chart.applyOptions({ 
                height: chartContainerRef.current?.clientHeight || 600,
                width: chartContainerRef.current?.clientWidth || 800
            });
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, isLoading, theme]);

    // Update theme
    useEffect(() => {
        if (chartRef.current) {
            const isDarkMode = theme === 'dark';
            chartRef.current.applyOptions({
                layout: {
                    textColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    background: { type: ColorType.Solid, color: isDarkMode ? '#151924' : '#ffffff' },
                },
                grid: {
                    vertLines: { color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)' },
                    horzLines: { color: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)' },
                },
                timeScale: {
                    borderColor: isDarkMode ? 'rgba(42, 46, 57, 0.6)' : 'rgba(42, 46, 57, 0.2)',
                },
            });
        }
    }, [theme]);

    if (isLoading) {
        return (
            <div className="w-full h-screen bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen bg-white dark:bg-[#151924] text-gray-900 dark:text-white flex items-center justify-center">
                Error: {error.toString()}
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div className="w-full h-screen bg-white dark:bg-[#151924] text-gray-900 dark:text-white">
                <div className="w-full p-4">
                    <div ref={chartContainerRef} className="w-full h-[600px]" />
                </div>
            </div>
        </QueryClientProvider>
    );
};

export default TradingChart;