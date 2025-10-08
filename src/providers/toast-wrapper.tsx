'use client'

import { ReactNode } from 'react'
import { ToastProvider } from "@/components/clob-dex/place-order/toastContext"
import ToastContainer from "@/components/clob-dex/place-order/toastContainer"

interface ToastWrapperProps {
  children: ReactNode
}

export default function ToastWrapper({ children }: ToastWrapperProps) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  )
}