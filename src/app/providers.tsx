'use client';

import { ReactNode } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ToastProvider } from '@/_components/toastContext';
import ToastContainer from '@/_components/toastContainer';
import PrivyProviders from '@/providers/privy-provider';
import { WebSocketProvider } from '@/contexts/websocket-context';
import { ThemeProvider } from 'next-themes';

const CORE_ANVIL_CHAIN_ID = 31337;

interface ClientProvidersProps {
  children: ReactNode;
  wsUrl: string;
}

export function ClientProviders({ children, wsUrl }: ClientProvidersProps) {
  return (
    <PrivyProviders>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="dark"
        value={{ light: 'light', dark: 'dark' }}
      >
        {/* <WebSocketProvider url={wsUrl}> */}
        <RainbowKitProvider
          initialChain={CORE_ANVIL_CHAIN_ID}
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
        {/* </WebSocketProvider> */}
      </ThemeProvider>
    </PrivyProviders>
  );
}
