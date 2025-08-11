import React from 'react';
import Head from 'next/head';
import Leaderboard from '@/components/leaderboard/leaderboard';
import { DotPattern } from '@/components/magicui/dot-pattern';

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>Leaderboard - GTX Analytics</title>
        <meta name="description" content="View top performing traders, highest volumes, and most active users on GTX decentralized exchange" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo/gtx.png" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Leaderboard - GTX Analytics" />
        <meta property="og:description" content="View top performing traders, highest volumes, and most active users on GTX decentralized exchange" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo/gtx.png" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leaderboard - GTX Analytics" />
        <meta name="twitter:description" content="View top performing traders, highest volumes, and most active users on GTX decentralized exchange" />
        <meta name="twitter:image" content="/logo/gtx.png" />
      </Head>
      
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        {/* Dot Pattern Background */}
        <DotPattern 
          className="text-neutral-400/20" 
          width={20} 
          height={20} 
          glow={true}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-purple-900/20 pointer-events-none" />
        
        {/* Additional subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Leaderboard />
        </div>
      </div>
    </>
  );
}