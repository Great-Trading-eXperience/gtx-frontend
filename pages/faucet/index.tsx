'use client';

import { ReactNode } from "react";
import TradingLayout from "@/components/trading/trading-layout";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import LiquidbookEarn from "@/components/earn/earn";
import GTXFaucet from "@/components/faucet/faucet";

const queryClient = new QueryClient();

const Faucet = () => {
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
              <GTXFaucet />
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Tanpa Layout
Faucet.getLayout = function getLayout(page: ReactNode) {
  return page;
};

export default Faucet;