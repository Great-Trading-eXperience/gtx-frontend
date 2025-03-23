'use client';

import GTXEarn from "@/components/earn/earn";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const GTXEarnPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
                <GTXEarn />
        </div>
    );
};

export default GTXEarnPage;