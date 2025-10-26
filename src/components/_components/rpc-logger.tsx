'use client';

import { useEffect } from 'react';

export function RPCLogger() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    let requestCount = 0;
    let rateLimitedUntil = 0;
    const MAX_REQUESTS_PER_SECOND = 10;
    const RATE_LIMIT_WINDOW = 1000;

    // Request counter reset
    const resetInterval = setInterval(() => {
      requestCount = 0;
    }, RATE_LIMIT_WINDOW);

    window.fetch = function (...args) {
      const [input, init] = args;
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url || 'unknown';
      const now = Date.now();

      // Check if we're currently rate limited
      if (now < rateLimitedUntil) {
        console.warn('[RPC-DEBUG] 🚫 Request blocked - in rate limit cooldown period');
        return Promise.reject(new Error('Rate limited - too many requests'));
      }

      // Client-side rate limiting for RPC calls
      const isRPCCall =
        url.includes('appchain.caff.testnet.espresso.network') ||
        url.includes('testnet.rpc.rarichain.org') ||
        url.includes('rpc');

      if (isRPCCall) {
        requestCount++;

        // If too many requests, add a delay
        if (requestCount > MAX_REQUESTS_PER_SECOND) {
          console.warn(
            `[RPC-DEBUG] ⚠️ Too many requests (${requestCount}/${MAX_REQUESTS_PER_SECOND}), adding delay`
          );
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(originalFetch.apply(this, args));
            }, 1000);
          });
        }
      }

      return originalFetch.apply(this, args).then(response => {
        // Handle 429 errors with backoff
        if (
          response.status === 429 &&
          url.includes('appchain.caff.testnet.espresso.network')
        ) {
          rateLimitedUntil = now + 30000; // 30 second cooldown
          console.error('[RPC-DEBUG] 🚫 429 Rate Limited - entering 30s cooldown:', {
            url,
            status: response.status,
            timestamp: new Date().toISOString(),
            cooldownUntil: new Date(rateLimitedUntil).toISOString(),
            stack: new Error().stack?.split('\n')[2]?.trim() || 'Unknown caller',
          });
        }
        return response;
      });
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
      clearInterval(resetInterval);
    };
  }, []);

  return null; // This component doesn't render anything
}
