import type { Metadata } from 'next';
import { Toaster } from '@/_components/ui/toaster';
import { ClientProviders } from './providers';
import { RPCLogger } from '@/_components/rpc-logger';
import '../../styles/globals.css';

export const metadata: Metadata = {
  title: 'GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading',
  description: 'The Most Capital Efficient Crosschain Decentralized CLOB',
  icons: {
    icon: '/logo/gtx.png',
  },
};

// Force dynamic rendering to avoid prerender-time execution of client hooks (e.g., useWallets)
export const dynamic = 'force-dynamic';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://devnet.gtxdex.xyz';

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RPCLogger />
        <ClientProviders wsUrl={wsUrl}>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
