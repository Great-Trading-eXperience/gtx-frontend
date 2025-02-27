'use client';

import { QueryClient } from "@tanstack/react-query";
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