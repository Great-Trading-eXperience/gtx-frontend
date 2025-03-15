const abi = [
	{
		type: "constructor",
		inputs: [
			{
				name: "_dataStore",
				type: "address",
				internalType: "address",
			},
			{
				name: "_oracle",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "BASE_BORROWING_RATE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "BASE_FUNDING_RATE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "MAX_FUNDING_RATE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "MAX_OPEN_INTEREST",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "MIN_FUNDING_RATE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "OPTIMAL_UTILIZATION_RATE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "SLOPE_ABOVE_OPTIMAL",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "SLOPE_BELOW_OPTIMAL",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
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
		name: "getFundingFee",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "int256",
				internalType: "int256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getGlobalCumulativeFundingFee",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "int256",
				internalType: "int256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getMarketState",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "tuple",
				internalType: "struct MarketHandler.MarketState",
				components: [
					{
						name: "marketTokenSupply",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "longTokenAmount",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "shortTokenAmount",
						type: "uint256",
						internalType: "uint256",
					},
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
					{
						name: "longTokenOpenInterest",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "shortTokenOpenInterest",
						type: "uint256",
						internalType: "uint256",
					},
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getMarketTokens",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
			{
				name: "longTokenAmount",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "shortTokenAmount",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getOpenInterest",
		inputs: [
			{
				name: "_marketToken",
				type: "address",
				internalType: "address",
			},
			{
				name: "_token",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getPoolValueUsd",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "handleDeposit",
		inputs: [
			{
				name: "receiver",
				type: "address",
				internalType: "address",
			},
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
			{
				name: "longTokenAmount",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "shortTokenAmount",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "oracle",
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
		name: "positionHandler",
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
		name: "setFundingFee",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
			{
				name: "amount",
				type: "int256",
				internalType: "int256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setGlobalCumulativeFundingFee",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
			{
				name: "amount",
				type: "int256",
				internalType: "int256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setOpenInterest",
		inputs: [
			{
				name: "market",
				type: "address",
				internalType: "address",
			},
			{
				name: "token",
				type: "address",
				internalType: "address",
			},
			{
				name: "amount",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setPositionHandler",
		inputs: [
			{
				name: "_positionHandler",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "CumulativeFundingFeeSet",
		inputs: [
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "amount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "FundingFeeSet",
		inputs: [
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "amount",
				type: "int256",
				indexed: false,
				internalType: "int256",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "GlobalCumulativeFundingFeeSet",
		inputs: [
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "amount",
				type: "int256",
				indexed: false,
				internalType: "int256",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "OpenInterestSet",
		inputs: [
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "token",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "amount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "MarketDoesNotExist",
		inputs: [],
	},
	{
		type: "error",
		name: "OnlyPositionHandler",
		inputs: [],
	},
	{
		type: "error",
		name: "PositionHandlerAlreadySet",
		inputs: [],
	},
] as const;

export default abi;