import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
	bitgetWallet,
	coinbaseWallet,
	metaMaskWallet,
	okxWallet,
	rabbyWallet,
	rainbowWallet,
	walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { Chain } from 'wagmi/chains';

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

const enabledChains = [riseSepolia]

const transports = enabledChains.reduce((acc, chain) => {
	acc[chain.id] = http(chain.rpcUrls.default.http[0]);
	return acc;
}, {} as Record<number, ReturnType<typeof http>>);

export const wagmiConfig = createConfig({
	chains: enabledChains as [Chain, ...Chain[]],
	connectors: connectors,
	transports,
});
