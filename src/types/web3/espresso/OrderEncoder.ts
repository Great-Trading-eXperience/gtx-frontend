// utils/OrderEncoder.ts
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import type { HexAddress } from '@/types/web3/general/address';

// Define the OrderData type to match the contract's structure
export interface OrderData {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
  targetInputToken: `0x${string}`;
  targetOutputToken: `0x${string}`;
  amountIn: bigint;
  amountOut: bigint;
  originDomain: number;
  destinationDomain: number;
  targetDomain: number;
  destinationSettler: `0x${string}`;
  sourceSettler: `0x${string}`;
  fillDeadline: number;
  action: number; // This should be number type only
  nonce: number | bigint; // Allow both number and bigint for flexibility
  data: `0x${string}`;
}

// Define a type for the encoded order parameters
type EncodedOrderParams = {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
  targetInputToken: `0x${string}`;
  targetOutputToken: `0x${string}`;
  amountIn: bigint;
  amountOut: bigint;
  originDomain: number;
  destinationDomain: number;
  targetDomain: number;
  destinationSettler: `0x${string}`;
  sourceSettler: `0x${string}`;
  fillDeadline: number;
  action: number;
  nonce: bigint;
  data: `0x${string}`;
};

// Helper function to convert address to bytes32
const toBytes32 = (value: string): `0x${string}` => {
  // If it's already 66 characters long (including '0x'), return as is
  if (value.length === 66) return value as `0x${string}`;
  
  // If it's a standard Ethereum address, pad it
  if (value.startsWith('0x') && value.length === 42) {
    return `0x${value.slice(2).padStart(64, '0')}` as `0x${string}`;
  }
  
  // If it's not a valid address, throw an error
  throw new Error(`Invalid address format: ${value}`);
};

export const OrderEncoder = {
  // Match the contract's orderDataType constant
  orderDataType: (): `0x${string}` => 
    '0x4d7ee07277e60cc3c3182499ecd20fd7e57e51743f1c79f4c0ffa9b1849b60f8' as `0x${string}`,
  
  encode: (orderData: OrderData): `0x${string}` => {
    // Ensure action is a number by converting if needed
    const action = Number(orderData.action);
    
    // Convert nonce to bigint regardless of input type
    const nonce = BigInt(orderData.nonce);
    
    const abiParams = [
      {
        type: 'tuple',
        components: [
          { type: 'bytes32', name: 'sender' },
          { type: 'bytes32', name: 'recipient' },
          { type: 'bytes32', name: 'inputToken' },
          { type: 'bytes32', name: 'outputToken' },
          { type: 'bytes32', name: 'targetInputToken' },
          { type: 'bytes32', name: 'targetOutputToken' },
          { type: 'uint256', name: 'amountIn' },
          { type: 'uint256', name: 'amountOut' },
          { type: 'uint32', name: 'originDomain' },
          { type: 'uint32', name: 'destinationDomain' },
          { type: 'uint32', name: 'targetDomain' },
          { type: 'bytes32', name: 'destinationSettler' },
          { type: 'bytes32', name: 'sourceSettler' },
          { type: 'uint32', name: 'fillDeadline' },
          { type: 'uint8', name: 'action' },
          { type: 'uint256', name: 'nonce' },
          { type: 'bytes', name: 'data' }
        ]
      }
    ];

    return encodeAbiParameters(
      abiParams,
      [{
        sender: orderData.sender,
        recipient: orderData.recipient,
        inputToken: orderData.inputToken,
        outputToken: orderData.outputToken,
        targetInputToken: orderData.targetInputToken,
        targetOutputToken: orderData.targetOutputToken,
        amountIn: orderData.amountIn,
        amountOut: orderData.amountOut,
        originDomain: orderData.originDomain,
        destinationDomain: orderData.destinationDomain,
        targetDomain: orderData.targetDomain,
        destinationSettler: orderData.destinationSettler,
        sourceSettler: orderData.sourceSettler,
        fillDeadline: orderData.fillDeadline,
        action: action,
        nonce: nonce,
        data: orderData.data
      }])
  },
  
  id: (orderData: OrderData): `0x${string}` => {
    const encoded = OrderEncoder.encode(orderData);
    return keccak256(encoded);
  }
};

// Helper function to convert address to bytes32
export const addressToBytes32 = (address: HexAddress): `0x${string}` => {
  return `0x${address.slice(2).padStart(64, '0')}` as `0x${string}`;
};

// Helper function to convert numbers to bigint safely
export const toBigInt = (value: number | string | bigint | undefined, defaultValue: bigint = BigInt(0)): bigint => {
  if (value === undefined) return defaultValue;
  try {
    if (typeof value === 'string') {
      // Remove any non-numeric characters except for decimal points
      const cleanValue = value.replace(/[^\d.]/g, '');
      return BigInt(Math.floor(parseFloat(cleanValue) * 10**18));
    }
    return BigInt(value);
  } catch (e) {
    console.warn('Failed to convert to BigInt:', value);
    return defaultValue;
  }
};

// Helper to determine if a token is native ETH
export const isNativeToken = (address: string): boolean => {
  return address.toLowerCase() === '0x0000000000000000000000000000000000000000';
};

export default OrderEncoder;