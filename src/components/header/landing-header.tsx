"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LandingHeader = () => {
  const pathname = usePathname()

  const links = [
    { destination: "/", label: "Home" },
    { destination: "/spot", label: "Spot" },
    { destination: "/perpetual", label: "Perpetual" },
    { destination: "/earn", label: "Earn" },
    { destination: "/faucet", label: "Faucet" },
    { destination: "/create", label: "Create" },
    { destination: "/swap", label: "Swap" },
    { destination: "https://github.com/Great-Trading-eXperience", label: "Documentation" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-transparent pt-5 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-xl border border-white/20 bg-black/80 backdrop-blur-md px-6 py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img src="/logo/gtx-update.png" alt="GTX Logo" className="h-7 w-7 mr-2" />
              <span className="text-white text-lg font-medium">GTX</span>
            </Link>
          </div>

          {/* Main Navigation - Centered */}
          <div className="flex items-center justify-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.destination}
                className={`relative text-gray-200 hover:text-white text-sm font-medium transition-colors group ${
                  pathname === link.destination ? "text-white" : ""
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                    pathname === link.destination ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader

