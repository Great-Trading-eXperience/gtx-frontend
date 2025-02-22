"use client"

import { Button } from "@/components/ui/button"
import { BarChart2, ShieldCheck, Code2, Terminal, Puzzle, Layers, Users, Activity, Lock, Hexagon } from "lucide-react"
import Head from "next/head"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="relative bg-[#050B18] min-h-screen text-white">
      <Head>
        <title>GTX - Great Trading eXperience | Decentralized Perpetual & Spot Trading</title>
        <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <section className="w-full max-w-screen-2xl mx-auto min-h-[90vh] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/blockchain-bg.svg')] bg-repeat opacity-20"></div>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-blue-400 rounded-full"
              style={{
                width: Math.random() * 4 + 2 + "px",
                height: Math.random() * 4 + 2 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
              animate={{
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </div>
        <div className="relative w-full max-w-4xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 text-center"
          >
            <h3 className="text-2xl text-blue-300 font-semibold">Welcome to GTX</h3>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Great Trading <br />
              eXperience
            </h1>
            <p className="text-xl mt-8 text-gray-300 font-light">
              Experience the power of permissionless perpetual futures and spot trading <br />
              with institutional-grade tools and unmatched capital efficiency
            </p>
            <div className="flex justify-center gap-6 mt-12">
              <Link href="/perpetual">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-6 font-semibold text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-400/50"
                >
                  Trade Perpetuals
                </Button>
              </Link>
              <Link href="/spot">
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-cyan-400 text-cyan-300 hover:text-white px-8 py-6 font-semibold text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:bg-cyan-400/20 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] focus:shadow-[0_0_20px_rgba(34,211,238,0.7)]"
                >
                  Spot Trading
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="relative w-full py-20 transition-colors duration-200 overflow-hidden ">
        <div className="w-full lg:px-[12vw] mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
          >
            GTX Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-16 max-w-6xl mx-auto text-center"
          >
            A complete ecosystem for decentralized perpetual and spot trading
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Perpetual Futures",
                description:
                  "Trade with up to 30x leverage using our advanced perpetual futures platform with dynamic funding rates",
                Icon: Activity,
              },
              {
                title: "Curator-Managed Liquidity",
                description: "Benefit from professional traders managing liquidity pools across multiple markets",
                Icon: Users,
              },
              {
                title: "Permissionless Trading",
                description: "Create new markets, provide oracle data, and trade without traditional barriers",
                Icon: Lock,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative backdrop-blur-xl bg-[#0D2341]
                          p-8 flex flex-col items-center text-center
                          rounded-2xl
                          border-2 border-blue-500/50
                          hover:border-blue-400
                          hover:shadow-[0_0_30px_rgba(80,_150,_255,_0.3)]
                          transition-all duration-300 ease-out"
              >
                <div
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 
                              rounded-full flex items-center justify-center mb-6
                              transform group-hover:scale-110 transition-transform duration-300
                              shadow-[0_0_20px_rgba(0,_100,_255,_0.5)]"
                >
                  <feature.Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 flex-grow">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perpetuals Section */}
      <section className="w-full py-20 overflow-hidden">
        <div className="lg:px-[12vw] mx-auto text-center px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
          >
            GTX Perpetual Trading
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-16 max-w-6xl mx-auto text-center"
          >
            Experience institutional-grade perpetual futures trading with advanced features and complete
            decentralization
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Leverage Trading",
                Icon: Layers,
                description:
                  "Trade with up to 30x leverage while maintaining full control of your positions through our advanced risk management system.",
              },
              {
                name: "Dynamic Funding Rates",
                Icon: BarChart2,
                description:
                  "Benefit from hourly funding rate settlements that maintain market equilibrium and provide additional trading opportunities.",
              },
              {
                name: "Secure Oracle System",
                Icon: ShieldCheck,
                description:
                  "Trade with confidence using our zkTLS-powered oracle system that ensures accurate and manipulation-resistant price feeds.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group relative backdrop-blur-xl bg-[#0D2341]
                           p-8 rounded-2xl flex flex-col items-center text-center
                           border-2 border-blue-500/50
                           hover:border-blue-400
                           hover:shadow-[0_0_30px_rgba(80,_150,_255,_0.3)]
                           transition-all duration-300 ease-out
                           z-10"
              >
                <div
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 
                              rounded-full flex items-center justify-center mb-6
                              transform group-hover:scale-110 transition-transform duration-300
                              shadow-[0_0_20px_rgba(0,_100,_255,_0.5)]"
                >
                  <feature.Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.name}</h3>
                <p className="text-gray-300 mb-8 flex-grow">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-20 sm:px-6 lg:px-[12vw] mx-auto ">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
          >
            GTX Technical Architecture
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-16 max-w-6xl mx-auto text-center"
          >
            Built on cutting-edge technology for maximum performance and reliability
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "High-Performance Order Book",
              description:
                "Experience seamless trading with our optimized order book implementation featuring efficient matching engine and bitmap-based tick management.",
              Icon: Code2,
              linkText: "Learn More →",
            },
            {
              title: "Advanced Oracle System",
              description:
                "Reliable price feeds powered by zkTLS technology and multi-source validation ensure accurate and manipulation-resistant mark prices.",
              Icon: Terminal,
              linkText: "View Documentation →",
            },
            {
              title: "Risk Management",
              description:
                "Sophisticated liquidation and margin systems protect users while maintaining market stability and preventing cascading liquidations.",
              Icon: ShieldCheck,
              linkText: "Read More →",
            },
            {
              title: "Open Architecture",
              description:
                "Fully permissionless system allowing anyone to create markets, provide liquidity, and participate in the ecosystem.",
              Icon: Puzzle,
              linkText: "Explore →",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="backdrop-blur-xl bg-[#0D2341]
                         p-8 rounded-2xl shadow-lg flex flex-col
                         border-2 border-blue-500/50
                         hover:border-blue-400
                         hover:shadow-[0_0_30px_rgba(80,_150,_255,_0.3)]
                         transition-all duration-300 ease-out"
            >
              <div className="relative w-full flex items-center justify-center mb-6">
                <Hexagon className="w-24 h-24 text-blue-500 opacity-20" />
                <feature.Icon className="w-12 h-12 text-blue-300 absolute" strokeWidth={2} />
              </div>
              <div className="flex-grow space-y-4">
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
              <a
                href="#"
                className="mt-6 inline-block bg-gradient-to-r from-blue-500 to-cyan-400 
                           text-white py-3 px-6 rounded-lg text-base font-semibold 
                           hover:opacity-80 transition-all duration-300 text-center"
              >
                {feature.linkText}
              </a>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}

