import { NextRequest, NextResponse } from 'next/server';

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds in milliseconds

// Helper function to generate cache key
function generateCacheKey(chain: string, body: any): string {
	return `${chain}-${body.method}-${JSON.stringify(body.params)}`;
}

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

export async function POST(
	request: NextRequest,
	{ params }: { params: { chain: string } }
) {
	const requestStartTime = Date.now();
	const requestId = Math.random().toString(36).substring(7);

	try {
		const { chain } = params;
		const body = await request.json();
		const cacheKey = generateCacheKey(chain, body);

		// Check cache
		const cachedResponse = cache.get(cacheKey);
		if (cachedResponse && isCacheValid(cachedResponse.timestamp)) {
			debugLog(`[${requestId}] Cache hit for:`, {
				chain,
				method: body.method,
				params: body.params,
			});
			return NextResponse.json(cachedResponse.data);
		}

		// Log incoming request
		debugLog(`[${requestId}] RPC Request:`, {
			timestamp: new Date().toISOString(),
			chain,
			method: body.method,
			params: body.params,
			id: body.id,
		});

		// Get the RPC URL based on chain parameter
		const rpcUrl = getRpcUrl(chain);
		if (!rpcUrl) {
			debugError(`[${requestId}] Invalid chain:`, chain);
			return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
		}

		// Forward the request to the actual RPC endpoint
		debugLog(`[${requestId}] Forwarding to RPC endpoint:`, rpcUrl);
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		const requestDuration = Date.now() - requestStartTime;

		// Cache the successful response
		if (!data.error) {
			cache.set(cacheKey, {
				data,
				timestamp: Date.now(),
			});
		}

		// Log response
		debugLog(`[${requestId}] RPC Response:`, {
			timestamp: new Date().toISOString(),
			duration: `${requestDuration}ms`,
			status: response.status,
			chain,
			method: body.method,
			success: !data.error,
			error: data.error,
		});

		return NextResponse.json(data);
	} catch (error) {
		debugError('RPC proxy error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Helper function to get RPC URL for a given chain
function getRpcUrl(chain: string): string | null {
	const rpcUrls: Record<string, string> = {
		pharos: 'https://devnet.dplabs-internal.com',
		gtxpresso: 'https://rpc.gtx.alwaysbedream.dev',
		gtx: 'https://anvil.gtxdex.xyz',
		'rise-sepolia': 'https://testnet.riselabs.xyz',
		conduit: 'https://odyssey.ithaca.xyz',
		monad: 'https://testnet-rpc.monad.xyz',
	};

	return rpcUrls[chain] || null;
}

// Cleanup old cache entries periodically
setInterval(() => {
	for (const [key, value] of cache.entries()) {
		if (!isCacheValid(value.timestamp)) {
			cache.delete(key);
		}
	}
}, CACHE_TTL);
