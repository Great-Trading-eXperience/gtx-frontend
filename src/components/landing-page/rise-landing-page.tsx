"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  BarChart2,
  LineChart,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Code2,
  Terminal,
  Puzzle,
  Layers,
  Users,
  TrendingUp,
  ArrowRightCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { BlockchainBackground } from "./blockchain-background"

export function RiseLandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [randomPositions, setRandomPositions] = useState<Array<{
    left: number;
    top: number;
    rotate?: number;
    width?: number;
  }>>([])
  const [binaryStrings, setBinaryStrings] = useState<string[]>([])

  const tradingSteps = [
    {
      title: "Create Account",
      description: "Connect your wallet and access all features instantly with no KYC required",
      icon: Wallet,
      step: 1,
    },
    {
      title: "Start Trading",
      description: "Access spot markets with deep liquidity and competitive fees",
      icon: LineChart,
      step: 2,
    },
    {
      title: "Manage Positions",
      description: "Monitor your portfolio and manage risk with advanced trading tools",
      icon: BarChart2,
      step: 3,
    },
  ]

  const features = [
    {
      title: "Spot Trading",
      description: "Fully decentralized order book-based exchange with no gatekeepers",
      icon: ArrowUpRight,
      id: 1,
    },
    {
      title: "Permissionless Markets",
      description: "Anyone can list a new market without requiring approval",
      icon: Users,
      id: 2,
    },
    {
      title: "Fair Pricing",
      description: "Transparent price discovery without reliance on external oracles",
      icon: LineChart,
      id: 3,
    },
    {
      title: "Capital Efficiency",
      description: "Optimized liquidity utilization compared to traditional AMMs",
      icon: Layers,
      id: 4,
    },
  ]

  const problems = [
    {
      title: "Inefficient Capital Utilization",
      description: "AMMs require deep liquidity to minimize slippage, leading to inefficient capital allocation",
    },
    {
      title: "High Impermanent Loss",
      description: "Liquidity providers often suffer from impermanent loss due to volatile price movements",
    },
    {
      title: "Price Manipulation",
      description: "AMMs are vulnerable to front-running and sandwich attacks, harming traders",
    },
    {
      title: "Restricted Market Listings",
      description: "Centralized exchanges limit listings, making it difficult for emerging assets to gain liquidity",
    },
  ]

  // Generate random positions only on client side after mount
  useEffect(() => {
    setMounted(true)

    // Generate random positions for nodes
    const nodePositions = Array.from({ length: 15 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360
    }))

    // Generate random positions for connections
    const connectionPositions = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360,
      width: Math.random() * 200 + 100
    }))

    // Generate random positions for data blocks
    const blockPositions = Array.from({ length: 10 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360
    }))

    // Generate random positions for orbs
    const orbPositions = Array.from({ length: 8 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100
    }))

    // Generate random positions for circuit paths
    const circuitPositions = Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360,
      width: Math.random() * 300 + 100
    }))

    // Generate binary strings
    const binaryStrings = Array.from({ length: 20 }, () =>
      Array.from({ length: 20 }, () => Math.random() > 0.5 ? "1" : "0").join(" ")
    )

    setRandomPositions([...nodePositions, ...connectionPositions, ...blockPositions, ...orbPositions, ...circuitPositions])
    setBinaryStrings(binaryStrings)
  }, [])

  return (
    <main className="text-white min-h-screen overflow-hidden bg-black">
      {/* Blockchain-themed background elements */}
      {mounted && <BlockchainBackground />}

      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-900 text-blue-100 font-semibold rounded-full z-60 relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                Decentralized Trading Platform
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Great Trading{" "}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 relative inline-block"
                >
                  eXperience
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  />
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl text-gray-300"
              >
                A decentralized finance protocol enabling permissionless spot trading with plans to expand into
                perpetual markets.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Link href="/markets" target="_blank">
                  <Button className="bg-gradient-to-r from-blue-800 to-blue-900 text-white hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-900 px-6 py-6 text-lg font-medium rounded-xl border border-gray-300/40 relative overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      Launch App
                      <ExternalLink size={20} />
                    </div>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Trading dashboard mockup */}
              <div className="relative rounded-2xl bg-[#0a0a0a] border border-blue-900/30 overflow-hidden shadow-2xl shadow-blue-900/20">
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50" />

                {/* Header with tabs */}
                <div className="bg-[#111111] px-6 py-4 border-b border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-blue-500"
                    />
                    <span className="font-bold text-white">BTC/USD</span>
                    <motion.span
                      animate={{ color: ["#4ade80", "#22c55e", "#4ade80"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-400"
                    >
                      $89,324.50
                    </motion.span>
                    <motion.span
                      animate={{ color: ["#4ade80", "#22c55e", "#4ade80"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-400 text-sm"
                    >
                      +2.4%
                    </motion.span>
                  </div>
                  <div className="flex text-sm">
                    <div className="px-3 py-1 bg-blue-900/30 text-white rounded-l-md border border-blue-800/30">1H</div>
                    <div className="px-3 py-1 bg-[#0a0a0a] text-gray-300 rounded-r-md border border-blue-800/30">1D</div>
                  </div>
                </div>

                {/* Chart area */}
                <div className="px-6 py-8 bg-[#0a0a0a]">
                  {/* Simplified chart */}
                  <div className="h-60 w-full relative">
                    {/* Price grid lines */}
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="absolute w-full h-px bg-blue-900/30"
                        style={{ top: `${i * 25}%` }}
                      >
                        <span className="absolute right-0 transform -translate-y-1/2 text-xs text-gray-400">
                          ${Math.round(89324 - i * 1000)}
                        </span>
                      </motion.div>
                    ))}

                    {/* Chart line - static SVG */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                        d="M0,120 C40,100 80,140 120,80 C160,20 200,60 240,40 C280,20 320,50 360,30"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                      />
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ duration: 2 }}
                        d="M0,120 C40,100 80,140 120,80 C160,20 200,60 240,40 C280,20 320,50 360,30 L360,180 L0,180 Z"
                        fill="url(#gradient)"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Price indicator dot */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="absolute top-[30px] right-[40px] w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0a0a0a] shadow-lg shadow-blue-500/50"
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-500"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Trading controls */}
                <div className="px-6 pb-6 grid grid-cols-2 gap-4 bg-[#0a0a0a]">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-3 px-5 bg-green-600/80 text-white font-bold rounded-lg hover:bg-green-600 transition-colors relative overflow-hidden group border border-green-500/30"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="relative z-10">BUY / LONG</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-3 px-5 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-600 transition-colors relative overflow-hidden group border border-red-500/30"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="relative">SELL / SHORT</span>
                  </motion.button>
                </div>
              </div>

              {/* Stats floating card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute -right-4 -bottom-16 p-4 bg-[#0a0a0a] border border-blue-900/30 rounded-xl shadow-md shadow-blue-900/20 w-60"
              >
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50" />

                <div className="flex justify-between items-center mb-3 relative z-15">
                  <h4 className="text-sm font-semibold text-white">Market Stats</h4>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <ArrowRightCircle size={16} className="text-blue-500" />
                  </motion.div>
                </div>
                <div className="space-y-2 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="flex justify-between"
                  >
                    <span className="text-xs text-gray-400">24h Volume</span>
                    <span className="text-xs font-medium text-blue-400">$1.2B</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="flex justify-between"
                  >
                    <span className="text-xs text-gray-400">Open Interest</span>
                    <span className="text-xs font-medium text-blue-400">$840M</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                    className="flex justify-between"
                  >
                    <span className="text-xs text-gray-400">Funding Rate</span>
                    <motion.span
                      animate={{ color: ["#4ade80", "#22c55e", "#4ade80"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs font-medium text-green-400"
                    >
                      +0.01%
                    </motion.span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-2"
            >
              Common <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Issues</span> in Trading
            </motion.h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Many trading platforms have problems that make trading difficult
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`bg-[#0a0a0a] border border-blue-900/30 rounded-lg p-6 shadow-lg shadow-blue-900/10 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300`}
              >
                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50"
                  animate={{
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative z-10">

                  <motion.h3
                    className="text-xl font-bold mb-3 relative z-10"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {problem.title}
                  </motion.h3>

                  <motion.p
                    className="text-gray-400 relative z-10"
                    initial={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {problem.description}
                  </motion.p>


                </div>
              </motion.div>
            ))}
          </div>


        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-2"
            >
              Why Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Platform</span> is Different
            </motion.h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We&rsquo;ve built a trading platform that addresses common trading problems
            </p>
          </motion.div>

          <div className="relative">

            <div className="grid md:grid-cols-4 gap-8 relative">
              {features.map((feature, index) => (
                <div key={index} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    onMouseEnter={() => setHoveredFeature(feature.id)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    whileHover={{ y: -5 }}
                    className="relative z-10 h-full"
                  >
                    <Card
                      className={`bg-[#0a0a0a] border border-blue-900/30 h-full transition-all duration-300 ${hoveredFeature === feature.id ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : ""}`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 1 }}
                            className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center relative z-10"
                          >
                            <motion.div
                              animate={{
                                scale: hoveredFeature === feature.id ? [1, 1.2, 1] : 1,
                                color: hoveredFeature === feature.id ? ["#3b82f6", "#60a5fa", "#3b82f6"] : "#3b82f6"
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <feature.icon className="h-6 w-6" />
                            </motion.div>
                          </motion.div>
                        </div>

                        <motion.h3
                          className="text-xl font-bold mb-3 mt-4"
                          animate={{
                            color: hoveredFeature === feature.id ? ["#ffffff", "#60a5fa", "#ffffff"] : "#ffffff"
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {feature.title}
                        </motion.h3>
                        <motion.p
                          className="text-gray-400 text-sm flex-grow"
                          animate={{
                            opacity: hoveredFeature === feature.id ? 1 : 0.7
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {feature.description}
                        </motion.p>
                      </CardContent>
                    </Card>
                  </motion.div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trading Steps Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-2"
            >
              Start Trading in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Three Steps</span>
            </motion.h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">A simple process to begin trading on our platform</p>
          </motion.div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-900/30 via-blue-800/50 to-blue-900/30 hidden md:block" />

            {/* Animated data packets */}
            <AnimatePresence>
              {[1, 2, 3].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 4,
                    delay: i * 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 3,
                  }}
                  className="absolute left-1/2 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)] hidden md:block"
                  style={{ transform: "translateX(-50%)" }}
                />
              ))}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-8 relative">
              {tradingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`relative ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:col-start-2'}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    onMouseEnter={() => setHoveredStep(step.step)}
                    onMouseLeave={() => setHoveredStep(null)}
                    whileHover={{ y: -5 }}
                    className="relative z-10 h-full"
                  >
                    <Card
                      className={`bg-[#0a0a0a] border border-blue-900/30 h-full transition-all duration-300 ${hoveredStep === step.step ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : ""}`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className={`flex ${index % 2 === 0 ? 'justify-between' : 'flex-row-reverse justify-between'} items-start mb-4`}>
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 1 }}
                            className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center relative z-10"
                          >
                            <motion.div
                              animate={{
                                scale: hoveredStep === step.step ? [1, 1.2, 1] : 1,
                                color: hoveredStep === step.step ? ["#3b82f6", "#60a5fa", "#3b82f6"] : "#3b82f6"
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <step.icon className="h-6 w-6" />
                            </motion.div>
                          </motion.div>
                          <motion.div
                            className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/30 border border-blue-800/30 ${index % 2 === 0 ? 'ml-4' : 'mr-4'}`}
                            animate={{
                              scale: hoveredStep === step.step ? [1, 1.1, 1] : 1,
                              boxShadow: hoveredStep === step.step ? "0 0 10px rgba(59,130,246,0.5)" : "none"
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <motion.span
                              className="text-sm font-mono text-blue-400"
                              animate={{
                                color: hoveredStep === step.step ? ["#3b82f6", "#60a5fa", "#3b82f6"] : "#3b82f6"
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {step.step}
                            </motion.span>
                          </motion.div>
                        </div>

                        <motion.h3
                          className="text-xl font-bold mb-3 mt-4"
                          animate={{
                            color: hoveredStep === step.step ? ["#ffffff", "#60a5fa", "#ffffff"] : "#ffffff"
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {step.title}
                        </motion.h3>
                        <motion.p
                          className="text-gray-400 text-sm flex-grow"
                          animate={{
                            opacity: hoveredStep === step.step ? 1 : 0.7
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {step.description}
                        </motion.p>

                        {/* Animated completion indicator */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: hoveredStep === step.step ? 1 : 0 }}
                          transition={{ type: "spring" }}
                          className={`absolute bottom-4 ${index % 2 === 0 ? 'left-4' : 'right-4'}`}
                        >
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        </motion.div>

                        {/* Animated background elements */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: hoveredStep === step.step ? 0.1 : 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <motion.path
                              d="M0,50 Q25,30 50,50 T100,50"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="0.5"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: hoveredStep === step.step ? 1 : 0 }}
                              transition={{ duration: 1 }}
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Connection dots for mobile with animation */}
                  {index < tradingSteps.length - 1 && (
                    <div className="flex justify-center mt-4 mb-4 md:hidden">
                      <motion.div
                        animate={{
                          height: ["32px", "24px", "32px"],
                          background: [
                            "linear-gradient(to bottom, #1e3a8a, #1e40af)",
                            "linear-gradient(to bottom, #2563eb, #3b82f6)",
                            "linear-gradient(to bottom, #1e3a8a, #1e40af)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="w-1 h-8 bg-gradient-to-b from-blue-900 to-blue-800"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-2"
            >
              Built with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Reliable Technology</span>
            </motion.h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our platform uses proven technology for better performance and security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Smart Order Matching",
                description: "Our advanced system ensures you get the best prices for your trades with minimal slippage",
                icon: Code2,
              },
              {
                title: "Secure Trading",
                description:
                  "Built with industry-leading security measures to protect your assets and ensure safe trading",
                icon: ShieldCheck,
              },
              {
                title: "Fast Execution",
                description: "Lightning-fast trade execution with real-time market data and instant order processing",
                icon: Terminal,
              },
              {
                title: "Open Architecture",
                description: "Fully permissionless system allowing anyone to create markets and provide liquidity",
                icon: Puzzle,
              },
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-[#0a0a0a] border border-blue-900/30 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-blue-900/10 relative overflow-hidden group"
              >
                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50"
                  animate={{
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Animated background elements */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                      d="M0,50 Q25,30 50,50 T100,50"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="0.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: index * 0.2 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 1 }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        color: ["#3b82f6", "#60a5fa", "#3b82f6"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <tech.icon className="h-6 w-6" />
                    </motion.div>
                  </motion.div>
                  <motion.h3
                    className="text-xl font-bold"
                    animate={{
                      color: ["#ffffff", "#60a5fa", "#ffffff"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {tech.title}
                  </motion.h3>
                </div>
                <motion.p
                  className="text-gray-400 pl-16 relative z-10"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {tech.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-[#0a0a0a] border border-blue-900/30 rounded-xl p-12 shadow-xl shadow-blue-900/20 relative overflow-hidden"
          >
            {/* Glowing border effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50"
              animate={{
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Animated background elements */}
            <motion.div
              className="absolute inset-0 opacity-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 1 }}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                  d="M0,50 Q25,30 50,50 T100,50"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="0.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            <div className="relative z-10 text-center">
              <motion.h2
                className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ backgroundSize: "200% auto" }}
              >
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Start Trading</span>?
              </motion.h2>
              <motion.p
                className="text-xl text-gray-300 mb-8"
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                Join our platform today and see how easy trading can be. Start small and grow at your own pace.
              </motion.p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/markets" target="_blank">
                  <Button className="bg-gradient-to-r from-blue-800 to-blue-900 text-white hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-900 px-8 py-6 text-lg font-medium rounded-xl border border-blue-800/30 relative overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      Launch App
                      <ExternalLink size={20} />
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main >
  )
}
