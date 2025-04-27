"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, Menu } from 'lucide-react'
import { useState } from "react"
import { motion } from "framer-motion"

const LandingHeader = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { destination: "/markets", label: "Launch App" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-5 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center justify-between rounded-2xl border border-blue-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Animated blockchain background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div 
              className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-blue-500/10 to-purple-500/5 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 relative z-10">
            <Link href="/" className="flex items-center group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <img src="/logo/gtx.png" alt="GTX Logo" className="h-9 w-9 relative z-10" />
              </motion.div>
              <div className="ml-3 flex flex-col">
                <motion.span 
                  className="text-white text-xl font-bold tracking-wide"
                  animate={{
                    textShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 8px rgba(59,130,246,0.5)", "0 0 0px rgba(59,130,246,0)"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  GTX
                </motion.span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <motion.button 
            className="md:hidden relative z-10 text-gray-200 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-6 w-6" />
          </motion.button>

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
                    <motion.span 
                      className="absolute inset-0 rounded-xl border border-white/20"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </>
                )}
                {link.label !== "Launch App" && (
                  <motion.span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300 ${
                      pathname === link.destination ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu */}
          <motion.div 
            className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-[#0a0a0a]/95 border border-blue-900/30 backdrop-blur-xl shadow-lg transform transition-all duration-200 ${
              mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            } md:hidden`}
            initial={false}
            animate={{
              boxShadow: mobileMenuOpen 
                ? "0 4px 30px rgba(0,0,0,0.3)" 
                : "0 4px 30px rgba(0,0,0,0)"
            }}
          >
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.destination}
                target={link.label === "Launch App" ? "_blank" : undefined}
                rel={link.label === "Launch App" ? "noopener noreferrer" : undefined}
                className={`block py-3 px-4 ${
                  link.label === "Launch App" 
                    ? "mt-2 text-center bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-600 hover:to-blue-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]"
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
          </motion.div>
        </motion.div>
      </div>
    </header>
  )
}

export default LandingHeader
