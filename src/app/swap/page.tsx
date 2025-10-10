'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import SwapForm from '@/features/swap/components/swap';

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

const Swap = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="md:min-h-screen bg-black relative overflow-hidden z-50">
      <SwapForm />
    </div>
  );
};

export default Swap;
