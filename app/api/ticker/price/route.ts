import { apiGet } from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';

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
    const cacheKey = `ticker-price-${symbol}`;

    // Log incoming request
    debugLog(`[${requestId}] Ticker Price Request:`, {
      timestamp: new Date().toISOString(),
      symbol,
    });

    // Forward the request to the actual API endpoint
    const endpoint = `/api/ticker/price?symbol=${encodeURIComponent(symbol)}`;
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet<{ symbol: string; price: string }>(endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    debugLog(`[${requestId}] Ticker Price Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      symbol,
      price: data.price,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('Ticker price proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}