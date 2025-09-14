'use client'

import { ReactNode } from 'react'
import Providers from "@/providers/privy-provider" // Your existing provider

interface PrivyWrapperProps {
  children: ReactNode
}

export default function PrivyWrapper({ children }: PrivyWrapperProps) {
  return <Providers>{children}</Providers>
}