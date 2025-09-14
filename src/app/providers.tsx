'use client';

import { ReactNode } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ToastProvider } from '@/components/clob-dex/place-order/toastContext'; // its have different from ui/toast, its need a check
import ToastContainer from '@/components/clob-dex/place-order/toastContainer'; // need checking
import Providers from '@/providers/privy-provider'; // Your existing Privy provider
import { WebSocketProvider } from '@/contexts/websocket-context';
import { ThemeProvider } from 'next-themes';

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

interface ClientProvidersProps {
  children: ReactNode;
  wsUrl: string;
}

export function ClientProviders({ children, wsUrl }: ClientProvidersProps) {
  return (
    <ThemeProvider
      disableTransitionOnChange
      attribute="class"
      defaultTheme="dark"
      value={{ light: 'light', dark: 'dark' }}
    >
      {/* <WebSocketProvider url={wsUrl}> */}
        <Providers>
          <RainbowKitProvider
            initialChain={ARBITRUM_SEPOLIA_CHAIN_ID}
            theme={darkTheme({
              accentColor: 'white',
              accentColorForeground: 'black',
            })}
          >
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </RainbowKitProvider>
        </Providers>
      {/* </WebSocketProvider> */}
    </ThemeProvider>
  );
}
