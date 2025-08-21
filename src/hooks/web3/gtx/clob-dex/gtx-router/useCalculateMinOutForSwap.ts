import { useReadContract, useChainId } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useEffect } from 'react'
import GTXRouterABI from '@/abis/gtx/clob/GTXRouterABI'
import { ContractName, getContractAddress } from '@/constants/contract/contract-address'
import { HexAddress } from '@/types/general/address'

interface UseCalculateMinOutForSwapProps {
  srcCurrency: string
  dstCurrency: string
  inputAmount: string
  slippageToleranceBps: number
  srcTokenDecimals?: number
  enabled?: boolean
}

export const useCalculateMinOutForSwap = ({
  srcCurrency,
  dstCurrency,
  inputAmount,
  slippageToleranceBps = 10000, // 100% default slippage
  srcTokenDecimals = 18, // Default to 18 decimals if not provided
  enabled = true
}: UseCalculateMinOutForSwapProps) => {
  const chainId = useChainId()
  
  // Parse input amount to proper format using correct decimals
  const parsedInputAmount = inputAmount && inputAmount !== '0' 
    ? parseUnits(inputAmount, srcTokenDecimals)
    : 0n

  const routerAddress = getContractAddress(chainId, ContractName.clobRouter) as HexAddress
  
  const shouldCallContract = enabled && 
                           !!srcCurrency && 
                           !!dstCurrency && 
                           srcCurrency !== dstCurrency &&
                           !!inputAmount && 
                           inputAmount !== '0' &&
                           parsedInputAmount > 0n

  // Log contract call status
  useEffect(() => {
    if (shouldCallContract) {
      console.log('🚀 calculateMinOutForSwap - Contract call ENABLED:', {
        routerAddress,
        srcCurrency,
        dstCurrency,
        inputAmount,
        parsedInputAmount: parsedInputAmount.toString(),
        srcTokenDecimals,
        slippageToleranceBps,
        chainId
      })
    } else {
      console.log('⏹️ calculateMinOutForSwap - Contract call DISABLED:', {
        enabled,
        srcCurrency: !!srcCurrency,
        dstCurrency: !!dstCurrency,
        currenciesDifferent: srcCurrency !== dstCurrency,
        inputAmount: !!inputAmount,
        inputAmountNotZero: inputAmount !== '0',
        parsedAmountValid: parsedInputAmount > 0n,
        shouldCallContract
      })
    }
  }, [shouldCallContract, routerAddress, srcCurrency, dstCurrency, inputAmount, parsedInputAmount, slippageToleranceBps, chainId, enabled])

  const {
    data: minOutputAmount,
    isError,
    isLoading,
    error,
    refetch
  } = useReadContract({
    address: routerAddress,
    abi: GTXRouterABI,
    functionName: 'calculateMinOutForSwap',
    args: [
      srcCurrency as `0x${string}`,
      dstCurrency as `0x${string}`,
      parsedInputAmount,
      BigInt(slippageToleranceBps)
    ],
    query: {
      enabled: shouldCallContract,
      // Add retry configuration to handle temporary failures
      retry: (failureCount, error) => {
        // Don't retry if it's a contract revert (likely no pool/liquidity)
        if (error?.message?.includes('reverted')) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      }
    }
  })

  // Log contract call results
  useEffect(() => {
    if (shouldCallContract) {
      if (isLoading) {
        console.log('⏳ calculateMinOutForSwap - Loading...')
      } else if (isError) {
        console.error('❌ calculateMinOutForSwap - Error:', error)
        console.error('Contract call details:', {
          address: routerAddress,
          srcCurrency,
          dstCurrency,
          inputAmount,
          parsedInputAmount: parsedInputAmount.toString(),
          srcTokenDecimals,
          slippageToleranceBps
        })
        // Log potential causes of revert
        console.error('Possible causes:')
        console.error('1. No pool exists for this token pair')
        console.error('2. Pool has no liquidity')
        console.error('3. Slippage tolerance too low')
        console.error('4. Input amount too large for available liquidity')
        console.error('5. One of the currency addresses is invalid')
      } else if (minOutputAmount) {
        console.log('✅ calculateMinOutForSwap - Success:', {
          minOutputAmount: minOutputAmount.toString(),
        })
      }
    }
  }, [shouldCallContract, isLoading, isError, error, minOutputAmount, routerAddress, srcCurrency, dstCurrency, inputAmount, parsedInputAmount, slippageToleranceBps])

  return {
    minOutputAmount,
    isError,
    isLoading,
    error,
    refetch,
    // Additional helpful info for debugging
    isContractCallEnabled: shouldCallContract,
    routerAddress
  }
}