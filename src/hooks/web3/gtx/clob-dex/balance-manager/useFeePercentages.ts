import { useQuery } from '@tanstack/react-query';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '@/configs/wagmi';
import BalanceManagerABI from '@/abis/gtx/clob/BalanceManagerABI';
import { useMemo } from "react";
import { HexAddress } from "@/types/general/address";

export function useFeePercentages(balanceManagerAddress : HexAddress) {
  const {
      data: feeTakerData,
      isLoading: feeTakerLoading,
      error: feeTakerError,
    } = useQuery({
      queryKey: ['feeTaker'],
      queryFn: async () => {
        return await readContract(wagmiConfig, {
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'feeTaker',
        })
      }
    })
  
    const {
      data: feeMakerData,
      isLoading: feeMakerLoading,
      error: feeMakerError,
    } = useQuery({
      queryKey: ['feeMaker'],
      queryFn: async () => {
        return await readContract(wagmiConfig, {
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'feeMaker',
        })
      }
    })
  
    const {
      data: feeUnitData,
      isLoading: feeUnitLoading,
      error: feeUnitError,
    } = useQuery({
      queryKey: ['feeUnit'],
      queryFn: async () => {
        return await readContract(wagmiConfig, {
          address: balanceManagerAddress,
          abi: BalanceManagerABI,
          functionName: 'getFeeUnit',
        })
      }
    })

  const takerFeePercent = useMemo(() => {
    if (!feeTakerData || !feeUnitData || feeUnitData === 0n) return 0;
    return Number(feeTakerData) / Number(feeUnitData) * 100;
  }, [feeTakerData, feeUnitData]);

  const makerFeePercent = useMemo(() => {
    if (!feeMakerData || !feeUnitData || feeUnitData === 0n) return 0;
    return Number(feeMakerData) / Number(feeUnitData) * 100;
  }, [feeMakerData, feeUnitData]);

  const isLoading = feeTakerLoading || feeMakerLoading || feeUnitLoading;
  const isError = !!feeTakerError || !!feeMakerError || !!feeUnitError;

  return {
    takerFeePercent,
    makerFeePercent,
    isLoading,
    isError
  };
}
