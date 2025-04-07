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
			{
				name: "_marketHandler",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "LIQUIDATION_FEE",
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
		name: "MAINTENCANCE_MARGIN_FACTOR",
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
		name: "MAX_LEVERAGE",
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
		name: "POSITION_FEE",
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
		name: "decreasePosition",
		inputs: [
			{
				name: "_order",
				type: "tuple",
				internalType: "struct OrderHandler.Order",
				components: [
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "receiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "cancellationReceiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "callbackContract",
						type: "address",
						internalType: "address",
					},
					{
						name: "uiFeeReceiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "marketToken",
						type: "address",
						internalType: "address",
					},
					{
						name: "initialCollateralToken",
						type: "address",
						internalType: "address",
					},
					{
						name: "orderType",
						type: "uint8",
						internalType: "enum OrderHandler.OrderType",
					},
					{
						name: "sizeDeltaUsd",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "initialCollateralDeltaAmount",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "triggerPrice",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "acceptablePrice",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "executionFee",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "updatedAtTime",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "validFromTime",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "isLong",
						type: "bool",
						internalType: "bool",
					},
					{
						name: "isFrozen",
						type: "bool",
						internalType: "bool",
					},
				],
			},
			{
				name: "_sizeInTokens",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "increasePosition",
		inputs: [
			{
				name: "_order",
				type: "tuple",
				internalType: "struct OrderHandler.Order",
				components: [
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "receiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "cancellationReceiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "callbackContract",
						type: "address",
						internalType: "address",
					},
					{
						name: "uiFeeReceiver",
						type: "address",
						internalType: "address",
					},
					{
						name: "marketToken",
						type: "address",
						internalType: "address",
					},
					{
						name: "initialCollateralToken",
						type: "address",
						internalType: "address",
					},
					{
						name: "orderType",
						type: "uint8",
						internalType: "enum OrderHandler.OrderType",
					},
					{
						name: "sizeDeltaUsd",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "initialCollateralDeltaAmount",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "triggerPrice",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "acceptablePrice",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "executionFee",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "updatedAtTime",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "validFromTime",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "isLong",
						type: "bool",
						internalType: "bool",
					},
					{
						name: "isFrozen",
						type: "bool",
						internalType: "bool",
					},
				],
			},
			{
				name: "_sizeInTokens",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "liquidatePosition",
		inputs: [
			{
				name: "_params",
				type: "tuple",
				internalType: "struct PositionHandler.LiquidatePositionParams",
				components: [
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "market",
						type: "address",
						internalType: "address",
					},
					{
						name: "collateralToken",
						type: "address",
						internalType: "address",
					},
				],
			},
			{
				name: "_liquidator",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "marketHandler",
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
		name: "orderHandler",
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
		name: "setOrderHandler",
		inputs: [
			{
				name: "_orderHandler",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "PositionDecreased",
		inputs: [
			{
				name: "positionKey",
				type: "bytes32",
				indexed: false,
				internalType: "bytes32",
			},
			{
				name: "isLong",
				type: "bool",
				indexed: false,
				internalType: "bool",
			},
			{
				name: "sizeInUsd",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "sizeInTokens",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "collateralAmount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeBorrowingFee",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeFundingFee",
				type: "int256",
				indexed: false,
				internalType: "int256",
			},
			{
				name: "increasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "decreasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "collateralToken",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "account",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "PositionIncreased",
		inputs: [
			{
				name: "positionKey",
				type: "bytes32",
				indexed: false,
				internalType: "bytes32",
			},
			{
				name: "isLong",
				type: "bool",
				indexed: false,
				internalType: "bool",
			},
			{
				name: "sizeInUsd",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "sizeInTokens",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "collateralAmount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeBorrowingFee",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeFundingFee",
				type: "int256",
				indexed: false,
				internalType: "int256",
			},
			{
				name: "increasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "decreasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "collateralToken",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "account",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "PositionLiquidated",
		inputs: [
			{
				name: "positionKey",
				type: "bytes32",
				indexed: false,
				internalType: "bytes32",
			},
			{
				name: "account",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "market",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "collateralToken",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "collateralAmount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeBorrowingFee",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "cumulativeFundingFee",
				type: "int256",
				indexed: false,
				internalType: "int256",
			},
			{
				name: "increasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "decreasedAtTime",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "liquidationFee",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "liquidationPrice",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "liquidator",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "InsufficientPositionSize",
		inputs: [],
	},
	{
		type: "error",
		name: "LeverageExceeded",
		inputs: [
			{
				name: "leverage",
				type: "uint256",
				internalType: "uint256",
			},
		],
	},
	{
		type: "error",
		name: "OnlyOrderHandler",
		inputs: [],
	},
	{
		type: "error",
		name: "OpenInterestExceeded",
		inputs: [
			{
				name: "openInterest",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "maxOpenInterest",
				type: "uint256",
				internalType: "uint256",
			},
		],
	},
	{
		type: "error",
		name: "OrderHandlerAlreadySet",
		inputs: [],
	},
	{
		type: "error",
		name: "PositionLiquidatable",
		inputs: [
			{
				name: "positionKey",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
	},
	{
		type: "error",
		name: "PositionNotLiquidatable",
		inputs: [
			{
				name: "positionKey",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
	},
] as const;

export default abi;