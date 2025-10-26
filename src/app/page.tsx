"use client";

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { LandingEspresso } from '@/components/landing-page/landing-espresso';

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

export default function Home() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <LandingEspresso />;
}
