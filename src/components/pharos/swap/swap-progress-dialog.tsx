"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Loader2, ArrowRight, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { OrderAction } from "@/hooks/web3/pharos/useCrossChainOrder"

type SwapProgressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceChain: string
  destinationChain: string
  sourceToken: string
  destinationToken: string
  amount: string
  txHash?: string
  // Added new props to match the updated component usage
  targetDomain?: number
  action?: OrderAction
}

type SwapStep = {
  id: number
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "failed"
}

export function SwapProgressDialog({
  open,
  onOpenChange,
  sourceChain,
  destinationChain,
  sourceToken,
  destinationToken,
  amount,
  txHash = "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
  targetDomain = 0, // Default value to avoid undefined errors
  action = OrderAction.Transfer, // Default to Transfer action
}: SwapProgressDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const isSameChain = sourceChain === destinationChain || targetDomain === 0 || action === OrderAction.Transfer

  // Safe-guard against undefined values
  const safeAmount = amount || "0";
  const safeSourceToken = sourceToken || "tokens";
  const safeDestToken = destinationToken || "tokens";
  const safeSourceChain = sourceChain || "current chain";
  const safeDestChain = destinationChain || "destination chain";

  // Define steps based on action type
  const getCrossChainSteps = (): SwapStep[] => [
    {
      id: 1,
      title: "Initiating Transaction",
      description: `Sending ${safeAmount} from ${safeSourceChain}`,
      status: "pending",
    },
    {
      id: 2,
      title: "Confirming Source Chain Transaction",
      description: "Waiting for block confirmations",
      status: "pending",
    },
    {
      id: 3,
      title: "Bridging Assets",
      description: `Transferring from ${safeSourceChain} to ${safeDestChain}`,
      status: "pending",
    },
    {
      id: 4,
      title: "Finalizing on Destination Chain",
      description: `Receiving tokens on ${safeDestChain}`,
      status: "pending",
    },
  ]

  const getSameChainSteps = (): SwapStep[] => [
    {
      id: 1,
      title: "Initiating Transaction",
      description: `Starting transfer of ${safeAmount}`,
      status: "pending",
    },
    {
      id: 2,
      title: "Confirming Transaction",
      description: "Waiting for block confirmations",
      status: "pending",
    },
  ]

  // Initialize steps based on transaction type
  const [steps, setSteps] = useState<SwapStep[]>(isSameChain ? getSameChainSteps() : getCrossChainSteps())

  // Update steps when transaction type changes
  useEffect(() => {
    setSteps(isSameChain ? getSameChainSteps() : getCrossChainSteps())
  }, [isSameChain, safeAmount, safeSourceChain, safeDestChain])

  // Simulate progress for demo purposes
  useEffect(() => {
    if (!open) return

    // Reset state when dialog opens
    setCurrentStep(0)
    setProgress(0)
    setIsComplete(false)

    // Update steps status to pending
    setSteps(prevSteps => prevSteps.map(step => ({ ...step, status: "pending" })))

    // Simulate progress through each step
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer)
          setIsComplete(true)
          return prev
        }

        // Update current step status to completed
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === prev + 1
              ? { ...step, status: "completed" }
              : step.id === prev + 2
                ? { ...step, status: "processing" }
                : step,
          ),
        )

        return prev + 1
      })

      setProgress((prev) => {
        const newProgress = prev + 100 / steps.length
        return newProgress > 100 ? 100 : newProgress
      })
    }, 2000) // Each step takes 2 seconds in this demo

    return () => clearInterval(timer)
  }, [open, steps.length])

  // Format transaction hash for display
  const formatTxHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`
  }

  // Get transaction details based on action type
  const getTransactionTypeText = (): string => {
    if (action === OrderAction.Transfer) {
      return "transferred";
    } else {
      return "swapped";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isComplete ? (action === OrderAction.Transfer ? "Transfer Completed" : "Swap Completed") : 
              (action === OrderAction.Transfer ? "Transfer in Progress" : "Swap in Progress")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {isComplete ? (
            // Success state
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-medium">
                {action === OrderAction.Transfer ? "Transfer Successful" : "Swap Successful"}
              </h3>
              <p className="text-center text-muted-foreground">
                {`Successfully ${getTransactionTypeText()} ${safeAmount} tokens`}
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Transaction:</span>
                <a
                  href={`https://pharosscan.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  {formatTxHash(txHash)}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              {!isSameChain && (
                <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-md text-sm">
                  <p>Cross-chain transactions may take 5-15 minutes to complete even after this confirmation.</p>
                </div>
              )}
            </div>
          ) : (
            // Progress state
            <>
              <div className="w-full space-y-4">
                {!isSameChain && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{safeSourceChain.substring(0, 1)}</span>
                      </div>
                      <span>{safeSourceChain}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{safeDestChain.substring(0, 1)}</span>
                      </div>
                      <span>{safeDestChain}</span>
                    </div>
                  </div>
                )}

                <Progress value={progress} className="h-2" />

                <div className="space-y-3">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : step.status === "processing" ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                          <div
                            className={`h-5 w-5 rounded-full border-2 ${
                              step.status === "failed" ? "border-red-500" : "border-muted-foreground/30"
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            step.status === "completed"
                              ? "text-green-500"
                              : step.status === "processing"
                                ? "text-primary"
                                : step.status === "failed"
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                <p>Please do not close this window until the transaction is complete</p>
                <p>
                  Transaction: <span className="font-mono">{formatTxHash(txHash)}</span>
                </p>
                {!isSameChain && (
                  <p className="mt-1 text-amber-500">
                    Cross-chain transactions may take 5-15 minutes to fully complete
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center">
          {isComplete && <Button onClick={() => onOpenChange(false)}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}