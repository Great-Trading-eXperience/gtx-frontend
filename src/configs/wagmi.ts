import { http, createConfig } from "wagmi"
import { arbitrumSepolia, sepolia, Chain } from "wagmi/chains"
import { bitgetWallet, coinbaseWallet, metaMaskWallet, okxWallet, rabbyWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";

export const projectId = "c8d08053460bfe0752116d730dc6393b"

const localChain: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Anvil Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ganache Explorer",
      url: "https://ganache.renakaagusta.dev",
    },
  },
  testnet: true,
};

const conduitChain: Chain = {
  id: 911867,
  name: "Conduit",
  nativeCurrency: {
    decimals: 18,
    name: "Conduit Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://odyssey.ithaca.xyz"],
    },
    public: {
      http: ["https://odyssey.ithaca.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Conduit Explorer",
      url: "https://odyssey-explorer.ithaca.xyz",
    },
  },
  testnet: true,
};

const riseSepolia: Chain = {
  id: 11155931,
  name: "Rise Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.riselabs.xyz"],
    },
    public: {
      http: ["https://testnet.riselabs.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Rise Explorer",
      url: "https://testnet-explorer.riselabs.xyz",
    },
  },
  testnet: true,
};

// Monad
const monad: Chain = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
};

// GTXpresso chain
const gtxpresso: Chain = {
  id: 1020201,
  name: "GTXpresso",
  nativeCurrency: {
    decimals: 18,
    name: "GTX Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.gtx.alwaysbedream.dev"],
    },
    public: {
      http: ["https://rpc.gtx.alwaysbedream.dev"],
    },
  },
  blockExplorers: {
    default: {
      name: "GTXpresso Explorer",
      url: "http://157.173.201.26:4000", // Placeholder - update if there's a real explorer
    },
  },
  testnet: true,
};

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        rabbyWallet,
      ]
    },
    {
      groupName: "Others",
      wallets: [
        walletConnectWallet,
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        bitgetWallet,
      ],
    },
  ],
  { appName: "RainbowKit App", projectId: projectId },
);

export const wagmiConfig = createConfig({
  chains: [
    riseSepolia, 
    localChain, 
    conduitChain, 
    arbitrumSepolia, 
    monad, 
    sepolia, 
    gtxpresso
  ],
  connectors: connectors,
  transports: {
    [riseSepolia.id]: http("https://testnet.riselabs.xyz"),
    [localChain.id]: http("http://127.0.0.1:8545"),
    [conduitChain.id]: http("https://odyssey.ithaca.xyz"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    [sepolia.id]: http("https://sepolia.infura.io/v3/jBG4sMyhez7V13jNTeQKfVfgNa54nCmF"),
    [monad.id]: http("https://testnet-rpc.monad.xyz"),
    [gtxpresso.id]: http("http://157.173.201.26:8547")
  }
})