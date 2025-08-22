import React from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Clock, Calendar, History, TrendingUp, Droplets } from "lucide-react"
import { DotPattern } from "../magicui/dot-pattern"

// Stats Grid Skeleton Component
const StatsGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {[Wallet, Clock, Calendar, Wallet].map((Icon, index) => (
            <div key={index} className="bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-black/60 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-400/50" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Token Form Skeleton Component
const TokenFormSkeleton = () => (
    <div className="space-y-6">
        <div>
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-3"></div>
            <div className="h-12 w-full bg-black/40 border border-white/20 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-14 w-full bg-blue-600/50 rounded-xl animate-pulse"></div>
    </div>
);

// Transaction Table Skeleton Component
const TransactionTableSkeleton = () => (
    <div className="space-y-4">
        <div className="h-10 w-full bg-white/10 rounded animate-pulse"></div>
        {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 w-full bg-white/10 rounded animate-pulse"></div>
        ))}
    </div>
);

// Main Faucet Skeleton
const FaucetSkeleton = () => (
    <div className="px-6 py-12 mx-auto bg-black min-h-screen">
        {/* Dot Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <DotPattern />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">
                {/* Header Section Skeleton */}
                <div>
                    <div className="h-10 w-80 bg-white/10 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-96 bg-white/10 rounded animate-pulse opacity-70"></div>
                </div>

                {/* Main Faucet Card Skeleton */}
                <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
                    {/* Header with Icon */}
                    <div className="flex items-center gap-3 p-6 border-b border-white/10">
                        <TrendingUp className="w-5 h-5 text-white/50" />
                        <div className="h-5 w-32 bg-white/10 rounded animate-pulse"></div>
                    </div>

                    <div className="p-6">
                        <div className="grid lg:grid-cols-2 gap-8">
                            <TokenFormSkeleton />
                            <StatsGridSkeleton />
                        </div>
                    </div>
                </div>

                {/* Transaction History Skeleton */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <History className="w-6 h-6 text-white/50" />
                        <div className="h-6 w-48 bg-white/10 rounded animate-pulse"></div>
                    </div>

                    <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm">
                        <div className="p-6">
                            <TransactionTableSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Wallet Connection Skeleton
const WalletConnectionSkeleton = () => {
    return (
        <div className="px-6 py-12 mx-auto bg-black min-h-screen">
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <DotPattern />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-md w-full">
                        <div className="p-12 text-center">
                            <div className="flex items-center justify-center mb-8">
                                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <Droplets className="w-10 h-10 text-blue-400/50" />
                                </div>
                            </div>
                            {/* Skeleton for heading */}
                            <div className="h-8 bg-white/10 rounded mb-4 mx-auto max-w-[200px] animate-pulse"></div>
                            {/* Skeleton for paragraph */}
                            <div className="h-5 bg-white/10 rounded mb-8 mx-auto max-w-[240px] animate-pulse"></div>
                            {/* Skeleton for button */}
                            <div className="h-12 bg-blue-600/30 rounded-xl mx-auto max-w-[180px] animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Gradient Loader Component for connection transition
const GradientLoader = () => (
    <div className="px-6 py-12 mx-auto bg-black min-h-screen">
        {/* Dot Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <DotPattern />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full animate-pulse"></div>
                <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin relative"></div>
            </div>
        </div>
    </div>
);

export {
    FaucetSkeleton,
    StatsGridSkeleton,
    TokenFormSkeleton,
    TransactionTableSkeleton,
    WalletConnectionSkeleton,
    GradientLoader
};