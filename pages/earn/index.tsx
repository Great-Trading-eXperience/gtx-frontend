'use client';

import GTXEarn from "@/components/earn/earn";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const GTXEarnPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
            {/* Original GTXEarn component with blur filter applied */}
            {/* <div className="filter blur-sm pointer-events-none"> */}
                <GTXEarn />


            {/* Coming Soon overlay */}
            {/* <div className="min-h-[60vh] absolute inset-0 flex items-center justify-center -mt-18 z-10">
                <div className="border-0 bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10 rounded-xl">
                    <div className="p-12 text-center">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                            <img src={"/logo/gtx-gradient.png"} className="w-24 h-24 relative z-10" alt="GTX Logo" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                            Coming Soon
                        </h2>
                        <p className="text-cyan-100/80 mb-8">Earn features are currently under development</p>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default GTXEarnPage;