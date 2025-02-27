import { HexAddress } from '@/types/web3/general/address';
import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';

type NetworkAddresses = {
  [chainId: number]: HexAddress;
};

export const useOrderBookAddress = () => {
  const chainId = useChainId();
  const [orderBookAddress, setOrderBookAddress] = useState<HexAddress>('0x0000000000000000000000000000000000000000');

  // Define contract addresses for each network
  const addresses: NetworkAddresses = {
    // Rise Sepolia
    11155931: '0x0000000000000000000000000000000000000000', // Replace with actual Rise Sepolia address
    // Local Anvil Chain
    31337: '0x0000000000000000000000000000000000000000', // Replace with local deployment
    // Conduit Chain
    911867: '0x0000000000000000000000000000000000000000', // Replace with Conduit deployment
    // Arbitrum Sepolia
    421614: '0x0000000000000000000000000000000000000000', // Replace with Arbitrum Sepolia deployment
    // Sepolia
    11155111: '0x0000000000000000000000000000000000000000', // Replace with Sepolia deployment
  };

  useEffect(() => {
    if (chainId && addresses[chainId]) {
      setOrderBookAddress(addresses[chainId]);
    } else {
      // Default address or development address
      setOrderBookAddress('0x0000000000000000000000000000000000000000');
      console.warn(`No OrderBook address configured for chain ID: ${chainId}`);
    }
  }, [chainId]);

  return { orderBookAddress };
};