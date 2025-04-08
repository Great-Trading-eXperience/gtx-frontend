import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join the Waitlist | GTX - Next-Gen Trading Platform",
  description:
    "Join the exclusive waitlist for GTX, the next-generation trading platform with institutional-grade tools and unmatched capital efficiency.",
}

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
