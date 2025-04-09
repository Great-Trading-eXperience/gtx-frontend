"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowRight, CheckCircle, Users, Shield, Zap, Clock, Layers, ArrowUpRight, BarChart2, Code2, LineChart, Puzzle, ShieldCheck, Terminal, Wallet } from "lucide-react"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const emailCTARef = useRef<HTMLInputElement>(null)
  const [refrestCounter, setRefreshCounter] = useState<number>(0);
  
  // Fetch subscriber count on component mount
  useEffect(() => {
    const fetchSubscriberCount = async () => {
      try {
        const response = await fetch("/api/subscribers/count")
        const data = await response.json()
        if (data.success) {
          setSubscriberCount(data.count)
        }
      } catch (error) {
        console.error("Failed to fetch subscriber count:", error)
      }
    }

    fetchSubscriberCount()
  }, [refrestCounter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Get the current email value from the ref
      const currentEmail = emailRef.current?.value || ""

      console.log("currentEmail", currentEmail)
      
      // Mailchimp integration
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: currentEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setIsSuccess(true)
      if (emailRef.current) {
        emailRef.current.value = ""
      }
    } catch (err: any) {
      setError(err.message || "Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
      setRefreshCounter(refrestCounter + 1)
    }
  }

  const handleSubmitCTA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Get the current email value from the ref
      const currentEmail = emailCTARef.current?.value || ""

      console.log("currentEmail", currentEmail)
      
      // Mailchimp integration
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: currentEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setIsSuccess(true)
      if (emailCTARef.current) {
        emailCTARef.current.value = ""
      }
    } catch (err: any) {
      setError(err.message || "Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
      setRefreshCounter(refrestCounter + 1)
    }
  }

  return (
    <main className="relative bg-black min-h-screen text-white">
      <DotPattern />

      {/* Hero Section */}
      <section className="w-full mx-auto pt-20 pb-32">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 space-y-8">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-900 text-blue-100 font-semibold rounded-full z-60">
                Early Access
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="block mb-2">Join the</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">
                  eXclusive Waitlist
                </span>
              </h1>

              <p className="text-xl text-gray-300 font-light leading-relaxed">
                Be among the first to experience the power of permissionless spot trading
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                  <Input
                    type="email"
                    ref={emailRef}
                    placeholder="Enter your email address"
                    className="bg-[#121212] border-white/20 h-12 focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      Join Waitlist <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {isSuccess && (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <p>Thank you for joining our waitlist!</p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  By joining, you agree to receive updates about GTX. We respect your privacy and will never share your
                  information.
                </p>
              </form>

              <div className="flex items-center gap-4 pt-4">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">
                    {subscriberCount !== null ? `${subscriberCount}+` : "Loading..."}
                  </span> traders already on the waitlist
                </p>
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="relative">
                {/* Abstract background elements */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-blue-400/10 rounded-3xl blur-2xl"></div>

                {/* Priority Access Card */}
                <div className="relative rounded-2xl bg-[#121212]/90 border border-white/20 overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="bg-[#0A0A0A] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <span className="font-bold text-white">Priority Access</span>
                    </div>
                    <div className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-md text-sm">Limited</div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      {[
                        {
                          title: "Early platform access",
                          description: "Be among the first to trade on GTX before public launch",
                          icon: Clock,
                        },
                        // {
                        //   title: "Priority support",
                        //   description: "Get dedicated support from our team",
                        //   icon: Shield,
                        // },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <item.icon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{item.title}</h3>
                            <p className="text-sm text-gray-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">Waitlist spots remaining</div>
                        <div className="text-sm font-semibold">{subscriberCount !== null ? `${subscriberCount}+` : "Loading..."} / 500</div>
                      </div>
                      <div className="mt-2 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${(subscriberCount ?? 0) / 500 * 100}%` }}
                        ></div>
                      </div>
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
            <h2 className="text-4xl font-bold mb-4 text-white">Trade with Confidence</h2>
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
                accent: "border-l-white",
              },
              {
                title: "Deposit Funds",
                description: "Fund your account with multiple cryptocurrencies for immediate trading",
                icon: ArrowUpRight,
                accent: "border-l-white",
              },
              {
                title: "Start Trading",
                description: "Access spot markets with deep liquidity",
                icon: LineChart,
                accent: "border-l-white",
              },
              {
                title: "Manage Positions",
                description: "Monitor your portfolio and manage risk with advanced trading tools",
                icon: BarChart2,
                accent: "border-l-white",
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`group bg-[#121212] rounded-lg overflow-hidden border-l-4 ${step.accent} hover:shadow-[0_0_30px_rgba(255,_255,_255,_0.1)] transition-all duration-300 z-20`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4">
                      <step.icon size={20} className="text-white" />
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
      
      {/* Technology Benefits Section */}
      <section className="py-20 ">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Built for Performance</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by advanced technologies that set new standards for decentralized trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "High-Performance Order Book",
                description:
                  "Experience seamless trading powered by Rise chain's exceptional performance. Our order book leverages red-black trees and linked lists for efficient matching.",
                icon: Code2,
                // stats: ["2ms Latency", "100k Orders/sec"],
                stats: [],
              },
              // {
              //   title: "Advanced Oracle System",
              //   description:
              //     "Reliable price feeds powered by zkTLS technology and multi-source validation ensure accurate and manipulation-resistant mark prices.",
              //   icon: Terminal,
              //   stats: ["Multi-source Validation", "Tamper-proof Design"],
              // },
              // {
              //   title: "Risk Management System",
              //   description:
              //     "Sophisticated liquidation and margin systems protect users while maintaining market stability and preventing cascading liquidations.",
              //   icon: ShieldCheck,
              //   stats: ["Dynamic Liquidation", "Cross-margin Support"],
              // },
              {
                title: "Open Architecture",
                description:
                  "Fully permissionless system allowing anyone to create markets, provide liquidity, and participate in the ecosystem.",
                icon: Puzzle,
                // stats: ["Permissionless", "Composable"],
                stats: []
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 z-20"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                  </div>

                  <p className="text-gray-300 text-sm mb-6 flex-grow">{feature.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {feature.stats.map((stat, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">
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

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] rounded-2xl border border-white/10 p-8 md:p-12 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to revolutionize your trading?</h2>
                <p className="text-xl text-gray-300">
                  Join the waitlist today and be the first to experience the next generation of decentralized trading.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  ref={emailCTARef}
                  placeholder="Enter your email"
                  className="bg-[#121212] border-white/20 h-12 focus:border-blue-500 text-white min-w-[250px]"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold whitespace-nowrap"
                >
                  {isSubmitting ? "Processing..." : "Join Waitlist"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
