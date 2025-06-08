import { NextRequest, NextResponse } from 'next/server';
import { apiGet } from '@/lib/api-client';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';


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
    // Get the address from the URL
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId') || DEFAULT_CHAIN;

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    // Log incoming request
    debugLog(`[${requestId}] All Orders Request:`, {
      timestamp: new Date().toISOString(),
      address,
    });

    // Forward the request to the actual API endpoint
    const endpoint = `/api/allOrders?address=${encodeURIComponent(address)}`;
    
    debugLog(`[${requestId}] Using chain ID:`, chainId);
    
    debugLog(`[${requestId}] Forwarding to API endpoint:`, endpoint);
    
    const data = await apiGet(chainId, endpoint);
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    debugLog(`[${requestId}] All Orders Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: 200,
      address,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    debugError('All Orders proxy error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
