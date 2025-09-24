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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://anvil.gtxdex.xyz';

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
