'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Image from 'next/image';
import AnimeSphereAnimation from './AnimeSphereAnimation';

interface Problem {
  title: string;
  description: string;
  solution: string;
  detailedContent: {
    paragraphs: string[];
  };
  illustration: React.ReactNode;
}

export function ProblemsSection() {
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);

  const problems: Problem[] = [
    {
      title: 'Fragmented Liquidity',
      description:
        'Liquidity is scattered across multiple chains, leading to poor price discovery and increased slippage for traders.',
      solution:
        'Our crosschain orderbook unifies liquidity across all EVM chains, ensuring better prices and reduced slippage for every trade.',
      detailedContent: {
        paragraphs: [
          'Liquidity fragmentation creates significant inefficiencies, forcing traders to choose between limited liquidity on their preferred chain or the hassle of bridging assets.',
          'Our cross-chain orderbook unifies liquidity across all EVM chains, ensuring better prices and dramatically reduced slippage for every trade.',
        ],
      },
      illustration: (
        <div className="relative w-full h-48 bg-gradient-to-br from-black via-[#050510] to-black overflow-hidden">
          <div className="absolute inset-0 scale-75">
            <AnimeSphereAnimation />
          </div>
        </div>
      ),
    },
    {
      title: 'Lack of Transparency',
      description:
        'Centralized exchanges operate as black boxes with opaque order matching, hidden market manipulation, and unclear fee structures that disadvantage traders.',
      solution:
        'Our decentralized exchange ensures complete transparency with on-chain order matching, open-source smart contracts, and clear fee structures.',
      detailedContent: {
        paragraphs: [
          'Centralized exchanges operate with minimal transparency, creating information asymmetry through hidden order types, preferential treatment for high-frequency traders, and opaque fee structures.',
          'Our decentralized architecture ensures complete transparency with on-chain order matching, open-source smart contracts, and clear fee structures that create a level playing field for all participants.',
        ],
      },
      illustration: (
        <div className="relative w-full h-48 bg-black">
          <Image
            src="/gif/Ribbon.gif"
            alt="Lack of Transparency illustration"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ),
    },
    {
      title: 'AMM Slippage',
      description:
        'AMMs suffer from significant slippage on large trades due to bonding curve mechanics, causing traders to lose substantial value especially during volatile markets.',
      solution:
        'Our Central Limit Order Book (CLOB) provides traditional limit orders with zero slippage, ensuring you get exactly the price you expect.',
      detailedContent: {
        paragraphs: [
          'Automated Market Makers suffer from exponential slippage on large trades due to bonding curve mechanics, resulting in poor execution especially during volatile markets.',
          'Our Central Limit Order Book provides traditional limit orders with zero slippage. You specify exactly the price you want, maintaining complete control over execution even in turbulent markets.',
        ],
      },
      illustration: (
        <div className="relative w-full h-48 bg-black">
          <Image
            src="/gif/RotatingGem.gif"
            alt="AMM Slippage illustration"
            fill
            className="object-cover"
          />
        </div>
      ),
    },
    {
      title: 'Capital Inefficiency',
      description:
        'Traders need to maintain separate balances on multiple chains, locking up capital and preventing optimal portfolio management across different networks.',
      solution:
        'Trade across any EVM chain without moving funds. Keep all your capital on your preferred chain while accessing liquidity from all supported networks.',
      detailedContent: {
        paragraphs: [
          'Traditional cross-chain trading requires maintaining separate balances on each network, locking up capital in bridging fees and creating operational complexity.',
          'Our architecture lets you keep all capital on a single chain while trading against liquidity from any supported network. Our protocol handles cross-chain settlement automatically, maximizing capital efficiency.',
        ],
      },
      illustration: (
        <div className="relative w-full h-48">
          <Image
            src="/gif/WaveLoop.gif"
            alt="Capital Inefficiency illustration"
            fill
            className="object-cover"
          />
        </div>
      ),
    },
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden bg-gradient-to-b from-black to-[#050510]">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />

      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Solving{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Real Problems
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We&apos;ve addressed the common issues that plague traditional trading
            platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <div key={index}>
              {selectedProblem !== index && (
                <motion.div
                  layoutId={`problem-${index}`}
                  className="relative bg-[#1a1a1a]/50 hover:bg-[#1f1f1f]/60 cursor-pointer group transition-all duration-300 h-full border border-[rgba(255,255,255,0.03)] rounded-2xl overflow-hidden"
                  onClick={() => setSelectedProblem(index)}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 20,
                    duration: 1.2,
                  }}
                >
                  {/* Illustration - Full Width */}
                  <motion.div layoutId={`illustration-${index}`}>
                    {problem.illustration}
                  </motion.div>

                  {/* Content with padding */}
                  <div className="p-8">
                    {/* Title */}
                    <motion.h3
                      layoutId={`title-${index}`}
                      className="text-xl leading-tight mb-4 text-balance font-medium text-zinc-100"
                    >
                      {problem.title}
                    </motion.h3>

                    {/* Learn More button */}
                    <button className="flex items-center gap-2 text-sm text-[#8b8b8b] group-hover:text-blue-400 transition-colors">
                      <span>Learn More</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="group-hover:translate-x-1 transition-transform"
                      >
                        <path d="M5 12h14"/>
                        <path d="m12 5 7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Modal */}
      <Dialog open={selectedProblem !== null} onOpenChange={(open) => !open && setSelectedProblem(null)}>
        <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            {selectedProblem !== null && problems[selectedProblem] && (
              <motion.div
                key={selectedProblem}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="p-12 relative"
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedProblem(null)}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
                {/* Illustration */}
                <motion.div
                  layoutId={`illustration-${selectedProblem}`}
                  className="mb-8"
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 20,
                  }}
                >
                  {selectedProblem === 0 ? (
                    <div className="relative w-full h-64 bg-gradient-to-br from-black via-[#050510] to-black overflow-hidden rounded-lg">
                      <div className="absolute inset-0">
                        <AnimeSphereAnimation />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-64 flex items-center justify-center bg-black rounded-lg">
                      <Image
                        src={
                          selectedProblem === 1 
                            ? "/gif/Ribbon.gif" 
                            : selectedProblem === 2 
                              ? "/gif/RotatingGem.gif"
                              : "/gif/WaveLoop.gif"
                        }
                        alt={`${problems[selectedProblem].title} illustration`}
                        fill
                        className="object-contain"
                        unoptimized={selectedProblem === 1 || selectedProblem === 2}
                      />
                    </div>
                  )}
                </motion.div>

                {/* Title */}
                <DialogHeader className="mb-8">
                  <motion.div
                    layoutId={`title-${selectedProblem}`}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 20,
                    }}
                  >
                    <DialogTitle className="text-4xl lg:text-5xl tracking-tight font-semibold leading-tight text-white text-left">
                      {problems[selectedProblem].title}
                    </DialogTitle>
                  </motion.div>
                </DialogHeader>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="space-y-8 text-left max-w-2xl"
                >
                  {/* Paragraphs */}
                  {problems[selectedProblem].detailedContent.paragraphs.map(
                    (paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-[#8b8b8b] text-lg leading-relaxed text-pretty"
                      >
                        {paragraph}
                      </p>
                    )
                  )}

                  {/* Solution highlight */}
                  <div className="py-5">
                    <div className="flex items-center mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                      <h3 className="text-blue-400 font-semibold text-lg">
                        Our Solution
                      </h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      {problems[selectedProblem].solution}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}