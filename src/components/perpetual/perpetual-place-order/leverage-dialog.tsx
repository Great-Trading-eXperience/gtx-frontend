"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, X, AlertTriangle } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

interface LeverageDialogProps {
  leverage: number
  setLeverage: (value: number) => void
  maxLeverage?: number
}

// Key steps to show markers at
const LEVERAGE_STEPS = [1, 5, 10, 15, 20]

const LeverageBadge = ({ leverage }: { leverage: number }) => {
  return (
    <div className="inline-flex items-center px-2 py-0.5 text-sm font-mono rounded bg-gray-800/60 text-blue-400 border border-gray-700/40 backdrop-blur-sm">
      {leverage}x
    </div>
  )
}

const LeverageDialog = ({ leverage, setLeverage, maxLeverage = 20 }: LeverageDialogProps) => {
  const [open, setOpen] = useState(false)
  const [localLeverage, setLocalLeverage] = useState(leverage)

  useEffect(() => {
    if (open) {
      // Ensure leverage is within range
      setLocalLeverage(Math.min(Math.max(1, leverage), maxLeverage))
    }
  }, [open, leverage, maxLeverage])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  const handleConfirm = () => {
    setLeverage(localLeverage)
    setOpen(false)
  }

  const decrease = () => {
    if (localLeverage > 1) {
      setLocalLeverage(localLeverage - 1)
    }
  }

  const increase = () => {
    if (localLeverage < maxLeverage) {
      setLocalLeverage(localLeverage + 1)
    }
  }

  // Calculate position percentage for any leverage value
  const calculatePosition = (value: number) => {
    return ((value - 1) / (maxLeverage - 1)) * 100
  }

  // Handle slider click or drag
  const handleSliderInteraction = (clientX: number, sliderRect: DOMRect) => {
    const position = (clientX - sliderRect.left) / sliderRect.width
    // Convert position to leverage value and round to nearest integer
    const newLeverage = Math.max(1, Math.min(maxLeverage, Math.round(position * (maxLeverage - 1) + 1)))
    setLocalLeverage(newLeverage)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-900/40 hover:bg-gray-800/50 text-white border border-gray-700/50 transition-all hover:border-gray-600/60 backdrop-blur-sm group"
          aria-label="Adjust leverage"
        >
          <span className="text-gray-300 group-hover:text-white">Leverage</span>
          <LeverageBadge leverage={leverage} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl border border-gray-800 shadow-lg p-6 z-50 transition-all animate-in fade-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-white">
              Adjust <span className="text-blue-400">Leverage</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Current Leverage</div>
              <div className="relative flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-lg p-1 h-14 overflow-hidden">
                <button
                  onClick={decrease}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-gray-700/50 transition-colors z-10"
                  disabled={localLeverage <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="text-2xl font-mono font-semibold text-blue-400 z-10">{localLeverage}x</div>

                <button
                  onClick={increase}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-gray-700/50 transition-colors z-10"
                  disabled={localLeverage >= maxLeverage}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative py-5 px-1">
              <div
                className="w-full h-1 bg-gray-800 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  handleSliderInteraction(e.clientX, rect)
                }}
              >
                {/* Track highlighting based on selected leverage */}
                <div
                  className="absolute h-1 bg-blue-500 rounded-full"
                  style={{
                    width: `${calculatePosition(localLeverage)}%`,
                  }}
                />

                {/* Draggable handle */}
                <div
                  className="absolute w-5 h-5 -mt-2 -ml-2.5 bg-blue-500 rounded-full border-2 border-white cursor-grab active:cursor-grabbing shadow-md transition-transform hover:scale-110"
                  style={{
                    left: `${calculatePosition(localLeverage)}%`,
                  }}
                  onMouseDown={(startEvent) => {
                    startEvent.preventDefault()

                    const sliderTrack = startEvent.currentTarget.parentElement
                    if (!sliderTrack) return

                    const rect = sliderTrack.getBoundingClientRect()

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      handleSliderInteraction(moveEvent.clientX, rect)
                    }

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove)
                      document.removeEventListener("mouseup", handleMouseUp)
                    }

                    document.addEventListener("mousemove", handleMouseMove)
                    document.addEventListener("mouseup", handleMouseUp)
                  }}
                />

                {/* Marker Points at key leverage steps */}
                {LEVERAGE_STEPS.map((step) => {
                  const position = calculatePosition(step)
                  const isLessThanCurrent = step <= localLeverage
                  const isCurrentStep = step === localLeverage

                  return (
                    <div key={step} className="absolute -translate-x-1/2" style={{ left: `${position}%` }}>
                      <div
                        className={cn(
                          "w-3 h-3 -mt-1.5 rounded-full transition-all duration-200 cursor-pointer",
                          isCurrentStep ? "opacity-0" : "", // Hide with opacity instead of removing
                          isLessThanCurrent
                            ? "bg-blue-500 border border-white" // Blue filled circle for values less than or equal to current
                            : "bg-gray-700 border border-gray-600", // Gray outline for values greater than current
                        )}
                        onClick={() => setLocalLeverage(step)}
                      />
                      <div
                        className={cn(
                          "text-xs mt-2 font-mono text-center",
                          isCurrentStep
                            ? "text-blue-400 font-bold"
                            : // Bold and blue for current step
                              isLessThanCurrent
                              ? "text-blue-400"
                              : "text-gray-500",
                        )}
                      >
                        {step}x
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alert container with consistent height */}
            <div className="h-[74px]">
              {localLeverage > 10 ? (
                <div className="flex items-center text-amber-400 text-sm bg-amber-950/30 rounded-lg p-3 border border-amber-800/30 h-full">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-400 flex-shrink-0" />
                  <span>High leverage increases liquidation risk and may result in significant losses.</span>
                </div>
              ) : (
                <div className="h-full opacity-0"></div>
              )}
            </div>

            <div className="w-full">
              <button
                onClick={handleConfirm}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-3 rounded-lg transition-colors text-sm shadow-lg"
              >
                Confirm Leverage
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { LeverageDialog, LeverageBadge }