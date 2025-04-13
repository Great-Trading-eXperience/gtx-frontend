"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, Menu } from 'lucide-react'
import { useState } from "react"

const LandingHeader = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { destination: "/markets", label: "Launch App" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-5 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex items-center justify-between rounded-2xl border border-[#2A3052]/40 bg-[#0D1117]/80 backdrop-blur-xl px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] overflow-hidden">
          {/* Decorative blockchain elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 relative z-10">
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:bg-blue-500/30 transition-all duration-300"></div>
                <img src="/logo/gtx-update.png" alt="GTX Logo" className="h-9 w-9 relative z-10" />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-white text-xl font-bold tracking-wide">GTX</span>
                {/* <span className="text-[10px] text-blue-600/80 font-medium -mt-1">BLOCKCHAIN EXCHANGE</span> */}
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden relative z-10 text-gray-200 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Main Navigation - Desktop */}
          <div className="hidden md:flex items-center justify-center space-x-8 relative z-10">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.destination}
                target={link.label === "Launch App" ? "_blank" : undefined}
                rel={link.label === "Launch App" ? "noopener noreferrer" : undefined}
                className={`relative ${
                  link.label === "Launch App" 
                    ? "group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-600 hover:to-blue-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300"
                    : `text-gray-200 hover:text-white text-sm font-medium transition-colors group ${
                        pathname === link.destination ? "text-white" : ""
                      }`
                }`}
              >
                {link.label}
                {link.label === "Launch App" && (
                  <>
                    <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    <span className="absolute inset-0 rounded-xl border border-white/20 animate-pulse"></span>
                  </>
                )}
                {link.label !== "Launch App" && (
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ${
                      pathname === link.destination ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu */}
          <div className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-[#0D1117]/95 border border-[#2A3052]/40 backdrop-blur-xl shadow-lg transform transition-all duration-200 ${
            mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          } md:hidden`}>
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.destination}
                target={link.label === "Launch App" ? "_blank" : undefined}
                rel={link.label === "Launch App" ? "noopener noreferrer" : undefined}
                className={`block py-3 px-4 ${
                  link.label === "Launch App" 
                    ? "mt-2 text-center bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    : "text-gray-200 hover:text-white font-medium"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
                {link.label === "Launch App" && (
                  <ExternalLink className="inline-block ml-2 h-4 w-4" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
