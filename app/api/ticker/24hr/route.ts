import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api-client';

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds in milliseconds

// Helper function to check if cache entry is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// Helper function for debug logging
function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

// Helper function for debug error logging
function debugError(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}

export async function GET(request: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get the symbol from the URL
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Generate cache key
    const cacheKey = `ticker-24hr-${symbol}`;

    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && isCacheValid(cachedResponse.timestamp)) {
      debugLog(`[${requestId}] Cache hit for ticker 24hr:`, { symbol });
      return NextResponse.json(cachedResponse.data);
    }

    // Log incoming request
    debugLog(`[${requestId}] Ticker 24hr Request:`, {
      timestamp: new Date().toISOString(),
      symbol,
    });

    // Forward the request to the actual API endpoint
    const endpoint = `/api/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet(endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Cache the successful response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Log response
    debugLog(`[${requestId}] Ticker 24hr Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      symbol,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('Ticker 24hr proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  for (const [key, value] of cache.entries()) {
    if (!isCacheValid(value.timestamp)) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);
