import { writeContract } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { wagmiConfig } from '@/configs/wagmi';
import { TransactionReceipt, decodeEventLog, Log } from 'viem';
import { ENGINE_ADDRESS } from '@/constants/contract-address';
import PlaceOrderABI from "@/abis/liquidbook/PlaceOrderABI";
import { waitForTransaction } from '@wagmi/core';

interface PlaceOrderParams {
  tick: bigint;
  volume: bigint;
  user: `0x${string}`;
  isBuy: boolean;
  isMarket: boolean;
}

// Only including fields that need frontend processing
interface PlaceOrderEvent {
  orderIndex: bigint;
  remainingVolume: bigint;
}

interface UsePlaceOrderOptions {
  onSuccess?: (result: PlaceOrderResult) => void;
  onError?: (error: Error) => void;
}

interface UsePlaceOrderReturn {
  placeOrder: (params: PlaceOrderParams) => Promise<PlaceOrderResult>;
  isPlacing: boolean;
  error: Error | null;
}

export interface PlaceOrderResult {
  orderIndex?: bigint;      // Make optional since it might not always be available
  remainingVolume?: bigint; // Make optional
  receipt: TransactionReceipt;
}

export const usePlaceOrder = (
  options: UsePlaceOrderOptions = {}
): UsePlaceOrderReturn => {
  const { onSuccess, onError } = options;
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const placeOrder = useCallback(
      async ({
          tick,
          volume,
          user,
          isBuy,
          isMarket,
      }: PlaceOrderParams): Promise<PlaceOrderResult> => {
          setIsPlacing(true);
          setError(null);

          try {
              const hash = await writeContract(wagmiConfig, {
                  address: ENGINE_ADDRESS,
                  abi: PlaceOrderABI,
                  functionName: 'placeOrder',
                  args: [tick, volume, user, isBuy, isMarket],
              });

              const receipt = await waitForTransaction(wagmiConfig, {
                  hash,
              });

              // Safely handle the event parsing
              let orderResult: PlaceOrderResult = {
                  receipt,
              };

              try {
                  const placeOrderLog = receipt.logs.find((log: Log) => {
                      try {
                          const event = decodeEventLog({
                              abi: PlaceOrderABI,
                              data: log.data,
                              topics: log.topics,
                          });
                          return event.eventName === 'PlaceOrder';
                      } catch {
                          return false;
                      }
                  });

                  if (placeOrderLog) {
                      const event = decodeEventLog({
                          abi: PlaceOrderABI,
                          data: placeOrderLog.data,
                          topics: placeOrderLog.topics,
                      }) as unknown as PlaceOrderEvent;

                      orderResult = {
                          ...orderResult,
                          orderIndex: event.orderIndex,
                          remainingVolume: event.remainingVolume,
                      };
                  }
              } catch (eventError) {
                  console.warn('Error parsing event logs:', eventError);
              }

              onSuccess?.(orderResult);
              return orderResult;
          } catch (err: unknown) {
              const error =
                  err instanceof Error
                      ? err
                      : new Error('Failed to place order');

              setError(error);
              onError?.(error);
              throw error;
          } finally {
              setIsPlacing(false);
          }
      },
      [onSuccess, onError]
  );

  return {
      placeOrder,
      isPlacing,
      error,
  };
};