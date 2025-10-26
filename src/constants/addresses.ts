/**
 * Centralized contract addresses and constants
 * Replace hardcoded values throughout the codebase
 */

export const ADDRESSES = {
  // Native token (zero address)
  NATIVE_TOKEN: '0x0000000000000000000000000000000000000000' as const,
  
  // Multicall3
  MULTICALL3: '0xca11bde05977b3631167028862be2a173976ca11' as const,
  
  // Token mappings for various chains
  TOKENS: {
    // Main tokens
    WETH: '0x97f3d75FcC683c8F557D637196857FA303f7cebd' as const,
    USDC: '0x37e9b288c56B734c0291d37af478F60cE58a9Fc6' as const,
    
    // GTX specific tokens
    GSUSDT: '0xf2dc96d3e25f06e7458fF670Cf1c9218bBb71D9d' as const,
    GSWBTC: '0xd99813A6152dBB2026b2Cd4298CF88fAC1bCf748' as const,
    GSWETH: '0x3ffE82D34548b9561530AFB0593d52b9E9446fC8' as const,
  }
} as const;

export const BYTES32_CONSTANTS = {
  ZERO_BYTES32: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
} as const;