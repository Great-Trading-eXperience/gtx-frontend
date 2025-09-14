"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Clock, DollarSign, Lock, ShieldAlert } from "lucide-react"
import React, { useState } from "react"

interface Problem {
  icon: React.ElementType
  title: string
  description: string
  solution: string
}

// Safe icon component renderer
function SafeIcon({ icon: IconComponent, className }: { icon: React.ElementType; className: string }) {
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <div className={className} />; // Fallback
  }
  return <IconComponent className={className} />;
}

export function ProblemsSection() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const problems: Problem[] = [
    {
      icon: Lock,
      title: "Fragmented Liquidity",
      description:
        "Liquidity is scattered across multiple chains, leading to poor price discovery and increased slippage for traders.",
      solution:
        "Our crosschain orderbook unifies liquidity across all EVM chains, ensuring better prices and reduced slippage for every trade.",
    },
    {
      icon: Clock,
      title: "Lack of Transparency",
      description:
        "Centralized exchanges operate as black boxes with opaque order matching, hidden market manipulation, and unclear fee structures that disadvantage traders.",
      solution:
        "Our decentralized exchange ensures complete transparency with on-chain order matching, open-source smart contracts, and clear fee structures.",
    },
    {
      icon: ShieldAlert,
      title: "AMM Slippage",
      description:
        "AMMs suffer from significant slippage on large trades due to bonding curve mechanics, causing traders to lose substantial value especially during volatile markets.",
      solution:
        "Our Central Limit Order Book (CLOB) provides traditional limit orders with zero slippage, ensuring you get exactly the price you expect.",
    },
    {
      icon: DollarSign,
      title: "Capital Inefficiency",
      description:
        "Traders need to maintain separate balances on multiple chains, locking up capital and preventing optimal portfolio management across different networks.",
      solution:
        "Trade across any EVM chain without moving funds. Keep all your capital on your preferred chain while accessing liquidity from all supported networks.",
    },
  ]

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index)
  }

  return (
    <section className="py-20 relative z-10 overflow-hidden bg-gradient-to-b from-black to-[#050510]">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />

      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Solving{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Real Problems
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We&apos;ve addressed the common issues that plague traditional trading platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className={`
                relative overflow-hidden rounded-xl backdrop-blur-sm
                ${
                  expandedCard === index
                    ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30"
                    : "bg-[#0a0a0a]/80 border border-blue-900/20 hover:border-blue-900/40"
                }
                transition-all duration-300 h-full
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {/* Card content */}
              <div
                className={`p-6 cursor-pointer h-full flex flex-col ${expandedCard === index ? "" : "hover:bg-blue-900/5"}`}
                onClick={() => toggleCard(index)}
              >
                {/* Card header */}
                <div className="flex items-center mb-4">
                  <div
                    className={`p-3 rounded-lg ${expandedCard === index ? "bg-blue-900/40" : "bg-blue-900/20"} mr-4`}
                  >
                    <SafeIcon 
                      icon={problem.icon}
                      className={`h-6 w-6 ${expandedCard === index ? "text-blue-400" : "text-blue-300/70"}`}
                    />
                  </div>
                  <h3 className={`font-bold text-lg ${expandedCard === index ? "text-white" : "text-gray-200"}`}>
                    {problem.title}
                  </h3>
                  <ChevronDown
                    className={`ml-auto h-5 w-5 text-blue-400 transition-transform duration-300 ${expandedCard === index ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Problem description */}
                <p className="text-gray-400 mb-4">{problem.description}</p>

                {/* Solution section - only visible when expanded */}
                <AnimatePresence>
                  {expandedCard === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4"
                    >
                      <div className="border-t border-blue-900/30 pt-4 mt-auto">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <p className="text-blue-400 font-medium">Our solution:</p>
                        </div>
                        <p className="text-white">{problem.solution}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative corner accent */}
              {expandedCard === index && (
                <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-blue-500/20 w-8 h-32 -right-4 -top-16"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
