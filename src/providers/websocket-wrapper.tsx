'use client'

import { ReactNode } from 'react'
import { WebSocketProvider } from '@/contexts/websocket-context'

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