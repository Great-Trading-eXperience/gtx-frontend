'use client';

import { motion } from 'motion/react';
import { Clock, DollarSign, Lock, ShieldAlert, ArrowRight, Zap } from 'lucide-react';
import React from 'react';

interface Problem {
  icon: React.ElementType;
  title: string;
  description: string;
  solution: string;
  gradient: string;
}

export function ProblemsSection() {
  const problems: Problem[] = [
    {
      icon: Lock,
      title: 'Fragmented Liquidity',
      description:
        'Liquidity scattered across chains causing poor price discovery',
      solution:
        'Unified crosschain orderbook across all EVM chains',
      gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
    },
    {
      icon: Clock,
      title: 'Lack of Transparency',
      description:
        'Opaque order matching and hidden market manipulation',
      solution:
        'On-chain matching with complete visibility',
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    },
    {
      icon: ShieldAlert,
      title: 'AMM Slippage',
      description:
        'Significant value loss on large trades',
      solution:
        'CLOB with zero slippage guarantee',
      gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    },
    {
      icon: DollarSign,
      title: 'Capital Inefficiency',
      description:
        'Locked capital across multiple chains',
      solution:
        'Trade without moving funds between chains',
      gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
    },
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      {/* Blockchain Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px]"></div>

      <div className="max-w-screen-xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 mb-6">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">DeFi Evolution</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Breaking{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
              Blockchain Barriers
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-3xl mx-auto"
          >
            Traditional DEXs are broken. We&apos;re building the future of decentralized trading.
          </motion.p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  {/* Hexagon Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polygon points="50,1 95,25 95,75 50,99 5,75 5,25" fill="currentColor" className="text-blue-400"/>
                    </svg>
                  </div>

                  <div className="relative z-10">
                    {/* Problem Section */}
                    <div className="mb-6">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30">
                          <Icon className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            {problem.title}
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                              PROBLEM
                            </span>
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {problem.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-blue-400 font-semibold">SOLUTION</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                    </div>

                    {/* Solution Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                        <p className="text-gray-200 text-sm font-medium leading-relaxed">
                          {problem.solution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-purple-500/0"></div>
                  </div>
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent group-hover:w-full transition-all duration-500"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
