"use client";

import { LandingEspresso } from '@/_components/landing-page/landing-espresso';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

export default function Home() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <LandingEspresso />;
}
