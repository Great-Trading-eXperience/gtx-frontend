import { useQuery } from '@tanstack/react-query';
import {
  fetchAccountData,
  fetchAllOrders,
  fetchOpenOrders,
  AccountData,
  OrderData,
} from '@/lib/market-api';

export const useAccountData = (address: string | undefined) => {
  return useQuery<AccountData | null>({
    queryKey: ['marketAccount', address],
    queryFn: async () => {
      if (!address) return null;
      return await fetchAccountData(address);
    },
    enabled: !!address,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

export const useAllOrders = (address: string | undefined) => {
  return useQuery<OrderData[]>({
    queryKey: ['marketAllOrders', address],
    queryFn: async () => {
      if (!address) return [];
      return await fetchAllOrders(address);
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useOpenOrders = (address: string | undefined) => {
  return useQuery<OrderData[]>({
    queryKey: ['marketOpenOrders', address],
    queryFn: async () => {
      if (!address) return [];
      return await fetchOpenOrders(address);
    },
    enabled: !!address,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};
