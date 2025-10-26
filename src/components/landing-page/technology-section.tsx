'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Puzzle, ArrowRight, ArrowDown } from 'lucide-react';

interface TechFeature {
  title: string;
  description: string;
  icon: React.ElementType;
  details: string;
  stats?: string[];
}

export function TechnologySection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const techFeatures: TechFeature[] = [
    {
      title: 'Yield Generation Layer',
      description:
        'Your deposited assets remain in high-yield protocols earning returns while synthetic tokens enable market access.',
      icon: Code2,
      details:
        'Real assets stay earning returns 24/7. Synthetic tokens represent your earning assets for market participation.',
      stats: ['Dual-Layer', 'Yield-Earning'],
    },
    {
      title: 'Market Access Layer',
      description:
        'Place, modify, and cancel orders using synthetic tokens while your real assets continue generating returns.',
      icon: Puzzle,
      details:
        'Full orderbook functionality with limit orders, stop losses, and advanced order types - all while generating returns.',
      stats: ['Price Precision', 'On-Chain Matching'],
    },
  ];

  return (
    <section className="py-24 relative z-10 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />

      <div className="max-w-screen-xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            How{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Dual Returns
            </span>
            {' '}Work
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Dual-layer architecture that keeps your assets earning while enabling market participation
          </p>
        </motion.div>

        <div className="relative">
          {/* 3D staggered card layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {techFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative z-10 transform transition-all duration-500"
              >
                <div
                  className={`
                    bg-[#0a0a0a] rounded-xl overflow-hidden h-full
                    border transition-all duration-300
                    ${
                      activeFeature === index
                        ? 'border-blue-500/50 shadow-lg shadow-blue-900/20'
                        : 'border-blue-900/30 hover:border-blue-700/40'
                    }
                  `}
                >
                  {/* Card background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 opacity-50" />

                  {/* Card content */}
                  <div className="p-8 relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`
                          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                          transition-all duration-300
                          ${
                            activeFeature === index
                              ? 'bg-blue-600/30 border-blue-500/50'
                              : 'bg-blue-900/30 border-blue-800/30'
                          }
                          border
                        `}
                      >
                        <feature.icon
                          className={`h-6 w-6 ${
                            activeFeature === index ? 'text-blue-400' : 'text-blue-500'
                          }`}
                        />
                      </div>
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    </div>

                    <p className="text-gray-300 mb-6 text-sm flex-grow">
                      {feature.description}
                    </p>

                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Connecting lines between cards (visible on larger screens) */}
          <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-20"
            >
              <path d="M0 0 L 100 100" stroke="#3B82F6" strokeWidth="2" />
              <path d="M0 100 L 100 0" stroke="#3B82F6" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}