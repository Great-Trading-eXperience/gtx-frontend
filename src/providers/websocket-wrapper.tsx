'use client'

import { ReactNode } from 'react'
import { WebSocketProvider } from '@/providers/websocket-provider'

interface WebSocketWrapperProps {
  children: ReactNode
  url: string
}

export default function WebSocketWrapper({ children, url }: WebSocketWrapperProps) {
  return (
    <WebSocketProvider url={url}>
      {children}
    </WebSocketProvider>
  )
}