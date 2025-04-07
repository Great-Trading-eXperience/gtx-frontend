"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { writeContract, waitForTransactionReceipt } from "wagmi/actions"
import { wagmiConfig } from "@/configs/wagmi"
import ButtonConnectWallet from "@/components/button-connect-wallet.tsx/button-connect-wallet"

// Import token addresses directly
import {
  WETH_ADDRESS,
  WBTC_ADDRESS,
  USDC_ADDRESS,
  ROUTER_ADDRESS
} from "@/constants/contract-address"

// RouterABI with createMarket function
const RouterABI = [
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "_longToken", type: "address", internalType: "address" },
      { name: "_shortToken", type: "address", internalType: "address" },
      { name: "_tokenPair", type: "string", internalType: "string" },
      {
        name: "_sources",
        type: "tuple[]",
        internalType: "struct IGTXOracleServiceManager.Source[]",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "identifier", type: "string", internalType: "string" },
          { name: "network", type: "string", internalType: "string" },
        ],
      },
    ],
    outputs: [
      { name: "marketToken", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  }
] as const;

type TokenPair = {
  longSymbol: string
  longAddress: string
  shortSymbol: string
  shortAddress: string
  pairName: string
}

const MonadCreateMarket: React.FC = () => {
  const { address, isConnected } = useAccount()
  
  // Pre-defined token pairs for Monad testnet
  const TOKEN_PAIRS: TokenPair[] = [
    {
      longSymbol: "WETH",
      longAddress: WETH_ADDRESS,
      shortSymbol: "USDC",
      shortAddress: USDC_ADDRESS,
      pairName: "WETH/USDC"
    },
    {
      longSymbol: "WBTC",
      longAddress: WBTC_ADDRESS,
      shortSymbol: "USDC",
      shortAddress: USDC_ADDRESS,
      pairName: "WBTC/USDC"
    }
  ]
  
  // Transaction states
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom oracle sources
  const [useCustomSources, setUseCustomSources] = useState(false)
  const [customIdentifier, setCustomIdentifier] = useState("")
  
  // Handle contract call
  const handleCreateMarket = async () => {
    if (selectedPairIndex === null) {
      toast.error("Please select a token pair")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      const selectedPair = TOKEN_PAIRS[selectedPairIndex]
      const longToken = selectedPair.longAddress
      const shortToken = selectedPair.shortAddress
      const tokenPair = selectedPair.pairName
      
      // Log exact values for debugging
      console.log("Creating market with exact parameters:", {
        longToken,
        longTokenType: typeof longToken,
        longTokenLength: longToken.length,
        shortToken,
        shortTokenType: typeof shortToken,
        shortTokenLength: shortToken.length,
        tokenPair,
        router: ROUTER_ADDRESS
      })
      
      // Create oracle sources array with correct network values
      const oracleSources = [
        { 
          name: "geckoterminal", 
          identifier: useCustomSources && customIdentifier ? customIdentifier : longToken, 
          network: "eth" 
        },
        { 
          name: "dexscreener", 
          identifier: useCustomSources && customIdentifier ? customIdentifier : longToken, 
          network: "ethereum" 
        },
        { 
          name: "binance", 
          identifier: `${selectedPair.longSymbol}${selectedPair.shortSymbol}`, 
          network: "" 
        },
        { 
          name: "okx", 
          identifier: `${selectedPair.longSymbol}-${selectedPair.shortSymbol}`, 
          network: "" 
        }
      ]
      
      // Log the sources for debugging
      console.log("Oracle sources:", JSON.stringify(oracleSources))
      
     // Call the contract
const hash = await writeContract(wagmiConfig, {
    address: ROUTER_ADDRESS,
    abi: RouterABI,
    functionName: 'createMarket',
    args: [
      longToken as `0x${string}`,
      shortToken as `0x${string}`,
      tokenPair,
      oracleSources
    ]
  })
      
      setTxHash(hash)
      setIsSubmitting(false)
      setIsConfirming(true)
      toast.success('Market creation submitted. Waiting for confirmation...')
      
      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
      
      setIsConfirming(false)
      
      if (receipt.status === 'success') {
        setIsSuccess(true)
        toast.success(`Market ${tokenPair} created successfully!`)
      } else {
        setError('Transaction failed on-chain')
        toast.error('Transaction failed on-chain')
      }
      
    } catch (err: any) {
      console.error("Market creation error:", err)
      setIsSubmitting(false)
      setIsConfirming(false)
      
      // Extract error reason if available
      let errorMessage = 'Failed to create market'
      
      if (err.message) {
        if (err.message.includes('reverted')) {
          const reasonMatch = err.message.match(/reason="([^"]+)"/);
          if (reasonMatch) {
            errorMessage = `Transaction reverted: ${reasonMatch[1]}`
          } else {
            errorMessage = 'Contract reverted: Check token addresses and parameters'
          }
        } else if (err.message.includes('json') || err.message.includes('HTTP request failed')) {
          errorMessage = 'Network connection error. Please check your RPC endpoint'
        } else {
          errorMessage = err.message.slice(0, 100) // Limit length for UI
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }
  
  const handleReset = () => {
    setIsSuccess(false)
    setTxHash(null)
    setError(null)
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Create Market on Monad
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="py-6 text-center">
              <p className="mb-4 text-gray-500">Connect your wallet to create a market</p>
              <ButtonConnectWallet />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenPair">Select Token Pair</Label>
                  <Select 
                    value={selectedPairIndex !== null ? selectedPairIndex.toString() : undefined}
                    onValueChange={(value) => setSelectedPairIndex(parseInt(value))}
                  >
                    <SelectTrigger id="tokenPair">
                      <SelectValue placeholder="Select token pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKEN_PAIRS.map((pair, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {pair.pairName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPairIndex !== null && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                    <div>
                      <p className="text-sm text-gray-500">Long Token</p>
                      <p className="font-medium">{TOKEN_PAIRS[selectedPairIndex].longSymbol}</p>
                      <p className="text-xs text-gray-400 break-all mt-1">
                        {TOKEN_PAIRS[selectedPairIndex].longAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Short Token</p>
                      <p className="font-medium">{TOKEN_PAIRS[selectedPairIndex].shortSymbol}</p>
                      <p className="text-xs text-gray-400 break-all mt-1">
                        {TOKEN_PAIRS[selectedPairIndex].shortAddress}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Advanced Options */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="customSources" 
                      checked={useCustomSources}
                      onChange={() => setUseCustomSources(!useCustomSources)}
                      className="rounded"
                    />
                    <Label htmlFor="customSources" className="text-sm cursor-pointer">
                      Use custom token identifier
                    </Label>
                  </div>
                </div>
                
                {useCustomSources && (
                  <div className="space-y-2">
                    <Label htmlFor="customIdentifier" className="text-sm">
                      Custom Identifier
                    </Label>
                    <Input
                      id="customIdentifier"
                      value={customIdentifier}
                      onChange={(e) => setCustomIdentifier(e.target.value)}
                      placeholder="Enter custom identifier (e.g. token address)"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      This will be used instead of token address for geckoterminal and dexscreener.
                    </p>
                  </div>
                )}
                
                {/* Transaction Status */}
                {isSuccess && (
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-md text-green-800 dark:text-green-300 text-sm flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <div>
                      <p>Market created successfully!</p>
                      {txHash && (
                        <a 
                          href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View transaction
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md text-red-800 dark:text-red-300 text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                
                {/* Submit Button */}
                {!isSuccess ? (
                  <Button 
                    onClick={handleCreateMarket}
                    disabled={isSubmitting || isConfirming || selectedPairIndex === null}
                    className="w-full"
                  >
                    {isSubmitting || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSubmitting ? "Waiting for wallet confirmation..." : "Processing transaction..."}
                      </>
                    ) : (
                      "Create Market"
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another Market
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MonadCreateMarket