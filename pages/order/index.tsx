'use client';


import TradingLayout from "@/components/spot-dex/trading-layout";
import PlaceOrder from "@/components/test/placeorder";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const Order = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
            <PlaceOrder />
        </div>
    );
};

export default Order;