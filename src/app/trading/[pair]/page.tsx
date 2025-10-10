'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import ClobDex from '@/features/trading/components/clob-dex';

export default function SpotWithPool() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <ClobDex />
    </div>
  );
}
