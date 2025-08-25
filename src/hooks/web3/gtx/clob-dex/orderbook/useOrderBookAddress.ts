import { HexAddress } from '@/types/general/address';
import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { isFeatureEnabled, getCoreChain } from '@/constants/features/features-config';

type NetworkAddresses = {
  [chainId: number]: HexAddress;
};

export const useOrderBookAddress = () => {
  const chainId = useChainId();
  const [orderBookAddress, setOrderBookAddress] = useState<HexAddress>('0x0000000000000000000000000000000000000000');

  // Use core chain when crosschain is enabled
  const crosschainEnabled = isFeatureEnabled('CROSSCHAIN_DEPOSIT_ENABLED');
  const effectiveChainId = crosschainEnabled ? getCoreChain() : chainId;

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
    // Rari Testnet
    1918988905: '0x0000000000000000000000000000000000000000', // Replace with Rari Testnet deployment
  };

  useEffect(() => {
    if (effectiveChainId && addresses[effectiveChainId]) {
      setOrderBookAddress(addresses[effectiveChainId]);
      console.log('[ORDERBOOK] 🔗 Using chain:', effectiveChainId, '| Address:', addresses[effectiveChainId]);
    } else {
      // Default address or development address
      setOrderBookAddress('0x0000000000000000000000000000000000000000');
      console.warn(`No OrderBook address configured for chain ID: ${effectiveChainId} (crosschain: ${crosschainEnabled})`);
    }
  }, [effectiveChainId, crosschainEnabled, addresses]);

  return { orderBookAddress };
};