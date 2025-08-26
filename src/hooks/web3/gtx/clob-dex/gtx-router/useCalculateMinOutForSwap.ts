import GTXRouterABI from '@/abis/gtx/clob/GTXRouterABI'
import { ContractName, getContractAddress } from '@/constants/contract/contract-address'
import { isFeatureEnabled, getCoreChain } from '@/constants/features/features-config'
import { HexAddress } from '@/types/general/address'
import { useEffect } from 'react'
import { parseUnits } from 'viem'
import { useChainId, useReadContract } from 'wagmi'

interface UseCalculateMinOutForSwapProps {
  srcCurrency: string
  dstCurrency: string
  inputAmount: string
  slippageToleranceBps: number
  srcTokenDecimals?: number
  enabled?: boolean
  senderAddress?: string // Optional sender address for logging purposes
}

export const useCalculateMinOutForSwap = ({
  srcCurrency,
  dstCurrency,
  inputAmount,
  slippageToleranceBps = 10000, // 100% default slippage
  srcTokenDecimals = 18, // Default to 18 decimals if not provided
  enabled = true,
  senderAddress
}: UseCalculateMinOutForSwapProps) => {
  const currentChainId = useChainId()
  
  // Helper function to get the effective chain ID for contract calls
  const getEffectiveChainId = (chainId: number): number => {
    const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
    const effectiveChainId = crosschainEnabled ? getCoreChain() : chainId;
    console.log('[SWAP] 🔗 Chain selection | Crosschain enabled:', crosschainEnabled, '| Current chain:', chainId, '| Effective chain:', effectiveChainId);
    return effectiveChainId;
  };
  
  const effectiveChainId = getEffectiveChainId(currentChainId);
  
  // Parse input amount to proper format using correct decimals
  const parsedInputAmount = inputAmount && inputAmount !== '0' 
    ? parseUnits(inputAmount, srcTokenDecimals)
    : 0n

  const routerAddress = getContractAddress(effectiveChainId, ContractName.clobRouter) as HexAddress
  
  const shouldCallContract = enabled && 
                           !!srcCurrency && 
                           !!dstCurrency && 
                           srcCurrency !== dstCurrency &&
                           !!inputAmount && 
                           inputAmount !== '0' &&
                           parsedInputAmount > 0n

  // Log every time the hook is invoked
  console.log('[RPC-DEBUG] 🔍 useCalculateMinOutForSwap invoked:', {
    enabled,
    srcCurrency,
    dstCurrency,
    inputAmount,
    shouldCallContract,
    senderAddress: senderAddress || 'Not provided'
  });

  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');

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
        currentChainId,
        effectiveChainId,
        senderAddress: senderAddress || 'Not provided',
        crosschainEnabled
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
        shouldCallContract,
        currentChainId,
        effectiveChainId,
        senderAddress: senderAddress || 'Not provided'
      })
    }
  }, [shouldCallContract, routerAddress, srcCurrency, dstCurrency, inputAmount, parsedInputAmount, slippageToleranceBps, currentChainId, effectiveChainId, enabled, senderAddress, crosschainEnabled])

  const wagmiResult = useReadContract({
    address: routerAddress,
    abi: GTXRouterABI,
    functionName: 'calculateMinOutForSwap',
    chainId: effectiveChainId,
    args: [
      srcCurrency as `0x${string}`,
      dstCurrency as `0x${string}`,
      parsedInputAmount,
      BigInt(slippageToleranceBps)
    ],
    query: {
      enabled: shouldCallContract,
      staleTime: 5000,
      retry: (failureCount, error) => {
        console.log(`[RPC-DEBUG] 🔄 useCalculateMinOutForSwap retry attempt ${failureCount + 1}:`, error?.message);
        if (error?.message?.includes('reverted')) {
          return false
        }
        if (error?.message?.includes('timeout') || error?.message?.includes('abort')) {
          return false
        }
        return failureCount < 2
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      onSuccess: () => {
        console.log('[RPC-DEBUG] ✅ useCalculateMinOutForSwap - Contract call successful');
      },
      onError: (error) => {
        console.error('[RPC-DEBUG] ❌ useCalculateMinOutForSwap - Contract call error:', error);
      },
    }
  });

  const {
    data: minOutputAmount,
    isError,
    isLoading,
    error,
    refetch
  } = wagmiResult

  // Add timeout detection for hanging requests
  useEffect(() => {
    if (shouldCallContract && isLoading) {
      console.log('⏳ calculateMinOutForSwap - Loading started...');
      
      // Set up a timeout to detect hanging requests
      const timeout = setTimeout(() => {
        console.warn('⚠️ calculateMinOutForSwap - Request hanging for > 10 seconds');
        console.warn('This may indicate wagmi/RPC issues with chain:', effectiveChainId);
        console.warn('Router address:', routerAddress);
        console.warn('Consider using a fallback approach');
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [shouldCallContract, isLoading, effectiveChainId, routerAddress]);

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
          slippageToleranceBps,
          currentChainId,
          effectiveChainId,
          senderAddress: senderAddress || 'Not provided',
          crosschainEnabled
        })
        // Log potential causes of revert
        console.error('Possible causes:')
        console.error('1. No pool exists for this token pair')
        console.error('2. Pool has no liquidity')
        console.error('3. Slippage tolerance too low')
        console.error('4. Input amount too large for available liquidity')
        console.error('5. One of the currency addresses is invalid')
      } else if (minOutputAmount !== undefined && minOutputAmount !== null) {
        console.log('✅ calculateMinOutForSwap - Success:', {
          minOutputAmount: minOutputAmount.toString(),
          isZero: minOutputAmount === 0n,
          message: minOutputAmount === 0n ? 'No liquidity/pool available for this pair' : 'Valid output amount',
          senderAddress: senderAddress || 'Not provided',
          currentChainId,
          effectiveChainId,
          inputAmount,
          srcCurrency,
          dstCurrency
        })
      }
    }
  }, [shouldCallContract, isLoading, isError, error, minOutputAmount, routerAddress, srcCurrency, dstCurrency, inputAmount, parsedInputAmount, slippageToleranceBps, senderAddress, currentChainId, effectiveChainId])

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