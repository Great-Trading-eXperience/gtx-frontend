import { useState, useEffect, useCallback } from 'react';

interface UseAnalyticsDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseAnalyticsDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ANALYTICS_API_BASE = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:42090';

export default function useAnalyticsData<T = any>(
  endpoint: string,
  options: UseAnalyticsDataOptions = {}
): UseAnalyticsDataResult<T> {
  const { refreshInterval, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`${ANALYTICS_API_BASE}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out');
        } else if (err.message.includes('fetch')) {
          setError('Unable to connect to analytics service');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}