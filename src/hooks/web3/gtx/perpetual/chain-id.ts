import { DEFAULT_CHAIN } from "@/constants/contract/contract-address";
import { getTokenAddresses } from "@/helper/token-helper";
import type { HexAddress } from "@/types/general/address";

// Define chain IDs for various networks
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
  LOCAL_ANVIL: 31337,
  CONDUIT: 911867,
  RISE_SEPOLIA: 11155931,
  MONAD_TESTNET: 10143,
  RARI_TESTNET: 1918988905,
  APPCHAIN_TESTNET: 4661,
};

// Get the current chain ID from contract-address.json or fallback to environment variable
export const CURRENT_CHAIN_ID = parseInt(DEFAULT_CHAIN) ||
  (process.env.NEXT_PUBLIC_CHAIN_ID
    ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
    : CHAIN_IDS.MONAD_TESTNET);

// Contract addresses organized by chain ID
export const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with actual mainnet address
    ORACLE_ADDRESS: '0x' as const,  // Replace with actual mainnet address
  },

  // Ethereum Sepolia
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Sepolia address
  },

  // Arbitrum Sepolia
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
  },

  // Monad Testnet
  [CHAIN_IDS.MONAD_TESTNET]: {
    ROUTER_ADDRESS: '0x123456789abcdef0123456789abcdef012345678' as const, // Replace with actual Monad address
    ORACLE_ADDRESS: '0xabcdef0123456789abcdef0123456789abcdef01' as const, // Replace with actual Monad address
  },

  // Local development
  [CHAIN_IDS.LOCAL_ANVIL]: {
    ROUTER_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const, // Default Anvil deployment address
    ORACLE_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const, // Default Anvil deployment address
  },

  // Conduit
  [CHAIN_IDS.CONDUIT]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Conduit address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Conduit address
  },

  // Rise Sepolia
  [CHAIN_IDS.RISE_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
  },

  // Rari Testnet
  [CHAIN_IDS.RARI_TESTNET]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Rari Testnet address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Rari Testnet address
  },

  // Appchain Testnet
  [CHAIN_IDS.APPCHAIN_TESTNET]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Appchain Testnet address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Appchain Testnet address
  },
};

// Export current chain's router and oracle addresses
export const {
  ROUTER_ADDRESS,
  ORACLE_ADDRESS,
} = CONTRACT_ADDRESSES[CURRENT_CHAIN_ID];

// Get token addresses for the current chain
const { WETH: WETH_ADDRESS, WBTC: WBTC_ADDRESS, USDC: USDC_ADDRESS } = getTokenAddresses(CURRENT_CHAIN_ID.toString());

// Export token addresses for convenience
export { USDC_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS };

// Export common token list for the current chain
export const COMMON_TOKENS = [
  {
    address: WETH_ADDRESS as HexAddress,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18
  },
  {
    address: WBTC_ADDRESS as HexAddress,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoins',
    decimals: 8
  },
  {
    address: USDC_ADDRESS as HexAddress,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
].filter(token => token.address); // Filter out any tokens with undefined addresses