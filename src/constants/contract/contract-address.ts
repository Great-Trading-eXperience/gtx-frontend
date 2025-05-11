import { HexAddress } from "@/types/general/address";
import contractAddresses from "./contract-address.json";

export enum ContractName {
    clobBalanceManager = "clobBalanceManager",
    clobPoolManager = "clobPoolManager",
    clobRouter = "clobRouter",
    resolverPoolManager = "resolverPoolManager",
    proxyAdminOwner = "proxyAdminOwner",
    openIntentRouter = "openIntentRouter",
    usdc = "usdc",
    weth = "weth",
    wbtc = "wbtc",
    router = "router",
}

interface MailchimpConfig {
    API_KEY: string;
    AUDIENCE_ID: string;
    API_SERVER: string;
}

interface FeatureFlags {
    ENABLED_TABS_MARKETS: boolean;
    ENABLED_TABS_SWAP: boolean;
    ENABLED_TABS_SPOT: boolean;
    ENABLED_TABS_CREATE: boolean;
    ENABLED_TABS_FAUCET: boolean;
    COMING_SOON_PERPETUAL: boolean;
    LANDING_PAGE_RISE: boolean;
	ENABLED_TABS_EARN: boolean;
	ENABLED_TABS_VEGTX: boolean;
	ENABLED_TABS_PERPETUAL: boolean;
}

interface IndexerUrls {
    [chainId: string]: string;
}

interface ExplorerUrls {
    [chainId: string]: string;
}

interface ContractConfig {
    DEFAULT_CHAIN: string;
    USE_SUBGRAPH: boolean;
    FAUCET_ADDRESS: HexAddress | string;
    MARKET_FACTORY_ADDRESS: HexAddress | string;
    ORACLE_ADDRESS: HexAddress | string;
    ORDER_VAULT_ADDRESS: HexAddress | string;
    ROUTER_ADDRESS: HexAddress | string;
    TARGET_DOMAIN: string;
    DESTINATION_DOMAIN: string;
    MAILBOX_ADDRESS: HexAddress | string;
    NETWORK: string;
    ROUTER_OWNER: HexAddress | string;
    ENABLED_CHAINS: string;
    MAILCHIMP: MailchimpConfig;
    FEATURE_FLAGS: FeatureFlags;
    INDEXER_URLS: IndexerUrls;
    EXPLORER_URLS: ExplorerUrls;
    [chainId: string]: Partial<Record<ContractName, string>> | string | boolean | MailchimpConfig | FeatureFlags | IndexerUrls | ExplorerUrls;
}

const contractsConfig = contractAddresses as ContractConfig;

// Extract global config
export const DEFAULT_CHAIN = contractsConfig.DEFAULT_CHAIN;
export const USE_SUBGRAPH = contractsConfig.USE_SUBGRAPH;
export const FAUCET_ADDRESS = contractsConfig.FAUCET_ADDRESS as HexAddress;
export const MARKET_FACTORY_ADDRESS = contractsConfig.MARKET_FACTORY_ADDRESS as HexAddress;
export const ORACLE_ADDRESS = contractsConfig.ORACLE_ADDRESS as HexAddress;
export const ORDER_VAULT_ADDRESS = contractsConfig.ORDER_VAULT_ADDRESS as HexAddress;
export const ROUTER_ADDRESS = contractsConfig.ROUTER_ADDRESS as HexAddress;
export const TARGET_DOMAIN = contractsConfig.TARGET_DOMAIN;
export const DESTINATION_DOMAIN = contractsConfig.DESTINATION_DOMAIN;
export const MAILBOX_ADDRESS = contractsConfig.MAILBOX_ADDRESS as HexAddress;
export const NETWORK = contractsConfig.NETWORK;
export const ROUTER_OWNER = contractsConfig.ROUTER_OWNER as HexAddress;
export const ENABLED_CHAINS = contractsConfig.ENABLED_CHAINS;

// Mailchimp configuration
export const MAILCHIMP = contractsConfig.MAILCHIMP as MailchimpConfig;

// Feature flags
export const FEATURE_FLAGS = contractsConfig.FEATURE_FLAGS as FeatureFlags;

// Indexer URLs
export const INDEXER_URLS = contractsConfig.INDEXER_URLS as IndexerUrls;

// Explorer URLs
export const EXPLORER_URLS = contractsConfig.EXPLORER_URLS as ExplorerUrls;

// Helper function to get indexer URL by chain ID
export function getIndexerUrl(chainId: string | number): string {
    const chainIdString = chainId.toString();
    const url = INDEXER_URLS[chainIdString];
    
    if (!url) {
        throw new Error(`Indexer URL for chain ID ${chainIdString} not found in configuration`);
    }
    
    return url;
}

// Helper function to get explorer URL by chain ID
export function getExplorerUrlConfig(chainId: string | number): string {
    const chainIdString = chainId.toString();
    const url = EXPLORER_URLS[chainIdString];
    
    if (!url) {
        throw new Error(`Explorer URL for chain ID ${chainIdString} not found in configuration`);
    }
    
    return url;
}

export function getContractAddress(
    chainId: string | number = DEFAULT_CHAIN,
    contractName: ContractName
): string {
    const chainIdString = chainId.toString();
    const chainContracts = contractsConfig[chainIdString] as Partial<Record<ContractName, string>>;

    if (!chainContracts) {
        throw new Error(`Chain ID ${chainIdString} not found in configuration`);
    }

    const address = chainContracts[contractName];

    if (!address) {
        throw new Error(
            `Contract ${contractName} not found for chain ID ${chainIdString}`
        );
    }

    return address;
}