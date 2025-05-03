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
}

interface ContractConfig {
	[chainId: string]: Partial<Record<ContractName, string>>;
}

const contractsConfig = contractAddresses as ContractConfig;

export function getContractAddress(
	chainId: string | number,
	contractName: ContractName
): string {
	const chainIdString = chainId.toString();
	const chainContracts = contractsConfig[chainIdString];

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
