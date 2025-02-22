'use client';

import { ReactNode } from "react";
import TradingLayout from "@/components/trading/trading-layout";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import LiquidbookEarn from "@/components/earn/earn";

const queryClient = new QueryClient();

const Earn = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <div className="">
              <LiquidbookEarn />
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Tanpa Layout
Earn.getLayout = function getLayout(page: ReactNode) {
  return page;
};

export default Earn;