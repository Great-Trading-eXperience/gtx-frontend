'use client';

import { useState } from 'react';
import CreatePoolComponent from "@/components/clob-dex/create-pool/create-pool";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hexagon, ArrowLeftRight, TrendingUp } from "lucide-react";
import MarketCreationPage from '@/components/perpetual/MarketCreationPage/MarketCreationPage';

const CreatePairFormPage = () => {
    const [activeTab, setActiveTab] = useState<'spot' | 'perpetual'>('spot');

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
            {/* Hexagonal Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI1IDJMMi42OCAxMy41djI1TDI1IDUwbDIyLjMyLTExLjV2LTI1eiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU2LCAxODksIDI0OCwgMC4wMykpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] opacity-50"></div>

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

            {/* Top navigation tabs */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
                <Tabs 
                    defaultValue="spot" 
                    value={activeTab} 
                    onValueChange={(value) => setActiveTab(value as 'spot' | 'perpetual')}
                >
                    <TabsList className="grid grid-cols-2 w-72 h-12 p-1 bg-slate-900/60 backdrop-blur-md border border-cyan-500/10 rounded-lg gap-1 shadow-lg">
                        <TabsTrigger 
                            value="spot" 
                            className="h-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                        >
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Hexagon className="w-5 h-5 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                                    <ArrowLeftRight className="w-4 h-4 text-cyan-400/80 relative z-10" />
                                </div>
                                <span>Spot Pool</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="perpetual"
                            className="h-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                        >
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Hexagon className="w-5 h-5 text-cyan-500/20 absolute -left-0.5 -top-0.5" />
                                    <TrendingUp className="w-4 h-4 text-cyan-400/80 relative z-10" />
                                </div>
                                <span>Perpetual</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Render the selected component based on active tab */}
            {activeTab === 'spot' ? (
                <CreatePoolComponent />
            ) : (
                <MarketCreationPage />
            )}
        </div>
    );
};

export default CreatePairFormPage;