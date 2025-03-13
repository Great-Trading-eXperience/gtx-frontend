"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ButtonConnectWallet } from "../button-connect-wallet.tsx/button-connect-wallet"

const SecondHeader = () => {
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const links = [
    { destination: "/", label: "Home" },
    { destination: "/spot", label: "Spot" },
    { destination: "/perpetual", label: "Perpetual" },
    { destination: "/earn", label: "Earn" },
    { destination: "/faucet", label: "Faucet" },
    { destination: "https://github.com/Great-Trading-eXperience", label: "Docs" },
  ]

  const createLinks = [
    { destination: "/spot/create-pool", label: "Create Pool" },
    { destination: "/perpetual/create-market", label: "Create Market" },
  ]

  return (
    <header className="relative z-10 bg-black py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex-shrink-0 mr-10">
          <Link href="/" className="flex items-center justify-center bg-[#111] p-3 rounded-lg">
            <img src="/logo/gtx-white.png" alt="GTX Logo" className="h-6 w-6" />
          </Link>
        </div>

        {/* Main Navigation - Centered */}
        <div className="hidden md:flex items-center justify-center flex-1 space-x-1">
          {links.map((link) => (
            <Link key={link.label} href={link.destination}>
              <Button
                variant="ghost"
                className={cn(
                  "rounded-lg text-white hover:bg-[#1A1B1F] px-4 py-2 text-sm font-medium",
                  pathname === link.destination && "bg-[#0064A7]/20 border border-[#0064A7]/50",
                )}
              >
                {link.label}
              </Button>
            </Link>
          ))}

          {/* Create Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-lg text-white hover:bg-[#1A1B1F] px-4 py-2 text-sm font-medium"
              >
                Create <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A1B1F] border-[#2D2F36] text-white w-56">
              {createLinks.map((link) => (
                <DropdownMenuItem key={link.label} className="focus:bg-[#2D2F36] cursor-pointer">
                  <Link href={link.destination} className="w-full">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side - Connect Wallet */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#111] p-2 rounded-full">
            <span className="text-yellow-300">🌙</span>
          </div>

          <ButtonConnectWallet
            colors={{
              backgroundColor: "bg-[#111]",
              hoverBackgroundColor: "hover:bg-[#2D2F36]",
              textColor: "text-white",
              mode: "solid",
            }}
            className="rounded-lg"
          />
        </div>
      </div>
    </header>
  )
}

export default SecondHeader

