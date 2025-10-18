'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Code2, Puzzle, Blocks, Network, Shield, Zap } from 'lucide-react';

interface TechFeature {
  title: string;
  description: string;
  icon: React.ElementType;
  highlights: string[];
  gradient: string;
}

export function TechnologySection() {
  const techFeatures: TechFeature[] = [
    {
      title: 'Fully On-Chain',
      description:
        'Complete transparency with 100% on-chain order matching and settlement. Every trade is verifiable and auditable on the blockchain.',
      icon: Code2,
      highlights: ['Zero Off-Chain', 'Fully Verifiable', 'No Counterparty Risk'],
      gradient: 'from-blue-600 via-cyan-500 to-blue-600',
    },
    {
      title: 'Crosschain Orderbook',
      description:
        'Unified liquidity across any EVM chains. Trade without moving funds from your favorite chain with transparent matching.',
      icon: Puzzle,
      highlights: ['Multi-Chain', 'Unified Liquidity', 'No Fund Movement'],
      gradient: 'from-purple-600 via-pink-500 to-purple-600',
    },
  ];

  const techIcons = [
    { icon: Shield, label: 'Secure', color: 'text-green-400' },
    { icon: Network, label: 'Decentralized', color: 'text-blue-400' },
    { icon: Blocks, label: 'On-Chain', color: 'text-purple-400' },
    { icon: Zap, label: 'Fast', color: 'text-yellow-400' },
  ];

  return (
    <section className="py-24 relative z-10 overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        ></div>
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-screen-xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Built for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-700">
              Web3 Transparency
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-3xl mx-auto"
          >
            Powered by fully decentralized technologies ensuring complete transparency and verifiability
          </motion.p>
        </div>

        {/* Tech Icons Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center gap-8 mb-16 flex-wrap"
        >
          {techIcons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex flex-col items-center gap-2 group">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{item.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {techFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative"
              >
                {/* Main Card */}
                <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 overflow-hidden transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                  {/* Animated Gradient Border Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-10`}></div>
                  </div>

                  {/* Circuit Pattern */}
                  <div className="absolute top-0 right-0 w-64 h-64 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="50" cy="50" r="3" fill="currentColor" className="text-blue-400" />
                      <circle cx="150" cy="50" r="3" fill="currentColor" className="text-blue-400" />
                      <circle cx="50" cy="150" r="3" fill="currentColor" className="text-blue-400" />
                      <circle cx="150" cy="150" r="3" fill="currentColor" className="text-blue-400" />
                      <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="1" className="text-blue-400/30" />
                      <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="1" className="text-blue-400/30" />
                      <line x1="150" y1="50" x2="150" y2="150" stroke="currentColor" strokeWidth="1" className="text-blue-400/30" />
                      <line x1="50" y1="150" x2="150" y2="150" stroke="currentColor" strokeWidth="1" className="text-blue-400/30" />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    {/* Header with Icon */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 relative`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 rounded-xl blur-xl`}></div>
                        <Icon className="w-8 h-8 text-white relative z-10" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-xs text-green-400 font-medium">ACTIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 leading-relaxed mb-6">{feature.description}</p>

                    {/* Highlights */}
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border-l-2 border-blue-500/50"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          <span className="text-sm text-gray-200 font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}></div>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-gradient-to-r ${feature.gradient} group-hover:w-3/4 transition-all duration-500 rounded-full`}></div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Decorative Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="w-32 h-32 rounded-full border border-blue-500/20 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-blue-500/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Network className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
