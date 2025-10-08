'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import MarketList from "@/features/market/components/market-list";

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

const Market = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="md:min-h-screen bg-black relative overflow-hidden z-50">
      <MarketList />
    </div>
  );
};

export default Market;
