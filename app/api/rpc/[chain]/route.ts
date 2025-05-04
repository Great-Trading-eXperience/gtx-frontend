import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { chain: string } }) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { chain } = params;
    const body = await request.json();

    // Log incoming request
    console.log(`[${requestId}] RPC Request:`, {
      timestamp: new Date().toISOString(),
      chain,
      method: body.method,
      params: body.params,
      id: body.id
    });

    // Get the RPC URL based on chain parameter
    const rpcUrl = getRpcUrl(chain);
    if (!rpcUrl) {
      console.error(`[${requestId}] Invalid chain:`, chain);
      return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
    }

    // Forward the request to the actual RPC endpoint
    console.log(`[${requestId}] Forwarding to RPC endpoint:`, rpcUrl);
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const requestDuration = Date.now() - requestStartTime;

    // Log response
    console.log(`[${requestId}] RPC Response:`, {
      timestamp: new Date().toISOString(),
      duration: `${requestDuration}ms`,
      status: response.status,
      chain,
      method: body.method,
      success: !data.error,
      error: data.error
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get RPC URL for a given chain
function getRpcUrl(chain: string): string | null {
  const rpcUrls: Record<string, string> = {
    'pharos': 'https://devnet.dplabs-internal.com',
    'gtxpresso': 'https://rpc.gtx.alwaysbedream.dev',
    'gtx': 'https://anvil.gtxdex.xyz',
    'rise-sepolia': 'https://testnet.riselabs.xyz',
    'conduit': 'https://odyssey.ithaca.xyz',
    'monad': 'https://testnet-rpc.monad.xyz',
  };

  return rpcUrls[chain] || null;
}