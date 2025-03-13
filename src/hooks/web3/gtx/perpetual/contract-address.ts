// Define chain IDs for various networks
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
  LOCAL_ANVIL: 31337,
  CONDUIT: 911867,
  RISE_SEPOLIA: 11155931,
  MONAD_TESTNET: 10143,
};

// Get the current chain ID from the environment or default to Monad Testnet
export const CURRENT_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID 
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) 
  : CHAIN_IDS.MONAD_TESTNET;

// Token Addresses for Monad Testnet
export const WETH_ADDRESS = "0x2c53Ce7143D24A65410107F50e4AABad9A164480";
export const WBTC_ADDRESS = "0x53f7C389CBB801e2ABfD301deD6D2A1cf330ac0D";
export const USDC_ADDRESS = "0x58389610A3D13e8f380ee2bA077A6F36f2A90834";
export const PEPE_ADDRESS = "0xF9861d7478f8957679b26404Bd6272c39f949C29";
export const TRUMP_ADDRESS = "0x6bc8a42d4B2F4bc8e4c3f9eCFF00B7290Ffa7405";
export const DOGE_ADDRESS = "0x1889CFb8746716a0AC50E59a54f190987C5F04E6";
export const LINK_ADDRESS = "0xe3F98fdA6dBD38c1017754f1675dcE377381c23C";
export const SHIBA_ADDRESS = "0x98691a245a46a62CfD0BD8f05Fe8e11Cfb63cC61";
export const BONK_ADDRESS = "0x4c7A41F77546Ad99Ce0A3a049b113c97A449B8e2";
export const FLOKI_ADDRESS = "0xA7ac69b8760B431a65FFB86B684244d417f776a3";

// Contract addresses organized by chain ID
export const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    PERPETUAL_ROUTER_ADDRESS: '0x' as const,  // Replace with actual mainnet address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0x' as const,  // Replace with actual mainnet address
  },
  
  // Ethereum Sepolia
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    PERPETUAL_ROUTER_ADDRESS: '0x' as const,  // Replace with Sepolia address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0x' as const,  // Replace with Sepolia address
  },
  
  // Arbitrum Sepolia
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    PERPETUAL_ROUTER_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
  },
  
  // Monad Testnet
  [CHAIN_IDS.MONAD_TESTNET]: {
    PERPETUAL_ROUTER_ADDRESS: '0x123456789abcdef0123456789abcdef012345678' as const, // Replace with actual Monad address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0xabcdef0123456789abcdef0123456789abcdef01' as const, // Replace with actual Monad address
  },
  
  // Local development
  [CHAIN_IDS.LOCAL_ANVIL]: {
    PERPETUAL_ROUTER_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const, // Default Anvil deployment address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const, // Default Anvil deployment address
  },
  
  // Conduit
  [CHAIN_IDS.CONDUIT]: {
    PERPETUAL_ROUTER_ADDRESS: '0x' as const,  // Replace with Conduit address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0x' as const,  // Replace with Conduit address
  },
  
  // Rise Sepolia
  [CHAIN_IDS.RISE_SEPOLIA]: {
    PERPETUAL_ROUTER_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
    ORACLE_SERVICE_MANAGER_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
  },
};

// Export current chain's contract addresses
export const {
  PERPETUAL_ROUTER_ADDRESS,
  ORACLE_SERVICE_MANAGER_ADDRESS,
} = CONTRACT_ADDRESSES[CURRENT_CHAIN_ID];

// Export common token list for the current chain
export const COMMON_TOKENS = [
  { 
    address: WETH_ADDRESS as `0x${string}`, 
    symbol: 'WETH', 
    name: 'Wrapped Ether',
    decimals: 18 
  },
  { 
    address: WBTC_ADDRESS as `0x${string}`, 
    symbol: 'WBTC', 
    name: 'Wrapped Bitcoin',
    decimals: 8
  },
  { 
    address: USDC_ADDRESS as `0x${string}`, 
    symbol: 'USDC', 
    name: 'USD Coin',
    decimals: 6
  },
  { 
    address: PEPE_ADDRESS as `0x${string}`, 
    symbol: 'PEPE', 
    name: 'Pepe',
    decimals: 18
  },
  { 
    address: TRUMP_ADDRESS as `0x${string}`, 
    symbol: 'TRUMP', 
    name: 'Trump',
    decimals: 18
  },
  { 
    address: DOGE_ADDRESS as `0x${string}`, 
    symbol: 'DOGE', 
    name: 'Dogecoin',
    decimals: 18
  },
  { 
    address: LINK_ADDRESS as `0x${string}`, 
    symbol: 'LINK', 
    name: 'Chainlink',
    decimals: 18
  },
  { 
    address: SHIBA_ADDRESS as `0x${string}`, 
    symbol: 'SHIB', 
    name: 'Shiba Inu',
    decimals: 18
  },
  { 
    address: BONK_ADDRESS as `0x${string}`, 
    symbol: 'BONK', 
    name: 'Bonk',
    decimals: 18
  },
  { 
    address: FLOKI_ADDRESS as `0x${string}`, 
    symbol: 'FLOKI', 
    name: 'Floki Inu',
    decimals: 18
  }
];