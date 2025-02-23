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

        <div>
            <LiquidbookEarn />
        </div>
    );
};

export default Earn;