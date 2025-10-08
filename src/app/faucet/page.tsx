'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import GTXFaucet from '@/features/faucet/components/faucet';

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

const Faucet = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <GTXFaucet />
    </div>
  );
};

export default Faucet;