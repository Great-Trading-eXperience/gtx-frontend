import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users, Activity } from 'lucide-react';
import { analyticsAPI } from '@/lib/analytics-api';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  value: number;
  percentage?: number;
  metadata?: {
    trades?: number;
    volume?: number;
    [key: string]: any;
  };
}

interface LeaderboardProps {
  className?: string;
}

type TimePeriod = '24h' | '7d' | '30d';
type LeaderboardType = 'pnl' | 'volume' | 'trades';

export const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const [activeType, setActiveType] = useState<LeaderboardType>('pnl');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('24h');
  const [pnlData, setPnlData] = useState<LeaderboardEntry[]>([]);
  const [volumeData, setVolumeData] = useState<LeaderboardEntry[]>([]);
  const [tradesData, setTradesData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatUserId = (userId: string) => {
    if (userId.length > 10) {
      return `${userId.substring(0, 6)}...${userId.substring(userId.length - 4)}`;
    }
    return userId;
  };

  const formatValue = (value: number, type: LeaderboardType) => {
    switch (type) {
      case 'pnl':
        // Handle Wei conversion for PnL values (divide by 10^18 if value is very large)
        let pnlValue = value;
        if (Math.abs(value) > 1e15) {
          pnlValue = value / 1e18; // Convert from Wei to ETH equivalent
        }
        
        // Format large numbers with K, M, B suffixes
        if (Math.abs(pnlValue) >= 1e9) {
          return (pnlValue >= 0 ? '+' : '') + (pnlValue / 1e9).toFixed(2) + 'B';
        } else if (Math.abs(pnlValue) >= 1e6) {
          return (pnlValue >= 0 ? '+' : '') + (pnlValue / 1e6).toFixed(2) + 'M';
        } else if (Math.abs(pnlValue) >= 1e3) {
          return (pnlValue >= 0 ? '+' : '') + (pnlValue / 1e3).toFixed(2) + 'K';
        } else {
          return (pnlValue >= 0 ? '+' : '') + pnlValue.toFixed(4);
        }
      case 'volume':
        // Handle Wei conversion for volume values
        let volumeValue = value;
        if (value > 1e15) {
          volumeValue = value / 1e18; // Convert from Wei
        }
        
        if (volumeValue >= 1e9) {
          return (volumeValue / 1e9).toFixed(2) + 'B';
        } else if (volumeValue >= 1e6) {
          return (volumeValue / 1e6).toFixed(2) + 'M';
        } else if (volumeValue >= 1e3) {
          return (volumeValue / 1e3).toFixed(2) + 'K';
        } else {
          return volumeValue.toFixed(2);
        }
      case 'trades':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const getValueColor = (value: number, type: LeaderboardType) => {
    if (type === 'pnl') {
      return value >= 0 ? 'text-green-500' : 'text-red-500';
    }
    return 'text-blue-500';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '#1';
      case 2:
        return '#2';
      case 3:
        return '#3';
      default:
        return `#${rank}`;
    }
  };

  const loadLeaderboardData = async (type: LeaderboardType, period: TimePeriod) => {
    try {
      setIsLoading(true);
      setError(null);

      let data: LeaderboardEntry[] = [];
      
      switch (type) {
        case 'pnl':
          data = await analyticsAPI.getPNLLeaderboard(period, 50);
          setPnlData(data);
          break;
        case 'volume':
          data = await analyticsAPI.getVolumeLeaderboard(period, 50);
          setVolumeData(data);
          break;
        case 'trades':
          data = await analyticsAPI.getTradesLeaderboard(period, 50);
          setTradesData(data);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${type} leaderboard:`, error);
      setError(`Failed to load ${type} leaderboard. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData(activeType, activePeriod);
  }, [activeType, activePeriod]);

  const getCurrentData = () => {
    switch (activeType) {
      case 'pnl':
        return pnlData;
      case 'volume':
        return volumeData;
      case 'trades':
        return tradesData;
      default:
        return [];
    }
  };

  const getLeaderboardTitle = (type: LeaderboardType) => {
    switch (type) {
      case 'pnl':
        return 'PnL Leaders';
      case 'volume':
        return 'Volume Leaders';
      case 'trades':
        return 'Most Active Traders';
      default:
        return 'Leaderboard';
    }
  };

  const getLeaderboardIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'pnl':
        return <Trophy className="h-5 w-5" />;
      case 'volume':
        return <TrendingUp className="h-5 w-5" />;
      case 'trades':
        return <Activity className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <Card className="bg-[#0a0a0a] border border-red-900/30 rounded-xl shadow-lg shadow-red-900/20 relative overflow-hidden">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-900/20 via-red-800/10 to-red-900/20 opacity-60" />
          <CardContent className="flex items-center justify-center p-8 relative z-10">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button 
                onClick={() => loadLeaderboardData(activeType, activePeriod)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div>
          <h1 className="text-5xl font-bold mb-3 text-white flex items-center gap-3">
            Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">View top performing traders and trading statistics</p>
        </div>
        
        {/* Time Period Selector */}
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
          {(['24h', '7d', '30d'] as TimePeriod[]).map((period) => (
            <Button
              key={period}
              variant={activePeriod === period ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activePeriod === period 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {period.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pnl" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            PnL
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeType} className="mt-6">
          <Card className="bg-[#0a0a0a] border border-blue-900/30 rounded-xl shadow-lg shadow-blue-900/20 relative overflow-hidden hover:border-blue-500/50 hover:scale-[1.01] transition-all duration-500 group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-gray-300">
                {getLeaderboardIcon(activeType)}
                {getLeaderboardTitle(activeType)} - {activePeriod.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : getCurrentData().length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No data available for this period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getCurrentData().map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.rank}`}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800',
                        entry.rank <= 3 && 'bg-gradient-to-r from-blue-50 to-gray-50 dark:from-blue-900/20 dark:to-gray-900/20 border border-blue-200 dark:border-blue-800'
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 font-bold">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{formatUserId(entry.userId)}</p>
                          {entry.metadata && (
                            <p className="text-xs text-gray-500">
                              {entry.metadata.trades && `${entry.metadata.trades} trades`}
                              {entry.metadata.volume && ` • ${entry.metadata.volume.toLocaleString()} volume`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn('font-bold', getValueColor(entry.value, activeType))}>
                          {formatValue(entry.value, activeType)}
                        </p>
                        {entry.percentage !== undefined && (
                          <p className="text-xs text-gray-500">
                            {entry.percentage > 0 ? '+' : ''}{entry.percentage.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;