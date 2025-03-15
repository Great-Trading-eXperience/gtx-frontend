const abi = [
	{
		type: "constructor",
		inputs: [
			{
				name: "_dataStore",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "createMarket",
		inputs: [
			{
				name: "_longToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "_shortToken",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "dataStore",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "setMarketActivation",
		inputs: [
			{
				name: "_longToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "_shortToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "_status",
				type: "uint8",
				internalType: "enum MarketFactory.Status",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "MarketActivation",
		inputs: [
			{
				name: "marketToken",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "status",
				type: "uint8",
				indexed: false,
				internalType: "enum MarketFactory.Status",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "MarketCreated",
		inputs: [
			{
				name: "marketToken",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "longToken",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "shortToken",
				type: "address",
				indexed: true,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "MarketAlreadyExists",
		inputs: [
			{
				name: "longToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "shortToken",
				type: "address",
				internalType: "address",
			},
		],
	},
	{
		type: "error",
		name: "MarketDoesNotExists",
		inputs: [
			{
				name: "longToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "shortToken",
				type: "address",
				internalType: "address",
			},
		],
	},
] as const;

export default abi;