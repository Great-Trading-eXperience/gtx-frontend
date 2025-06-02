import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api-client';

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
    // Get parameters from the URL
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    if (!interval) {
      return NextResponse.json({ error: 'Interval parameter is required' }, { status: 400 });
    }

    // Log incoming request
    debugLog(`[${requestId}] Kline Request:`, {
      timestamp: new Date().toISOString(),
      symbol,
      interval,
      startTime,
      endTime,
      limit,
    });

    // Build the query string
    const queryParams = new URLSearchParams();
    if (symbol) queryParams.append('symbol', symbol);
    if (interval) queryParams.append('interval', interval);
    if (startTime) queryParams.append('startTime', startTime);
    if (endTime) queryParams.append('endTime', endTime);
    if (limit) queryParams.append('limit', limit);

    // Forward the request to the actual API endpoint
    const endpoint = `/api/kline?${queryParams.toString()}`;
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet(endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    debugLog(`[${requestId}] Kline Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      symbol,
      interval,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('Kline proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
