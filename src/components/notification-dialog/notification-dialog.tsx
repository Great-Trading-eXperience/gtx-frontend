"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  message: string
  isSuccess: boolean
}

export function NotificationDialog({ isOpen, onClose, message, isSuccess }: NotificationDialogProps) {
  const [open, setOpen] = useState(isOpen)

  useEffect(() => {
    setOpen(isOpen)
    if (isOpen) {
      const timer = setTimeout(() => {
        setOpen(false)
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={`${isSuccess ? "bg-green-100" : "bg-red-100"} p-6 rounded-lg`}>
        <DialogHeader>
          <DialogTitle className={`${isSuccess ? "text-green-800" : "text-red-800"} text-lg font-semibold`}>
            {isSuccess ? "Success" : "Error"}
          </DialogTitle>
        </DialogHeader>
        <p className={`${isSuccess ? "text-green-700" : "text-red-700"} mt-2`}>{message}</p>
        <Button onClick={onClose} className="mt-4 bg-white text-gray-800 hover:bg-gray-100">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}

