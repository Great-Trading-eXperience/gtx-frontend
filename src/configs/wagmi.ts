import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';
import { Chain } from 'viem/chains';
import { API_ENDPOINTS } from '@/constants/endpoints';

export const projectId = 'c8d08053460bfe0752116d730dc6393b';

export const conduitChain: Chain = {
  id: 911867,
  name: 'Conduit',
  nativeCurrency: {
    decimals: 18,
    name: 'Conduit Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [API_ENDPOINTS.RPC.ODYSSEY],
    },
    public: {
      http: [API_ENDPOINTS.RPC.ODYSSEY],
    },
  },
  blockExplorers: {
    default: {
      name: 'Conduit Explorer',
      url: 'https://odyssey-explorer.ithaca.xyz',
    },
  },
  testnet: true,
};

// export const riseTestnet: Chain = {
// 	id: 11155931,
// 	name: 'Rise Testnet',
// 	nativeCurrency: {
// 		decimals: 18,
// 		name: 'ETH',
// 		symbol: 'ETH',
// 	},
// 	rpcUrls: {
// 		default: {
// 			http: ['/api/rpc/rise-sepolia'],
// 		},
// 		public: {
// 			http: ['/api/rpc/rise-sepolia'],
// 		},
// 	},
// 	blockExplorers: {
// 		default: {
// 			name: 'Rise Explorer',
// 			url: 'https://testnet-explorer.riselabs.xyz',
// 		},
// 	},
// 	testnet: true,
// };

export const rariTestnet: Chain = {
  id: 1918988905,
  name: 'Rari Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.rarichain.org/http'],
    },
    public: {
      http: ['https://testnet.rpc.rarichain.org/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Rari Explorer',
      url: 'https://rari-testnet.hub.caldera.xyz',
    },
  },
  testnet: true,
};

export const appchainTestnet: Chain = {
  id: 4661,
  name: 'Appchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://appchain.caff.testnet.espresso.network'],
    },
    public: {
      http: ['https://appchain.caff.testnet.espresso.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Appchain Explorer',
      url: 'https://appchaintestnet.hub.caldera.xyz',
    },
  },
  testnet: true,
};

export const arbitrumSepolia: Chain = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'Arbitrum Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
      apiUrl: 'https://api-sepolia.arbiscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
  testnet: true,
};

export const coreDevnet: Chain = {
  id: 31337,
  name: 'Core Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['/core-devnet'],
    },
    public: {
      http: ['/core-devnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Core Devnet Explorer',
      url: 'http://localhost:8545',
    },
  },
  testnet: true,
};

export const sideDevnet: Chain = {
	id: 31338,
	name: 'Side Devnet',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['/side-devnet'],
		},
		public: {
			http: ['/side-devnet'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Side Devnet Explorer',
			url: 'http://localhost:8546',
		},
	},
	testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [coreDevnet, sideDevnet],
  transports: {
    [coreDevnet.id]: http(coreDevnet.rpcUrls.default.http[0]),
    [sideDevnet.id]: http(sideDevnet.rpcUrls.default.http[0]),
  },
});
