'use client';

import { QueryClient } from "@tanstack/react-query";
import LiquidbookEarn from "@/components/earn/earn";

const queryClient = new QueryClient();

const Earn = () => {
    return (

        <div className="h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950">
            <LiquidbookEarn />
        </div>
    );
};

export default Earn;