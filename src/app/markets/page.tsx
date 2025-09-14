"use client";

import { Input } from '@/_components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function MarketsPage() {
  const [showWatchlist, setShowWatchlist] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      <div className="px-6 py-12 mx-auto bg-black max-w-7xl">
        <div className="flex flex-col gap-8 relative z-10">
          <h2 className="text-white text-4xl font-bold tracking-tight text-start">
            Market Overview
            <br />
            <span className="text-white/70 text-base font-normal mt-2 block">
              Explore the latest market data and trading activity across all supported
              tokens.
            </span>
          </h2>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-7xl mx-auto w-full justify-between items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              <Input
                placeholder="Search markets"
                className="pl-12 bg-black/50 border-white/20 text-white h-12 rounded-xl focus:ring-white/40 focus:border-white/40"
                // onClick={() => setIsSearchDialogOpen(true)}
              />
            </div>
            <div className="flex items-center gap-2 bg-black/60 border border-white/20 p-1 rounded-xl">
              <button
                onClick={() => setShowWatchlist(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !showWatchlist
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                All Markets
              </button>
              <button
                onClick={() => setShowWatchlist(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showWatchlist
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Watchlist
              </button>
            </div>
          </div>

          {/* Market Table */}
          <div className="overflow-x-auto bg-black/60 border border-white/20 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.07)] backdrop-blur-sm max-w-7xl mx-auto w-full">
            
          </div>
        </div>

        {/* Copy Notification */}
        {/* {copiedToken && (
          <div className="fixed bottom-6 right-6 bg-white/15 text-white px-5 py-3 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50 border border-white/30">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="font-medium">
              Copied {copiedToken.name} token to clipboard
            </span>
          </div>
        )} */}
      </div>
    </div>
  );
}
