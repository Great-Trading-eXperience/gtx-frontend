'use client';

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/configs/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import Perpetual from "@/components/perpetual/perpetual";

const queryClient = new QueryClient();

const PerpetualPage = () => {
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
              <Perpetual />
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Tanpa Layout
PerpetualPage.getLayout = function getLayout(page: ReactNode) {
  return page;
};

export default PerpetualPage;