"use client"

import { DotPattern } from "@/components/magicui/dot-pattern"
import { Button } from "@/components/ui/button"
import { BarChart2, ShieldCheck, Code2, Terminal, Puzzle, Layers, Users, Activity, Lock, Hexagon, TrendingUp, Wallet, Target, ArrowUpRight, ChevronRight, Trophy, LineChart, ArrowRightCircle } from "lucide-react"
import Head from "next/head"
import Link from "next/link"

export default function Home() {
  return (
    <main className="relative bg-[#050B18] min-h-screen text-white">
      <DotPattern />
      <Head>
        <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
        <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section - New Clean Design */}
      <section className="w-full mx-auto pt-20 pb-32">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 space-y-8">
              <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 font-semibold rounded-full">
                Next-Gen Trading Platform
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="block mb-2">Great Trading</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">eXperience</span>
              </h1>

              <p className="text-xl text-gray-300 font-light leading-relaxed">
                Experience the power of permissionless perpetual futures and spot trading with institutional-grade tools and unmatched capital efficiency
              </p>

              <div className="flex flex-wrap gap-5 pt-6">
                <Link href="/perpetual">
                  <Button
                    className="relative bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-5 text-base font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-300 border border-blue-400/30"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-md"></div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} />
                      Start Perpetual Trading
                    </div>
                  </Button>
                </Link>

                <Link href="/spot">
                  <Button
                    className="relative bg-[#1A2942] border border-blue-500/30 hover:border-blue-400/40 text-white px-6 py-5 text-base font-bold rounded-md transition-all duration-300 hover:bg-[#1E3151]"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 size={20} />
                      Explore Spot Markets
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="relative">
                {/* Abstract background elements */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-blue-400/10 rounded-3xl blur-2xl"></div>

                {/* Trading dashboard mockup */}
                <div className="relative rounded-2xl bg-[#0D2341]/90 border border-blue-500/30 overflow-hidden shadow-xl">
                  {/* Header with tabs */}
                  <div className="bg-[#0A1A36] px-6 py-4 border-b border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <span className="font-bold text-blue-300">BTC/USD</span>
                      <span className="text-green-400">$89,324.50</span>
                      <span className="text-green-400 text-sm">+2.4%</span>
                    </div>
                    <div className="flex text-sm">
                      <div className="px-3 py-1 bg-blue-500/80 text-white rounded-l-md">1H</div>
                      <div className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-r-md">1D</div>
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="px-6 py-8">
                    {/* Simplified chart */}
                    <div className="h-60 w-full relative">
                      {/* Price grid lines */}
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute w-full h-px bg-blue-500/10" style={{ top: `${i * 25}%` }}>
                          <span className="absolute right-0 transform -translate-y-1/2 text-xs text-gray-400">
                            ${Math.round(89324 - i * 1000)}
                          </span>
                        </div>
                      ))}

                      {/* Chart line - static SVG */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <path
                          d="M0,120 C40,100 80,140 120,80 C160,20 200,60 240,40 C280,20 320,50 360,30"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="3"
                        />
                        <path
                          d="M0,120 C40,100 80,140 120,80 C160,20 200,60 240,40 C280,20 320,50 360,30 L360,180 L0,180 Z"
                          fill="url(#blue-gradient)"
                          opacity="0.2"
                        />
                        <defs>
                          <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Price indicator dot */}
                      <div className="absolute top-[30px] right-[40px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
                    </div>
                  </div>

                  {/* Trading controls */}
                  <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                    <button className="py-3 px-5 bg-green-500/80 text-white font-bold rounded-lg hover:bg-green-600/80 transition-colors">
                      BUY / LONG
                    </button>
                    <button className="py-3 px-5 bg-red-500/80 text-white font-bold rounded-lg hover:bg-red-600/80 transition-colors">
                      SELL / SHORT
                    </button>
                  </div>
                </div>

                {/* Stats floating card */}
                <div className="absolute -right-4 -bottom-16 p-4 bg-[#0D2341] border border-blue-500/30 rounded-xl shadow-lg w-60">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-blue-300">Market Stats</h4>
                    <ArrowRightCircle size={16} className="text-blue-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">24h Volume</span>
                      <span className="text-xs font-medium">$1.2B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Open Interest</span>
                      <span className="text-xs font-medium">$840M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Funding Rate</span>
                      <span className="text-xs font-medium text-green-400">+0.01%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Steps Section */}
      <section className="py-20 ">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
              Trade with Confidence
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A simple, powerful process to maximize your trading potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Create Account",
                description: "Connect your wallet and access all GTX features instantly with no KYC required",
                icon: Wallet,
                accent: "border-l-blue-500"
              },
              {
                title: "Deposit Funds",
                description: "Fund your account with multiple cryptocurrencies for immediate trading",
                icon: ArrowUpRight,
                accent: "border-l-blue-500"
              },
              {
                title: "Start Trading",
                description: "Access perpetual futures with up to 30x leverage or spot markets with deep liquidity",
                icon: LineChart,
                accent: "border-l-blue-400"
              },
              {
                title: "Manage Positions",
                description: "Monitor your portfolio and manage risk with advanced trading tools",
                icon: BarChart2,
                accent: "border-l-blue-400"
              }
            ].map((step, index) => (
              <div
                key={index}
                className={`group bg-[#0D2341] rounded-lg overflow-hidden border-l-4 ${step.accent} hover:shadow-[0_0_30px_rgba(80,_150,_255,_0.2)] transition-all duration-300 z-20`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                      <step.icon size={20} className="text-blue-400" />
                    </div>
                    <span className="text-lg font-bold">{step.title}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Ecosystem Section - Kept intact from previous design */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
              Trading Ecosystem
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three powerful systems designed to give you the ultimate trading advantage
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Perpetual Trading",
                subtitle: "30x Leverage",
                description: "Trade with up to 30x leverage on our advanced perpetual futures platform with transparent dynamic funding rates and precision risk management",
                color: "from-blue-500 to-blue-600",
                icon: Layers,
                linkText: "Trade Perpetuals",
                linkHref: "/perpetual",
                highlights: ["30x max leverage", "Hourly funding rates", "Advanced risk controls"]
              },
              {
                title: "Spot Trading",
                subtitle: "Deep Liquidity",
                description: "Experience seamless spot trading with near-zero slippage, competitive fees, and instant settlement across a wide range of cryptocurrency pairs",
                color: "from-blue-500 to-blue-600",
                icon: ArrowUpRight,
                linkText: "Explore Spot Markets",
                linkHref: "/spot",
                highlights: ["Minimal slippage", "Competitive fees", "Instant settlement"]
              },
              {
                title: "Liquidity Provision",
                subtitle: "Earn Passively",
                description: "Provide liquidity to GTX markets and earn trading fees, funding payments and liquidity incentives while maintaining control of your assets",
                color: "from-blue-500 to-blue-600",
                icon: Users,
                linkText: "Provide Liquidity",
                linkHref: "/liquidity",
                highlights: ["Earn trading fees", "Funding payments", "Liquidity rewards"]
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group backdrop-blur-xl bg-[#0D2341] rounded-2xl overflow-hidden relative border border-blue-500/30 hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(80,_150,_255,_0.2)] transition-all duration-500"
              >
                {/* Diagonal accent */}
                <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${feature.color} rounded-full transform rotate-12 opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>

                <div className="p-8 relative h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                      {feature.subtitle}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300 mb-6 flex-grow">{feature.description}</p>

                  <div className="space-y-4">
                    <div className="border-t border-blue-500/20 pt-4">
                      <ul className="space-y-2">
                        {feature.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-center text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link href={feature.linkHref}>
                      <Button
                        className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 mt-6`}
                      >
                        {feature.linkText}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Benefits Section */}
      <section className="py-20 ">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
              Built for Performance
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by advanced technologies that set new standards for decentralized trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "High-Performance Order Book",
                description: "Experience seamless trading with our optimized order book implementation featuring efficient matching engine and bitmap-based tick management.",
                icon: Code2,
                stats: ["2ms Latency", "100k Orders/sec"]
              },
              {
                title: "Advanced Oracle System",
                description: "Reliable price feeds powered by zkTLS technology and multi-source validation ensure accurate and manipulation-resistant mark prices.",
                icon: Terminal,
                stats: ["Multi-source Validation", "Tamper-proof Design"]
              },
              {
                title: "Risk Management System",
                description: "Sophisticated liquidation and margin systems protect users while maintaining market stability and preventing cascading liquidations.",
                icon: ShieldCheck,
                stats: ["Dynamic Liquidation", "Cross-margin Support"]
              },
              {
                title: "Open Architecture",
                description: "Fully permissionless system allowing anyone to create markets, provide liquidity, and participate in the ecosystem.",
                icon: Puzzle,
                stats: ["Permissionless", "Composable"]
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#0D2341] to-[#0A1A30] rounded-xl overflow-hidden border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 z-20"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon size={24} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                  </div>

                  <p className="text-gray-300 text-sm mb-6 flex-grow">{feature.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {feature.stats.map((stat, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs font-medium">
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}