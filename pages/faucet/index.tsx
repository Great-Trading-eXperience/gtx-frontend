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

        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
            <GTXFaucet />
        </div>
    );
};

export default Faucet;