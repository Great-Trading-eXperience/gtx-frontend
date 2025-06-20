import { http, createConfig } from 'wagmi';
import { arbitrumSepolia, sepolia, Chain } from 'wagmi/chains';
import {
	bitgetWallet,
	coinbaseWallet,
	metaMaskWallet,
	okxWallet,
	rabbyWallet,
	rainbowWallet,
	walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { ENABLED_CHAINS } from '@/constants/contract/contract-address';

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

// Monad
const monad: Chain = {
	id: 10143,
	name: 'Monad Testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'Monad Ether',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['https://testnet-rpc.monad.xyz'],
		},
		public: {
			http: ['https://testnet-rpc.monad.xyz'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Monad Explorer',
			url: 'https://testnet.monadexplorer.com',
		},
	},
	testnet: true,
};

// Pharos chain
const pharos: Chain = {
	id: 50002,
	name: 'Pharos',
	nativeCurrency: {
		decimals: 18,
		name: 'PTT',
		symbol: 'PTT',
	},
	rpcUrls: {
		default: {
			http: ['/api/rpc/pharos'],
		},
		public: {
			http: ['/api/rpc/pharos'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Pharos Explorer',
			url: 'https://pharosscan.xyz',
		},
	},
	testnet: true,
};

// GTXpresso chain
const gtxpresso: Chain = {
	id: 1020201,
	name: 'GTXpresso',
	nativeCurrency: {
		decimals: 18,
		name: 'GTX Ether',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['https://rpc.gtx.alwaysbedream.dev'],
		},
		public: {
			http: ['https://rpc.gtx.alwaysbedream.dev'],
		},
	},
	blockExplorers: {
		default: {
			name: 'GTXpresso Explorer',
			url: 'http://157.173.201.26:4000', // Placeholder - update if there's a real explorer
		},
	},
	testnet: true,
};

// GTX chain
const gtxChain: Chain = {
	id: 31338,
	name: 'GTX',
	nativeCurrency: {
		decimals: 18,
		name: 'GTX Ether',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['https://anvil.gtxdex.xyz'],
		},
		public: {
			http: ['https://anvil.gtxdex.xyz'],
		},
	},
	blockExplorers: {
		default: {
			name: 'GTX Explorer',
			url: 'https://indexer-anvil.gtxdex.xyz',
		},
	},
	testnet: true,
};

const connectors = connectorsForWallets(
	[
		{
			groupName: 'Recommended',
			wallets: [okxWallet, rabbyWallet],
		},
		{
			groupName: 'Others',
			wallets: [
				walletConnectWallet,
				metaMaskWallet,
				coinbaseWallet,
				rainbowWallet,
				bitgetWallet,
			],
		},
	],
	{ appName: 'RainbowKit App', projectId: projectId }
);

const allChains = [
	riseSepolia
];

const enabledChains = ENABLED_CHAINS
	? allChains.filter((chain) =>
			ENABLED_CHAINS?.split(',').includes(chain.id.toString())
	  )
	: [pharos, localChain, arbitrumSepolia];

const transports = enabledChains.reduce((acc, chain) => {
	acc[chain.id] = http(chain.rpcUrls.default.http[0]);
	return acc;
}, {} as Record<number, ReturnType<typeof http>>);

export const wagmiConfig = createConfig({
	chains: enabledChains as [Chain, ...Chain[]],
	connectors: connectors,
	transports,
});
