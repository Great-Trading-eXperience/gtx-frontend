import PoolManagerABI from '@/abis/gtx/clob/PoolManagerABI';
import { POOL_MANAGER_ADDRESS } from '@/constants/contract-address';
import { HexAddress } from '@/types/general/address';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

// Define the TradingRules type to match the smart contract structure
type TradingRules = {
  minTradeAmount: bigint;
  minAmountMovement: bigint;
  minPriceMovement: bigint;
  minOrderSize: bigint;
  slippageTreshold: number;
}

export const useCreatePool = () => {
  const [isCreatePoolAlertOpen, setIsCreatePoolAlertOpen] = useState(false);

  const chainId = useChainId();

  // CreatePool transaction hooks
  const {
    data: createPoolHash,
    isPending: isCreatePoolPending,
    writeContract: writeCreatePool,
    error: createPoolError
  } = useWriteContract();

  const {
    isLoading: isCreatePoolConfirming,
    isSuccess: isCreatePoolConfirmed
  } = useWaitForTransactionReceipt({
    hash: createPoolHash,
  });

  const handleCreatePool = async (
    baseCurrency: HexAddress,
    quoteCurrency: HexAddress,
    tradingRules: TradingRules
  ) => {
    try {
      console.log('============ Create Pool Parameters ============');
      console.log('Contract Details:');
      console.log(`Address: ${POOL_MANAGER_ADDRESS(chainId)}`);
      console.log(`Function: createPool`);
      console.log('\nArguments:');
      console.log(`Base Currency: ${baseCurrency}`);
      console.log(`Quote Currency: ${quoteCurrency}`);
      console.log('Trading Rules:');
      console.log(`- Min Trade Amount: ${tradingRules.minTradeAmount.toString()}`);
      console.log(`- Min Amount Movement: ${tradingRules.minAmountMovement.toString()}`);
      console.log(`- Min Price Movement: ${tradingRules.minPriceMovement.toString()}`);
      console.log(`- Min Order Size: ${tradingRules.minOrderSize.toString()}`);
      console.log(`- Slippage Threshold: ${tradingRules.slippageTreshold}%`);
      console.log('===============================================');

      // Execute the contract write directly without simulation
      writeCreatePool({
        address: POOL_MANAGER_ADDRESS(chainId) as `0x${string}`,
        abi: PoolManagerABI,
        functionName: 'createPool',
        args: [
          {
            baseCurrency,
            quoteCurrency
          },
          tradingRules.minTradeAmount,
          tradingRules.minOrderSize
        ]
      });
      
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
    }
  };

  // Effect for success message
  useEffect(() => {
    if (!isCreatePoolConfirmed) {
      return;
    }
    toast.success('Pool has been created successfully');
    setIsCreatePoolAlertOpen(true);
  }, [isCreatePoolConfirmed]);

  // Effect for error handling
  useEffect(() => {
    if (!createPoolError) {
      return;
    }
    toast.error(createPoolError.message || 'Failed to create pool');
  }, [createPoolError]);

  return {
    isCreatePoolAlertOpen,
    setIsCreatePoolAlertOpen,
    createPoolHash,
    isCreatePoolPending,
    isCreatePoolConfirming,
    handleCreatePool,
    isCreatePoolConfirmed,
    createPoolError
  };
};