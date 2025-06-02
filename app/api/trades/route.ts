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
  
  // Get the symbol from the URL
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const userAddress = searchParams.get('user');
  const limit = searchParams.get('limit') || '500'; // Default to 500 trades
  
  if (!symbol) {
    debugError(`[${requestId}] Missing symbol parameter`);
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }
  
  debugLog(`[${requestId}] Processing trades request for symbol: ${symbol}`);
  
  // Check cache first
  const cacheKey = `trades:${symbol}:${limit}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    debugLog(`[${requestId}] Returning cached trades data for ${symbol}`);
    return NextResponse.json(cachedData.data);
  }
  
  try {
    // Fetch from the market API
    const apiUrl = userAddress ? `${process.env.MARKET_API_BASE_URL}/api/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}&user=${userAddress}` : `${process.env.MARKET_API_BASE_URL}/api/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
    debugLog(`[${requestId}] Fetching trades from: ${apiUrl}`);
    
    const data = await apiGet(apiUrl);
    
    // Update cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    const requestDuration = Date.now() - requestStartTime;
    debugLog(`[${requestId}] Trades request completed in ${requestDuration}ms`);
    
    return NextResponse.json(data);
  } catch (error) {
    debugError(`[${requestId}] Error fetching trades for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch trades data' },
      { status: 500 }
    );
  }
}
