import {
  ContractName,
  DEFAULT_CHAIN,
  getContractAddress,
} from '@/constants/contract/contract-address';

type HexAddress = `0x${string}`;

export const getTokenAddresses = (chainId: string | number = DEFAULT_CHAIN) => {
  try {
    return {
      WETH: getContractAddress(chainId, ContractName.weth) as HexAddress,
      WBTC: getContractAddress(chainId, ContractName.wbtc) as HexAddress,
      USDC: getContractAddress(chainId, ContractName.usdc) as HexAddress,
    };
  } catch (error) {
    console.error(`Failed to get token addresses for chain ${chainId}:`, error);
    // Return empty object as fallback
    return {} as Record<string, HexAddress>;
  }
};

export const getTokensForChain = (chainId: string | number = DEFAULT_CHAIN) => {
  const addresses = getTokenAddresses(chainId);

  return [
    { symbol: 'WETH', address: addresses.WETH },
    { symbol: 'WBTC', address: addresses.WBTC },
    { symbol: 'USDC', address: addresses.USDC },
  ].filter(token => token.address); // Filter out any undefined addresses
};
