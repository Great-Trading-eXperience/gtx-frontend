'use client';

import { useWebSocket } from '@/contexts/websocket-context';
import {
  PoolItem as GraphQLPoolItem,
  poolsPonderQuery,
  PoolsPonderResponse,
  PoolsResponse,
  TradeItem
} from '@/graphql/gtx/clob';
import {
  AccountData,
  DepthData,
  fetchAccountData,
  fetchAllOrders,
  fetchDepth,
  fetchOpenOrders,
  fetchTicker24hr,
  fetchTickerPrice,
  fetchTrades,
  OrderData,
  Ticker24hrData,
  TickerPriceData
} from '@/lib/market-api';
import { useMarketStore } from '@/store/market-store';
import { HexAddress, ProcessedPoolItem } from '@/types/gtx/clob';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { poolsQuery } from '@/graphql/gtx/clob';
import { useMarketWebSocket, useSafeUserWebSocket } from '@/hooks/use-market-websocket';
import {
  transformApiTradeToTradeItem,
  transformWebSocketTradeToTradeItem
} from '@/lib/transform-data';
import { TradeEvent } from '@/services/market-websocket';
import { getUseSubgraph } from '@/utils/env';
import request from 'graphql-request';
import MarketDataWidget from './market-widget/market-widget';
import ChartComponent from './chart/chart';
import MarketDataTabs from './market-data-tabs/market-data-tabs';
import PlaceOrder from './place-order/place-order';
import TradingHistory from './trading-history/trading-history';

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

export type ClobDexComponentProps = {
  address?: HexAddress;
  chainId: number;
  defaultChainId: number;
  selectedPool?: ProcessedPoolItem;
};

export default function ClobDex() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const defaultChainId = Number(DEFAULT_CHAIN);
  const isClient = useIsClient();
  
  const pathname = usePathname();

  const { selectedPoolId, setSelectedPoolId, setBaseDecimals, setQuoteDecimals } = useMarketStore();
  const [mounted, setMounted] = useState(false);
  const [selectedPool, setSelectedPool] = useState<ProcessedPoolItem>();
  const [previousConnectionState, setPreviousConnectionState] = useState(isConnected);

  // WebSocket context
  const { connectionState, isReconnected, resetReconnectedFlag } = useWebSocket();

  // WebSocket data states
  const [depthData, setDepthData] = useState<DepthData | null>(null);
  const [tickerPrice, setTickerPrice] = useState<TickerPriceData | null>(null);
  const [ticker24hr, setTicker24hr] = useState<Ticker24hrData>();
  const [transformedWsTrades, setTransformedWsTrades] = useState<TradeItem[]>([]);
  const [transformedTrades, setTransformedTrades] = useState<TradeItem[]>([]);
  const [userTrades, setUserTrades] = useState<TradeItem[]>([]);
  const [wsOpenOrders, setWsOpenOrders] = useState<OrderData[]>([]);

  const combinedTrades = useMemo(() => {
    const combined = [...transformedTrades];

    transformedWsTrades.forEach(wsTrade => {
      if (!combined.some(apiTrade => apiTrade.id === wsTrade.id)) {
        combined.unshift(wsTrade);
      }
    });

    const uniqueTradesMap = new Map();
    combined.forEach(trade => {
      if (!uniqueTradesMap.has(trade.id)) {
        uniqueTradesMap.set(trade.id, trade);
      }
    });

    const uniqueTrades = Array.from(uniqueTradesMap.values());

    return uniqueTrades.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [transformedTrades, transformedWsTrades]);

  // State for API data loading
  const [isLoadingTickerPrice, setIsLoadingTickerPrice] = useState(false);
  const [isLoadingTicker24hr, setIsLoadingTicker24hr] = useState(false);
  const [isLoadingApiTrades, setIsLoadingApiTrades] = useState(false);

  // Get the trading pair symbol from the selected pool
  const [symbol, setSymbol] = useState<string>('')

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            staleTime: 5000,
          },
        },
      })
  );

  const {
    data: poolsData,
    isLoading: poolsLoading,
    error: poolsError,
  } = useQuery<PoolsResponse | PoolsPonderResponse>({
    queryKey: ['pools', String(chainId ?? defaultChainId)],
    queryFn: async () => {
      const currentChainId = Number(chainId ?? defaultChainId);
      const url = GTX_GRAPHQL_URL(currentChainId);
      if (!url) throw new Error('GraphQL URL not found');
      return await request(url, getUseSubgraph() ? poolsQuery : poolsPonderQuery);
    },
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const {
    lastMessage: depthMessage,
    isConnected: isDepthConnected,
    connect: connectDepthWebSocket,
  } = useMarketWebSocket(chainId, 'depth', symbol);

  const {
    lastMessage: tradesMessage,
    isConnected: isTradesConnected,
    connect: connectTradesWebSocket,
  } = useMarketWebSocket(chainId, 'trade', symbol);

  const {
    lastMessage: tickerMessage,
    isConnected: isTickerConnected,
    connect: connectTickerWebSocket,
  } = useMarketWebSocket(chainId, 'miniTicker', symbol);

  const {
    lastMessage: userMessage,
    isConnected: isUserConnected,
    connectedAddress,
    connectedChainId,
    connect: connectUserWebSocket,
  } = useSafeUserWebSocket(address, chainId);

  const fetchInitialDepthData = useCallback(async () => {
    if (selectedPool) {
      const data = await fetchDepth(selectedPool.coin);
      if (data) {
        setDepthData(data);
      }
    }
  }, [selectedPool]);

  const fetchInitialTradesData = useCallback(async () => {
    if (selectedPool) {
      try {
        setIsLoadingApiTrades(true);
        const data = await fetchTrades(selectedPool.coin);

        if (data) {
          const transformed = transformApiTradeToTradeItem(data, selectedPool.id, selectedPool.coin);
          setTransformedTrades(transformed);
        }
      } catch (error) {
        console.error('Error fetching general trades data:', error);
      } finally {
        setIsLoadingApiTrades(false);
      }
    }
  }, [selectedPool]);

  const fetchUserTradesData = useCallback(async () => {
    if (selectedPool && address) {
      try {
        const userData = await fetchTrades(selectedPool.coin, 500, address);
        if (userData) {
          const transformedUserData = transformApiTradeToTradeItem(userData, selectedPool.id, selectedPool.coin);

          const uniqueTradesMap = new Map();
          transformedUserData.forEach(trade => {
            uniqueTradesMap.set(trade.id, trade);
          });

          const uniqueUserTrades = Array.from(uniqueTradesMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);

          setUserTrades(uniqueUserTrades);
        }
      } catch (error) {
        console.error('Error fetching user trades data:', error);
      }
    }
  }, [selectedPool, address]);

  const {
    data: marketAllOrdersData,
    isLoading: marketAllOrdersLoading,
    error: marketAllOrdersError,
    refetch: refetchAllOrders
  } = useQuery<OrderData[]>({
    queryKey: ['marketAllOrders', address, selectedPool?.baseSymbol, selectedPool?.quoteSymbol],
    queryFn: async () => {
      if (!address) return [];
      return await fetchAllOrders(address);
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const {
    data: marketOpenOrdersData,
    isLoading: marketOpenOrdersLoading,
    error: marketOpenOrdersError,
    refetch: refetchOpenOrders
  } = useQuery<OrderData[]>({
    queryKey: ['marketOpenOrders', address, selectedPool?.baseSymbol, selectedPool?.quoteSymbol],
    queryFn: async () => {
      if (!address) return [];
      return await fetchOpenOrders(address);
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const {
    data: marketAccountData,
    isLoading: marketAccountLoading,
    error: marketAccountError,
    refetch: refetchAccount
  } = useQuery<AccountData | null>({
    queryKey: ['marketAccount', address],
    queryFn: async () => {
      if (!address) return null;
      return await fetchAccountData(address);
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: 60000,
  });

  const transformedBalances = useMemo(() => {
    if (!marketAccountData || !poolsData) return [];

    const currencyMap = new Map<string, { address: string, decimals: number }>();

    if (poolsData) {
      const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;
      pools.forEach(pool => {
        if (pool.baseCurrency) {
          currencyMap.set(pool.baseCurrency.symbol.toLowerCase(), {
            address: pool.baseCurrency.address,
            decimals: pool.baseCurrency.decimals
          });
        }
        if (pool.quoteCurrency) {
          currencyMap.set(pool.quoteCurrency.symbol.toLowerCase(), {
            address: pool.quoteCurrency.address,
            decimals: pool.quoteCurrency.decimals
          });
        }
      });
    }

    return marketAccountData.balances.map(balance => {
      const symbol = balance.asset.toLowerCase();
      const currencyInfo = currencyMap.get(symbol) || { address: '', decimals: 18 };

      return {
        id: symbol,
        currency: {
          address: currencyInfo.address,
          name: balance.asset,
          symbol: balance.asset,
          decimals: currencyInfo.decimals
        },
        amount: balance.free,
        lockedAmount: balance.locked,
        user: ''
      };
    });
  }, [marketAccountData, poolsData]);

  const transformedOpenOrders = useMemo(() => {
    const apiOrders = marketOpenOrdersData || [];

    const orderMap = new Map();
    apiOrders.forEach(order => {
      orderMap.set(order.orderId, true);
    });

    const wsOrdersToAdd = wsOpenOrders.filter(wsOrder => !orderMap.has(wsOrder.orderId));

    return [...apiOrders, ...wsOrdersToAdd].map(order => ({
      id: order.orderId,
      chainId: Number(chainId || defaultChainId),
      poolId: order.symbol || '',
      orderId: BigInt(order.orderId),
      price: order.price,
      quantity: order.origQty,
      side: order.side,
      status: order.status,
      timestamp: Number(order.time || 0),
      transactionId: order.orderId,
      type: order.type || '',
      filled: order.executedQty || '0',
      expiry: 0
    }));
  }, [marketOpenOrdersData, wsOpenOrders, chainId, defaultChainId]);

  const tradesLoading = isLoadingApiTrades || isLoadingTickerPrice;
  const tradeHistoryLoading = false;
  const tradeHistoryError = null;

  const processPool = (pool: GraphQLPoolItem): ProcessedPoolItem => {
    const { baseCurrency, quoteCurrency, ...other } = pool;
    return {
      ...other,
      baseTokenAddress: baseCurrency.address,
      quoteTokenAddress: quoteCurrency.address,
      baseSymbol: baseCurrency.symbol,
      quoteSymbol: quoteCurrency.symbol,
      baseDecimals: baseCurrency.decimals,
      quoteDecimals: quoteCurrency.decimals,
    };
  };

  const fetchInitialTickerPrice = async () => {
    if (!symbol) return;

    try {
      setIsLoadingTickerPrice(true);
      const data = await fetchTickerPrice(symbol);
      if (data) {
        setTickerPrice(data);
      }
    } catch (error) {
      console.error('Error fetching ticker price data:', error);
    } finally {
      setIsLoadingTickerPrice(false);
    }
  };

  const fetchInitialTicker24hr = async () => {
    if (!symbol) return;

    try {
      setIsLoadingTicker24hr(true);
      const data = await fetchTicker24hr(symbol);
      if (data) {
        setTicker24hr(data);
      }
    } catch (error) {
      console.error('Error fetching 24hr ticker data:', error);
    } finally {
      setIsLoadingTicker24hr(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      connectDepthWebSocket();
      connectTradesWebSocket();
      connectTickerWebSocket();
    }
  }, [symbol]);

  useEffect(() => {
    if (chainId == connectedChainId && address == connectedAddress) {
      return;
    }

    connectUserWebSocket();
  }, [address, chainId]);

  useEffect(() => {
    if (!userMessage || !selectedPool || !address) return;

    if (userMessage && userMessage.e === 'executionReport') {
      try {
        const execReport = userMessage as any;

        const orderId = execReport.i || '';
        const status = execReport.X || '';
        const symbol = execReport.s || '';

        const updatedOrder: OrderData = {
          id: orderId,
          orderId: orderId,
          symbol: symbol,
          clientOrderId: execReport.c || '',
          price: execReport.p || '0',
          origQty: execReport.q || '0',
          executedQty: execReport.z || '0',
          status: status,
          time: execReport.E || Date.now(),
          type: execReport.o || 'LIMIT',
          side: execReport.S || 'BUY',
          updateTime: execReport.E || Date.now(),
        };

        setWsOpenOrders(prevOrders => {
          if (['FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(status)) {
            return prevOrders.filter(order => order.orderId !== orderId);
          }

          const existingOrderIndex = prevOrders.findIndex(order => order.orderId === orderId);

          if (existingOrderIndex >= 0) {
            const updatedOrders = [...prevOrders];
            updatedOrders[existingOrderIndex] = updatedOrder;
            return updatedOrders;
          } else if (status === 'NEW' || status === 'PARTIALLY_FILLED') {
            return [updatedOrder, ...prevOrders];
          }

          return prevOrders;
        });

        if (['TRADE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(status)) {
          fetchUserTradesData();

          if (status === 'TRADE' || status === 'PARTIALLY_FILLED') {
            const newUserTrade: TradeItem = {
              id: execReport.t || `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              orderId: orderId,
              poolId: selectedPool.id,
              pool: selectedPool.coin,
              price: execReport.p || '0',
              quantity: execReport.l || '0',
              timestamp: execReport.E || Date.now(),
              transactionId: execReport.t || '',
              order: {
                id: orderId,
                user: {
                  amount: '0',
                  currency: {
                    address: selectedPool.baseTokenAddress || '',
                    name: selectedPool.baseSymbol || '',
                    symbol: selectedPool.baseSymbol || '',
                    decimals: selectedPool.baseDecimals || 18
                  },
                  lockedAmount: '0',
                  symbol: selectedPool.baseSymbol || '',
                  user: address as `0x${string}`
                },
                price: execReport.p || '0',
                quantity: execReport.q || '0', // Original quantity
                side: execReport.S === 'BUY' ? 'Buy' : 'Sell',
                status: status,
                type: execReport.o || 'LIMIT',
                timestamp: execReport.E || Date.now(),
                poolId: selectedPool.id,
                orderId: orderId,
                expiry: 0,
                filled: execReport.l || '0',
                pool: {
                  coin: selectedPool.coin,
                  id: selectedPool.id,
                  lotSize: '0',
                  maxOrderAmount: '0',
                  orderBook: selectedPool.orderBook,
                  timestamp: selectedPool.timestamp,
                  baseCurrency: {
                    address: selectedPool.baseTokenAddress,
                    name: selectedPool.baseSymbol || '',
                    symbol: selectedPool.baseSymbol || '',
                    decimals: selectedPool.baseDecimals || 18
                  },
                  quoteCurrency: {
                    address: selectedPool.quoteTokenAddress,
                    name: selectedPool.quoteSymbol || '',
                    symbol: selectedPool.quoteSymbol || '',
                    decimals: selectedPool.quoteDecimals || 6
                  }
                }
              }
            };

            setUserTrades(prevUserTrades => {
              if (prevUserTrades.some(trade => trade.id === newUserTrade.id)) {
                return prevUserTrades;
              }

              if (prevUserTrades.some(trade =>
                trade.orderId === newUserTrade.orderId &&
                trade.price === newUserTrade.price &&
                Math.abs(trade.timestamp - newUserTrade.timestamp) < 1000
              )) {
                return prevUserTrades;
              }

              const updatedTrades = [newUserTrade, ...prevUserTrades];

              const uniqueTradesMap = new Map();
              updatedTrades.forEach(trade => {
                uniqueTradesMap.set(trade.id, trade);
              });

              return Array.from(uniqueTradesMap.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 50);
            });
          }
        }
      } catch (error) {
        console.error('Error processing execution report:', error);
      }
    }
  }, [userMessage, selectedPool, address]);

  useEffect(() => {
    if (!symbol) {
      return;
    }

    console.log(`Symbol updated to ${symbol}, fetching initial data...`);
    fetchInitialDepthData();
    fetchInitialTickerPrice();
    fetchInitialTicker24hr();
    fetchInitialTradesData();

    if (address) {
      fetchUserTradesData();
    }
  }, [symbol, address]);

  useEffect(() => {
    if (!depthMessage) return;

    if (depthMessage.e === 'depthUpdate') {
      if (depthData) {
        const updatedDepth = { ...depthData };

        if (depthMessage.b && depthMessage.b.length > 0) {
          const updatedBids = [...updatedDepth.bids];

          depthMessage.b.forEach(([price, quantity]) => {
            const index = updatedBids.findIndex(bid => bid[0] === price);
            if (parseFloat(quantity) === 0) {
              if (index !== -1) {
                updatedBids.splice(index, 1);
              }
            } else if (index !== -1) {
              updatedBids[index] = [price, quantity];
            } else {
              updatedBids.push([price, quantity]);
            }
          });

          updatedBids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
          updatedDepth.bids = updatedBids;
        }

        if (depthMessage.a && depthMessage.a.length > 0) {
          const updatedAsks = [...updatedDepth.asks];

          depthMessage.a.forEach(([price, quantity]) => {
            const index = updatedAsks.findIndex(ask => ask[0] === price);
            if (parseFloat(quantity) === 0) {
              if (index !== -1) {
                updatedAsks.splice(index, 1);
              }
            } else if (index !== -1) {
              updatedAsks[index] = [price, quantity];
            } else {
              updatedAsks.push([price, quantity]);
            }
          });

          updatedAsks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
          updatedDepth.asks = updatedAsks;
        }
        setDepthData(updatedDepth);
      }
    }
  }, [depthMessage]);

  useEffect(() => {
    if (!tradesMessage) return;

    if (tradesMessage.e === 'trade') {
      if (selectedPool) {
        try {
          const tradeEvent = tradesMessage as TradeEvent;
          const transformedTrade = transformWebSocketTradeToTradeItem(tradeEvent, selectedPool.id, selectedPool.coin);
          if (transformedTrade) {
            setTransformedWsTrades(prev => {
              const tradeExists = prev.some(trade => trade.id === transformedTrade.id);
              if (tradeExists) {
                return prev;
              }
              return [transformedTrade, ...prev].slice(0, 50);
            });

            setTransformedTrades(prev => {
              const tradeExists = prev.some(trade => trade.id === transformedTrade.id);
              if (tradeExists) {
                return prev;
              }

              const updatedTrades = [transformedTrade, ...prev].slice(0, 50);
              return updatedTrades;
            });
          }
        } catch (error) {
          console.error('Error transforming trade data:', error);
        }
      }
    }
  }, [tradesMessage, selectedPool]);

  useEffect(() => {
    if (!tickerMessage) return;

    if (tickerMessage.e === 'miniTicker' || tickerMessage.e === '24hrMiniTicker') {
      const ticker = tickerMessage as any;

      if (ticker.c) {
        setTickerPrice({
          symbol: ticker.s,
          price: ticker.c
        });
      }

      setTicker24hr((prevTicker24hr): Ticker24hrData | undefined => {
        if (!prevTicker24hr) return undefined;

        return {
          ...prevTicker24hr,
          lastPrice: ticker.c,
          highPrice: ticker.h || prevTicker24hr.highPrice,
          lowPrice: ticker.l || prevTicker24hr.lowPrice,
          quoteVolume: ticker.v || prevTicker24hr.volume
        };
      });
    }
  }, [tickerMessage]);

  useEffect(() => {
    if (isReconnected && selectedPool) {
      console.log('WebSocket reconnected, refetching data...');
      fetchInitialDepthData();
      fetchInitialTickerPrice();
      fetchInitialTicker24hr();
      fetchInitialTradesData();

      if (address) {
        fetchUserTradesData();
      }

      resetReconnectedFlag();
    }
  }, [isReconnected, selectedPool, address]);

  useEffect(() => {
    console.log(`WebSocket connection state: ${connectionState}`);
  }, [connectionState]);

  useEffect(() => {
    console.log(`Market WebSocket connection status - Depth: ${isDepthConnected}, Trades: ${isTradesConnected}, Ticker: ${isTickerConnected}`);
  }, [isDepthConnected, isTradesConnected, isTickerConnected]);

  useEffect(() => {
    if (address) {
      console.log(`User WebSocket connection status: ${isUserConnected}`);
    }
  }, [isUserConnected, address]);

  useEffect(() => {
    if (isReconnected && selectedPool) {
      console.log('WebSocket reconnected, refreshing all data');
      fetchInitialDepthData();
      fetchInitialTickerPrice();
      fetchInitialTicker24hr();

      if (address) {
        refetchOpenOrders();
        refetchAllOrders();
        refetchAccount();
      }

      resetReconnectedFlag();
    }
  }, [isReconnected, selectedPool, address]);

  useEffect(() => {
    if (!mounted || !poolsData) return;

    const processPools = async () => {
      const pools = 'pools' in poolsData ? poolsData.pools : poolsData.poolss.items;

      const processedPoolsArray = getUseSubgraph()
        ? pools.map(pool => processPool(pool))
        : pools.map(pool => {
          return processPool(pool);
        });

      const urlParts = pathname?.split('/') || [];
      const poolIdFromUrl = urlParts.length >= 3 ? urlParts[2] : null;

      let selectedPoolItem = processedPoolsArray.find(
        p => p.id === (poolIdFromUrl || selectedPoolId)
      );

      if (!selectedPoolItem) {
        selectedPoolItem =
          processedPoolsArray.find(
            p =>
              p.coin?.toLowerCase() === 'weth/usdc' ||
              (p.baseSymbol?.toLowerCase() === 'weth' &&
                p.quoteSymbol?.toLowerCase() === 'usdc')
          ) || processedPoolsArray[0];
      }

      if (selectedPoolItem) {
        setSelectedPoolId(selectedPoolItem.id);
        setSelectedPool(selectedPoolItem);
        setSymbol(selectedPoolItem.coin);

        setBaseDecimals(selectedPoolItem.baseDecimals ?? 18);
        setQuoteDecimals(selectedPoolItem.quoteDecimals ?? 6);
      }
    };

    processPools();
  }, [mounted, poolsData, pathname, selectedPoolId]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // useEffect(() => {
  //   if (mounted && address && selectedPool) {
  //     refetchAllOrders();
  //     refetchOpenOrders();
  //   }
  // }, [mounted, address, selectedPool]);

  useEffect(() => {
    if (mounted) {
      if (isConnected && !previousConnectionState) {
        if (address) {
          refetchAllOrders();
          refetchOpenOrders();
          refetchAccount();
        }
        return;
      }
      setPreviousConnectionState(isConnected);
    }
  }, [isConnected, previousConnectionState, mounted, address]);

  if (!isClient) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid grid-cols-[minmax(0,1fr)_320px_320px] gap-[4px] px-[2px] pt-[4px] h-fit">
        <div className="shadow-lg rounded-lg border border-gray-700/20 h-full flex flex-col">
          <MarketDataWidget
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            poolId={selectedPoolId}
            selectedPool={selectedPool}
            ticker24hr={ticker24hr}
          />
          <ChartComponent
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
          />
        </div>

        <div className="space-y-[6px] h-fit">
          <MarketDataTabs
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            poolsLoading={poolsLoading}
            poolsError={poolsError}
            depthData={depthData}
            trades={combinedTrades}
            tradesLoading={tradesLoading}
          />
        </div>

        <div className="space-y-2">
          <PlaceOrder
            address={address}
            chainId={chainId}
            defaultChainId={defaultChainId}
            selectedPool={selectedPool}
            tradesData={combinedTrades}
            tradesLoading={tradesLoading}
            depthData={depthData}
            ticker24hr={ticker24hr}
            refetchAccount={refetchAccount}
          />
        </div>
      </div>

      <TradingHistory
        address={address}
        chainId={chainId}
        defaultChainId={defaultChainId}
        balanceData={transformedBalances}
        balancesLoading={marketAccountLoading}
        balancesError={marketAccountError}
        ordersData={transformedOpenOrders}
        ordersLoading={marketOpenOrdersLoading}
        ordersError={null}
        selectedPool={selectedPool}
        userTradesData={userTrades}
        tradesLoading={tradeHistoryLoading}
        tradesError={tradeHistoryError}
        marketOpenOrdersData={marketOpenOrdersData}
        marketOpenOrdersLoading={marketOpenOrdersLoading}
        marketAllOrdersData={marketAllOrdersData}
        marketAllOrdersLoading={marketAllOrdersLoading}
        refetchFn={refetchAccount}
      />
    </QueryClientProvider>
  );
}
