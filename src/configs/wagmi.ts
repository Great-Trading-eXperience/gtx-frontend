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

export const riseSepolia: Chain = {
	id: 11155931,
	name: 'Rise Sepolia',
	nativeCurrency: {
		decimals: 18,
		name: 'ETH',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['/api/rpc/rise-sepolia'],
		},
		public: {
			http: ['/api/rpc/rise-sepolia'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Rise Explorer',
			url: 'https://testnet-explorer.riselabs.xyz',
		},
	},
	testnet: true,
};

export const wagmiConfig = createConfig({
	chains: [riseSepolia],
	transports: {
		[riseSepolia.id]: http(riseSepolia.rpcUrls.default.http[0]),
	},
});
