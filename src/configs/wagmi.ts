import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';
import { Chain } from 'viem/chains';

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
			http: ['https://odyssey.ithaca.xyz'],
		},
		public: {
			http: ['https://odyssey.ithaca.xyz'],
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
			http: ['/api/rpc/rari-testnet'],
		},
		public: {
			http: ['/api/rpc/rari-testnet'],
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
			http: ['/api/rpc/appchain-testnet'],
		},
		public: {
			http: ['/api/rpc/appchain-testnet'],
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

export const wagmiConfig = createConfig({
	chains: [
		// riseTestnet,
		rariTestnet,
		appchainTestnet],
	transports: {
		// [riseTestnet.id]: http(riseTestnet.rpcUrls.default.http[0]),
		[rariTestnet.id]: http(rariTestnet.rpcUrls.default.http[0]),
		[appchainTestnet.id]: http(appchainTestnet.rpcUrls.default.http[0]),
	},
});
