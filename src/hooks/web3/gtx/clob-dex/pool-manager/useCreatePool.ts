import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { HexAddress } from '@/types/web3/general/address';
import { POOL_MANAGER_ADDRESS } from '@/constants/contract-address';
import PoolManagerABI from '@/abis/gtx/clob-dex/PoolManagerABI';

// Use the exact type structure expected by the ABI
type PoolKeyStruct = {
  baseCurrency: HexAddress;
  quoteCurrency: HexAddress;
};

export const useCreatePool = () => {
  const [isCreatePoolAlertOpen, setIsCreatePoolAlertOpen] = useState(false);

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
    lotSize: bigint,
    maxOrderAmount: bigint
  ) => {
    try {
      console.log('============ Create Pool Parameters ============');
      console.log('Contract Details:');
      console.log(`Address: ${POOL_MANAGER_ADDRESS}`);
      console.log(`Function: createPool`);
      console.log('\nArguments:');
      console.log(`Base Currency: ${baseCurrency}`);
      console.log(`Quote Currency: ${quoteCurrency}`);
      console.log(`Lot Size: ${lotSize.toString()}`);
      console.log(`Max Order Amount: ${maxOrderAmount.toString()}`);
      console.log('===============================================');

      const poolKey = {
        baseCurrency,
        quoteCurrency
      };

      // Execute the contract write directly without simulation
      writeCreatePool({
        address: POOL_MANAGER_ADDRESS as HexAddress,
        abi: PoolManagerABI,
        functionName: 'createPool',
        args: [
          poolKey,
          lotSize,
          maxOrderAmount
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