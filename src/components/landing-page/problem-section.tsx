'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AnimeSphereAnimation from './AnimeSphereAnimation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../_components/ui/dialog';

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
      title: 'Idle Capital Problem',
      description:
        'Your trading capital sits idle in wallets or DEXs, earning zero yield while waiting to execute trades or manage positions.',
      solution:
        'Your deposited assets automatically earn staking rewards while synthetic tokens enable seamless trading, maximizing capital efficiency.',
      detailedContent: {
        paragraphs: [
          'GTX solves this by managing your deposited assets for staking while minting synthetic tokens for trading.',
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
          'Our decentralized architecture ensures transparency with on-chain order matching and open-source smart contracts.',
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
        'Our Central Limit Order Book (CLOB) provides traditional limit orders with minimal slippage for better execution.',
      detailedContent: {
        paragraphs: [
          'Our Central Limit Order Book provides traditional limit orders with minimal slippage and better price control.',
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
      title: 'Crosschain Complexity',
      description:
        'Managing assets across multiple chains requires constant bridging, separate balances, and high fees—making crosschain trading impractical and expensive.',
      solution:
        'Deposit from major EVM chains and trade with synthetic tokens while your assets stay on your preferred chain.',
      detailedContent: {
        paragraphs: [
          'GTX eliminates this complexity. Deposit once from your preferred chain and trade with synthetic tokens.',
        ],
      },
      illustration: (
        <div className="relative w-full h-48">
          <Image
            src="/gif/WaveLoop.gif"
            alt="Crosschain Complexity illustration"
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