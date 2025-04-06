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

export const OrderEncoder = {
  // Match the contract's orderDataType constant
  orderDataType: (): `0x${string}` => 
    '0x4d7ee07277e60cc3c3182499ecd20fd7e57e51743f1c79f4c0ffa9b1849b60f8' as `0x${string}`,
  
  encode: (orderData: OrderData): `0x${string}` => {
    // Ensure action is a number by converting if needed
    const action = Number(orderData.action);
    
    // Convert nonce to bigint regardless of input type
    const nonce = BigInt(orderData.nonce);
    
    return encodeAbiParameters(
      parseAbiParameters([
        'bytes32 sender,', 
        'bytes32 recipient,', 
        'bytes32 inputToken,', 
        'bytes32 outputToken,', 
        'bytes32 targetInputToken', 
        'bytes32 targetOutputToken', 
        'uint256 amountIn,', 
        'uint256 amountOut,', 
        'uint32 originDomain,', 
        'uint32 destinationDomain,', 
        'uint32 targetDomain,', 
        'bytes32 destinationSettler,', 
        'bytes32 sourceSettler,', 
        'uint32 fillDeadline,', 
        'uint8 action,', 
        'uint256 nonce,',
        'bytes data'
      ]),
      [
        orderData.sender,
        orderData.recipient,
        orderData.inputToken,
        orderData.outputToken,
        orderData.targetInputToken,
        orderData.targetOutputToken,
        orderData.amountIn,
        orderData.amountOut,
        orderData.originDomain,
        orderData.destinationDomain,
        orderData.targetDomain,
        orderData.destinationSettler,
        orderData.sourceSettler,
        orderData.fillDeadline,
        action, // Use the converted action
        nonce, // Use the converted nonce
        orderData.data
      ]
    );
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