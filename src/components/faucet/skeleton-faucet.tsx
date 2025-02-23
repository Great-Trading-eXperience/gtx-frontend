import React from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Hexagon, Droplets, Wallet, Clock, Calendar, History } from "lucide-react"

// Stats Grid Skeleton Component
const StatsGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {[Wallet, Clock, Calendar, Wallet].map((Icon, index) => (
            <div key={index} className="bg-black/20 rounded-lg p-2 border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Hexagon className="w-10 h-10 text-cyan-500/20 absolute -left-1 -top-1" />
                        <Icon className="w-8 h-8 text-cyan-400/50 relative z-10" />
                    </div>
                    <div>
                        <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
                        <div className="h-6 w-24 bg-white/10 rounded mt-1 animate-pulse"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Token Form Skeleton Component
const TokenFormSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-4">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-black/20 rounded-md border border-white/10 animate-pulse"></div>
        </div>
        <div className="h-10 w-full bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-md animate-pulse"></div>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
        {/* Animated nodes background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-full h-full opacity-10">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
            </div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-6 py-12">
            <div className="space-y-6 w-full max-w-7xl mx-auto">
                {/* Hero Section Skeleton */}
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center justify-center mb-6">
                        <div className="relative">
                            <Hexagon className="w-16 h-16 text-cyan-500/20 absolute -left-1 -top-1" />
                            <Droplets className="w-14 h-14 text-cyan-400/50 relative z-10" />
                        </div>
                    </div>
                    <div className="h-10 w-96 mx-auto bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 rounded-lg mb-4 animate-pulse"></div>
                    <div className="h-5 w-64 mx-auto bg-gray-200/20 rounded animate-pulse"></div>
                </div>

                {/* Main Card Skeleton */}
                <Card className="border-0 bg-white/5 backdrop-blur-xl">
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <TokenFormSkeleton />
                            <StatsGridSkeleton />
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction History Skeleton */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Hexagon className="w-12 h-12 text-cyan-500/20 absolute -left-1 -top-1" />
                            <History className="w-10 h-10 text-cyan-400/50 relative z-10" />
                        </div>
                        <div className="h-8 w-48 bg-white/10 rounded animate-pulse"></div>
                    </div>

                    <Card className="border-0 bg-white/5 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <TransactionTableSkeleton />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
);

// Wallet Connection Skeleton
const WalletConnectionSkeleton = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950">
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse blur-[2px]"></div>
                    <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse delay-75 blur-[1px]"></div>
                    <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-300/40 rounded-full animate-pulse delay-150 blur-[2px]"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-pulse delay-300 blur-[1px]"></div>
                    <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse delay-500 blur-[1px]"></div>
                </div>
            </div>
            <div className="min-h-[100vh] flex items-center justify-center">
                <Card className="border-0 bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10">
                    <CardContent className="p-12 text-center">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                            <Hexagon className="w-20 h-20 text-cyan-500/20 absolute -left-2 -top-2" />
                            <Droplets className="w-16 h-16 text-cyan-400/50 relative z-10" />
                        </div>
                        {/* Skeleton for heading */}
                        <div className="h-9 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-lg mb-4 mx-auto max-w-[200px] animate-pulse"></div>
                        {/* Skeleton for paragraph */}
                        <div className="h-5 bg-cyan-100/20 rounded-lg mb-8 mx-auto max-w-[240px] animate-pulse"></div>
                        {/* Skeleton for button */}
                        <div className="h-10 bg-cyan-400/20 rounded-lg mx-auto max-w-[180px] animate-pulse"></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export {
    FaucetSkeleton,
    StatsGridSkeleton,
    TokenFormSkeleton,
    TransactionTableSkeleton,
    WalletConnectionSkeleton
};