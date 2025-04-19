'use client';

import { useEffect, useState } from "react";
import PoolCreation from "@/components/pool-creation/pool-creation";

const PoolCreationPage = () => {
    // Use state to track both the value and whether we've mounted
    const [mounted, setMounted] = useState(false);
    const [isComingSoon, setIsComingSoon] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsComingSoon(process.env.NEXT_PUBLIC_COMING_SOON_CREATE === 'true');
    }, []);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden z-50">
            {/* Main content area */}
            <div className="relative">
                {/* PoolCreation component with conditional blur effect */}
                <div className={isComingSoon ? "blur-sm" : ""}>
                    <PoolCreation />
                </div>
                
                {/* Coming Soon overlay positioned over the PoolCreation */}
                {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center -mt-44 z-10">
                        <div className="bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10 rounded-xl">
                            <div className="p-12 text-center">
                                <div className="relative inline-block mb-8">
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                                    <img 
                                        src="/logo/gtx-update.png" 
                                        className="w-24 h-24 relative z-10" 
                                        alt="GTX Logo"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                                    Coming Soon
                                </h2>
                                <p className="text-cyan-100/80 mb-8">Pool creation features are currently under development</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PoolCreationPage;