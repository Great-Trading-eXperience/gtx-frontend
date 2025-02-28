import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
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
  const [simulationParams, setSimulationParams] = useState<{
    key?: PoolKeyStruct;
    lotSize?: bigint;
    maxOrderAmount?: bigint;
  }>();

  // Simulation hook
  // Simulation hook
  const {
    data: simulateData,
    isError: isCreatePoolSimulationError,
    isLoading: isCreatePoolSimulationLoading,
    refetch: refetchCreatePoolSimulation,
    error: simulateError,
  } = useSimulateContract({
    address: POOL_MANAGER_ADDRESS as HexAddress,
    abi: PoolManagerABI,
    functionName: 'createPool',
    args: simulationParams?.key ? [
      simulationParams.key,
      simulationParams.lotSize || BigInt(0),
      simulationParams.maxOrderAmount || BigInt(0)
    ] : [
      { 
        baseCurrency: '0x0000000000000000000000000000000000000000' as HexAddress, 
        quoteCurrency: '0x0000000000000000000000000000000000000000' as HexAddress 
      },
      BigInt(0),
      BigInt(0)
    ],
  });

  // CreatePool transaction hooks
  const {
    data: createPoolHash,
    isPending: isCreatePoolPending,
    writeContract: writeCreatePool
  } = useWriteContract();

  const {
    isLoading: isCreatePoolConfirming,
    isSuccess: isCreatePoolConfirmed
  } = useWaitForTransactionReceipt({
    hash: createPoolHash,
  });

  // State to track if we should run the initial simulation
  const [shouldSimulate, setShouldSimulate] = useState(false);

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

      setSimulationParams({
        key: {
          baseCurrency,
          quoteCurrency
        },
        lotSize,
        maxOrderAmount
      });
      
      // Trigger the simulation now that we have parameters
      setShouldSimulate(true);
      
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
    }
  };

  // Effect to trigger simulation only when user explicitly requests it
  useEffect(() => {
    if (shouldSimulate && simulationParams?.key) {
      console.log('============ Triggering requested simulation ============');
      refetchCreatePoolSimulation();
      setShouldSimulate(false);
    }
  }, [shouldSimulate, simulationParams, refetchCreatePoolSimulation]);

  // Effect for success message
  useEffect(() => {
    if (!isCreatePoolConfirmed) {
      return;
    }
    toast.success('Pool has been created successfully');
    setIsCreatePoolAlertOpen(true);
  }, [isCreatePoolConfirmed]);

  // Effect for simulation errors
  useEffect(() => {
    if (!simulateError || !isCreatePoolSimulationError || isCreatePoolSimulationLoading) {
      return;
    }
    toast.error(simulateError.toString());
  }, [simulateError, isCreatePoolSimulationError, isCreatePoolSimulationLoading]);

  // Effect for executing transaction after successful simulation
  useEffect(() => {
    if (!simulateData || isCreatePoolConfirming) {
      return;
    }
    
    try {
      console.log('Executing transaction with request:', simulateData.request);
      writeCreatePool(simulateData.request);
      setSimulationParams(undefined);
    } catch (error) {
      console.error('Error executing transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute transaction');
    }
  }, [simulateData, isCreatePoolConfirming, writeCreatePool]);

  return {
    isCreatePoolAlertOpen,
    setIsCreatePoolAlertOpen,
    createPoolHash,
    isCreatePoolPending,
    isCreatePoolConfirming,
    handleCreatePool,
    isCreatePoolConfirmed,
    isCreatePoolSimulationError,
    isCreatePoolSimulationLoading,
    simulateError
  };
};