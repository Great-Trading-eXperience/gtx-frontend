import { OpenOrderItem } from '@/graphql/gtx/clob';
import { OrderData } from '@/lib/market-api';

// --- Types for Reusability ---
export type SortDirection = 'asc' | 'desc';
export type SortableOrderKey = 'timestamp' | 'filled' | 'orderId' | 'price';
export type OrderItem = OpenOrderItem | OrderData;

// --- Data Normalization Helpers ---

export const getTimestamp = (order: OrderItem): number => {
  return 'timestamp' in order ? Number(order.timestamp) : order.time;
};

export const calculateFillPercentage = (filled: string, quantity: string): string => {
  if (!filled || !quantity) return '0';
  const filledBigInt = BigInt(filled);
  const quantityBigInt = BigInt(quantity);
  if (quantityBigInt === 0n) return '0';
  return ((filledBigInt * 100n) / quantityBigInt).toString();
};

export const getFillPercentage = (order: OrderItem): number => {
  if ('filled' in order && 'quantity' in order) {
    // GraphQL order (OpenOrderItem)
    return parseFloat(calculateFillPercentage(order.filled, order.quantity));
  }
  // Market API order (OrderData)
  return order.executedQty && order.origQty
    ? (parseFloat(order.executedQty) / parseFloat(order.origQty)) * 100
    : 0;
};

export const getOrderId = (order: OrderItem): string => {
  return 'poolId' in order ? order.poolId : order.orderId;
};

export const getPrice = (order: OrderItem): string => {
  const price = order.price;
  return price;
};

export const isOrderCancelable = (order: OrderItem): boolean => {
  return order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED';
};

export const isOpenOrderItem = (order: OrderItem): order is OpenOrderItem => {
  return 'poolId' in order && 'transactionId' in order;
};

// --- Type Conversion Helper (for cancelling OrderData from Market API) ---
export const convertToOpenOrderItem = (
  order: OrderData,
  chainId: number,
  poolId: string
): OpenOrderItem => ({
  chainId: chainId,
  poolId: poolId,
  orderId: BigInt(order.orderId),
  id: order.id,
  side: order.side,
  timestamp: order.time,
  transactionId: order.id,
  price: order.price,
  quantity: order.origQty,
  filled: order.executedQty,
  type: order.type,
  status: order.status,
  expiry: 0,
});
