"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, X, Copy, ExternalLink } from "lucide-react"

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  message: string
  isSuccess: boolean
  txHash?: string
}

export function NotificationDialog({ isOpen, onClose, message, isSuccess, txHash }: NotificationDialogProps) {
  const [open, setOpen] = useState(isOpen)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOpen(isOpen)
    if (isOpen) {
      const timer = setTimeout(() => {
        setOpen(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const handleCopy = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl rounded-xl max-w-md">
        <div className="relative">
          {/* High contrast gradient background */}
          <div
            className={`absolute inset-0 ${
              isSuccess
                ? "bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500"
                : "bg-gradient-to-r from-red-900 via-red-700 to-red-500"
            } opacity-50`}
          />

          <div className="relative p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start space-x-4">
              <div className={`rounded-full p-2 ${isSuccess ? "bg-white text-blue-600" : "bg-white text-red-600"}`}>
                {isSuccess ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
              </div>

              <div className="flex-1">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">
                    {isSuccess ? "Transaction Successful" : "Transaction Failed"}
                  </DialogTitle>
                </DialogHeader>

                <p className="mt-2 text-white text-opacity-90">{message}</p>

                {isSuccess && txHash && (
                  <div className="mt-4 p-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white text-opacity-80">Transaction Hash</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-white hover:text-blue-200 p-0 flex items-center gap-1"
                        onClick={handleCopy}
                      >
                        {copied ? "Copied!" : "Copy"} {!copied && <Copy size={12} />}
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-white truncate mt-1">{txHash}</p>
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  {isSuccess && txHash && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10 flex items-center gap-1"
                      onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, "_blank")}
                    >
                      View on Explorer <ExternalLink size={14} />
                    </Button>
                  )}
                  {/* <Button
                    onClick={onClose}
                    className={`${
                      isSuccess ? "bg-white text-blue-700 hover:bg-gray-100" : "bg-white text-red-700 hover:bg-gray-100"
                    } border-0 font-medium`}
                    size="sm"
                  >
                    Close
                  </Button> */}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative blockchain-inspired elements with higher contrast */}
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white bg-opacity-30" />
          <div className="absolute -left-3 -bottom-3 w-8 h-8 rounded-full bg-white opacity-30" />
          <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-white opacity-30" />
          <div className="absolute left-1/4 -bottom-1 w-4 h-4 rounded-full bg-white opacity-20" />
          <div className="absolute right-1/3 -top-1 w-3 h-3 rounded-full bg-white opacity-20" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

