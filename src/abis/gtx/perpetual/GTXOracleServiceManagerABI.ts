const abi = [
	{
		type: "constructor",
		inputs: [
			{
				name: "_avsDirectory",
				type: "address",
				internalType: "address",
			},
			{
				name: "_stakeRegistry",
				type: "address",
				internalType: "address",
			},
			{
				name: "_rewardsCoordinator",
				type: "address",
				internalType: "address",
			},
			{
				name: "_delegationManager",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "CLAIM_OWNER",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "MAX_PRICE_AGE",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "MAX_PRICE_DEVIATION",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "PRICE_PRECISION",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "SCALING_FACTOR",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "allTaskHashes",
		inputs: [{ name: "", type: "uint32", internalType: "uint32" }],
		outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "allTaskResponses",
		inputs: [
			{ name: "", type: "address", internalType: "address" },
			{ name: "", type: "uint32", internalType: "uint32" },
		],
		outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "avsDirectory",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "createAVSRewardsSubmission",
		inputs: [
			{
				name: "rewardsSubmissions",
				type: "tuple[]",
				internalType: "struct IRewardsCoordinator.RewardsSubmission[]",
				components: [
					{
						name: "strategiesAndMultipliers",
						type: "tuple[]",
						internalType: "struct IRewardsCoordinator.StrategyAndMultiplier[]",
						components: [
							{
								name: "strategy",
								type: "address",
								internalType: "contract IStrategy",
							},
							{
								name: "multiplier",
								type: "uint96",
								internalType: "uint96",
							},
						],
					},
					{
						name: "token",
						type: "address",
						internalType: "contract IERC20",
					},
					{ name: "amount", type: "uint256", internalType: "uint256" },
					{
						name: "startTimestamp",
						type: "uint32",
						internalType: "uint32",
					},
					{ name: "duration", type: "uint32", internalType: "uint32" },
				],
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "deregisterOperatorFromAVS",
		inputs: [{ name: "operator", type: "address", internalType: "address" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "getOperatorRestakedStrategies",
		inputs: [{ name: "_operator", type: "address", internalType: "address" }],
		outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getPrice",
		inputs: [
			{
				name: "_tokenAddress",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getRestakeableStrategies",
		inputs: [],
		outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getSources",
		inputs: [
			{
				name: "_tokenAddress",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "tuple[]",
				internalType: "struct IGTXOracleServiceManager.Source[]",
				components: [
					{ name: "name", type: "string", internalType: "string" },
					{
						name: "identifier",
						type: "string",
						internalType: "string",
					},
					{ name: "network", type: "string", internalType: "string" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "initialize",
		inputs: [
			{
				name: "_marketFactory",
				type: "address",
				internalType: "address",
			},
			{
				name: "_minBlockInterval",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "_maxBlockInterval",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "latestTaskNum",
		inputs: [],
		outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "marketFactory",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "maxBlockInterval",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "minBlockInterval",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "owner",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "pairs",
		inputs: [
			{ name: "tokenAddress", type: "address", internalType: "address" },
		],
		outputs: [{ name: "tokenPair", type: "string", internalType: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "prices",
		inputs: [
			{ name: "tokenAddress", type: "address", internalType: "address" },
		],
		outputs: [
			{ name: "value", type: "uint256", internalType: "uint256" },
			{ name: "timestamp", type: "uint256", internalType: "uint256" },
			{ name: "blockNumber", type: "uint256", internalType: "uint256" },
			{
				name: "minBlockInterval",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "maxBlockInterval",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "registerOperatorToAVS",
		inputs: [
			{ name: "operator", type: "address", internalType: "address" },
			{
				name: "operatorSignature",
				type: "tuple",
				internalType: "struct ISignatureUtils.SignatureWithSaltAndExpiry",
				components: [
					{ name: "signature", type: "bytes", internalType: "bytes" },
					{ name: "salt", type: "bytes32", internalType: "bytes32" },
					{ name: "expiry", type: "uint256", internalType: "uint256" },
				],
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "renounceOwnership",
		inputs: [],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "requestNewOracleTask",
		inputs: [
			{
				name: "_tokenAddress",
				type: "address",
				internalType: "address",
			},
			{
				name: "_tokenAddress2",
				type: "address",
				internalType: "address",
			},
			{ name: "_tokenPair", type: "string", internalType: "string" },
			{
				name: "_sources",
				type: "tuple[]",
				internalType: "struct IGTXOracleServiceManager.Source[]",
				components: [
					{ name: "name", type: "string", internalType: "string" },
					{
						name: "identifier",
						type: "string",
						internalType: "string",
					},
					{ name: "network", type: "string", internalType: "string" },
				],
			},
		],
		outputs: [{ name: "taskId", type: "uint32", internalType: "uint32" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "requestOraclePriceTask",
		inputs: [
			{
				name: "_tokenAddress",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [{ name: "taskId", type: "uint32", internalType: "uint32" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "respondToOracleTask",
		inputs: [
			{
				name: "task",
				type: "tuple",
				internalType: "struct IGTXOracleServiceManager.OracleTask",
				components: [
					{
						name: "tokenAddress",
						type: "address",
						internalType: "address",
					},
					{
						name: "tokenAddress2",
						type: "address",
						internalType: "address",
					},
					{
						name: "taskCreatedBlock",
						type: "uint32",
						internalType: "uint32",
					},
					{ name: "isNewData", type: "bool", internalType: "bool" },
					{ name: "tokenPair", type: "string", internalType: "string" },
					{
						name: "sources",
						type: "tuple[]",
						internalType: "struct IGTXOracleServiceManager.Source[]",
						components: [
							{ name: "name", type: "string", internalType: "string" },
							{
								name: "identifier",
								type: "string",
								internalType: "string",
							},
							{
								name: "network",
								type: "string",
								internalType: "string",
							},
						],
					},
				],
			},
			{ name: "_price", type: "uint256", internalType: "uint256" },
			{
				name: "referenceTaskIndex",
				type: "uint32",
				internalType: "uint32",
			},
			{ name: "signature", type: "bytes", internalType: "bytes" },
			{
				name: "proof",
				type: "tuple",
				internalType: "struct Reclaim.Proof",
				components: [
					{
						name: "claimInfo",
						type: "tuple",
						internalType: "struct Claims.ClaimInfo",
						components: [
							{
								name: "provider",
								type: "string",
								internalType: "string",
							},
							{
								name: "parameters",
								type: "string",
								internalType: "string",
							},
							{
								name: "context",
								type: "string",
								internalType: "string",
							},
						],
					},
					{
						name: "signedClaim",
						type: "tuple",
						internalType: "struct Claims.SignedClaim",
						components: [
							{
								name: "claim",
								type: "tuple",
								internalType: "struct Claims.CompleteClaimData",
								components: [
									{
										name: "identifier",
										type: "bytes32",
										internalType: "bytes32",
									},
									{
										name: "owner",
										type: "address",
										internalType: "address",
									},
									{
										name: "timestampS",
										type: "uint32",
										internalType: "uint32",
									},
									{
										name: "epoch",
										type: "uint32",
										internalType: "uint32",
									},
								],
							},
							{
								name: "signatures",
								type: "bytes[]",
								internalType: "bytes[]",
							},
						],
					},
				],
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "rewardsInitiator",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "setPrice",
		inputs: [
			{
				name: "_tokenAddress",
				type: "address",
				internalType: "address",
			},
			{ name: "_price", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setRewardsInitiator",
		inputs: [
			{
				name: "newRewardsInitiator",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "sources",
		inputs: [
			{
				name: "tokenAddress",
				type: "address",
				internalType: "address",
			},
			{ name: "", type: "uint256", internalType: "uint256" },
		],
		outputs: [
			{ name: "name", type: "string", internalType: "string" },
			{ name: "identifier", type: "string", internalType: "string" },
			{ name: "network", type: "string", internalType: "string" },
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "stakeRegistry",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "transferOwnership",
		inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "updateAVSMetadataURI",
		inputs: [{ name: "_metadataURI", type: "string", internalType: "string" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "Initialize",
		inputs: [
			{
				name: "marketFactory",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Initialized",
		inputs: [
			{
				name: "version",
				type: "uint8",
				indexed: false,
				internalType: "uint8",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "NewOracleTaskCreated",
		inputs: [
			{
				name: "taskIndex",
				type: "uint32",
				indexed: true,
				internalType: "uint32",
			},
			{
				name: "task",
				type: "tuple",
				indexed: false,
				internalType: "struct IGTXOracleServiceManager.OracleTask",
				components: [
					{
						name: "tokenAddress",
						type: "address",
						internalType: "address",
					},
					{
						name: "tokenAddress2",
						type: "address",
						internalType: "address",
					},
					{
						name: "taskCreatedBlock",
						type: "uint32",
						internalType: "uint32",
					},
					{ name: "isNewData", type: "bool", internalType: "bool" },
					{ name: "tokenPair", type: "string", internalType: "string" },
					{
						name: "sources",
						type: "tuple[]",
						internalType: "struct IGTXOracleServiceManager.Source[]",
						components: [
							{ name: "name", type: "string", internalType: "string" },
							{
								name: "identifier",
								type: "string",
								internalType: "string",
							},
							{
								name: "network",
								type: "string",
								internalType: "string",
							},
						],
					},
				],
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "OraclePriceUpdated",
		inputs: [
			{
				name: "tokenAddress",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "tokenPair",
				type: "string",
				indexed: true,
				internalType: "string",
			},
			{
				name: "price",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "timestamp",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "OracleSourceCreated",
		inputs: [
			{
				name: "tokenAddress",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "tokenPair",
				type: "string",
				indexed: true,
				internalType: "string",
			},
			{
				name: "sources",
				type: "tuple[]",
				indexed: false,
				internalType: "struct IGTXOracleServiceManager.Source[]",
				components: [
					{ name: "name", type: "string", internalType: "string" },
					{
						name: "identifier",
						type: "string",
						internalType: "string",
					},
					{ name: "network", type: "string", internalType: "string" },
				],
			},
			{
				name: "operator",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "OracleTaskResponded",
		inputs: [
			{
				name: "taskIndex",
				type: "uint32",
				indexed: true,
				internalType: "uint32",
			},
			{
				name: "task",
				type: "tuple",
				indexed: false,
				internalType: "struct IGTXOracleServiceManager.OracleTask",
				components: [
					{
						name: "tokenAddress",
						type: "address",
						internalType: "address",
					},
					{
						name: "tokenAddress2",
						type: "address",
						internalType: "address",
					},
					{
						name: "taskCreatedBlock",
						type: "uint32",
						internalType: "uint32",
					},
					{ name: "isNewData", type: "bool", internalType: "bool" },
					{ name: "tokenPair", type: "string", internalType: "string" },
					{
						name: "sources",
						type: "tuple[]",
						internalType: "struct IGTXOracleServiceManager.Source[]",
						components: [
							{ name: "name", type: "string", internalType: "string" },
							{
								name: "identifier",
								type: "string",
								internalType: "string",
							},
							{
								name: "network",
								type: "string",
								internalType: "string",
							},
						],
					},
				],
			},
			{
				name: "operator",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "signature",
				type: "bytes",
				indexed: false,
				internalType: "bytes",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "OwnershipTransferred",
		inputs: [
			{
				name: "previousOwner",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "newOwner",
				type: "address",
				indexed: true,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "RewardsInitiatorUpdated",
		inputs: [
			{
				name: "prevRewardsInitiator",
				type: "address",
				indexed: false,
				internalType: "address",
			},
			{
				name: "newRewardsInitiator",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "BlockIntervalInvalid",
		inputs: [
			{ name: "id", type: "uint256", internalType: "uint256" },
			{ name: "blockNumber", type: "uint256", internalType: "uint256" },
			{
				name: "previousBlockNumber",
				type: "uint256",
				internalType: "uint256",
			},
		],
	},
	{ type: "error", name: "InvalidClaimOwner", inputs: [] },
	{ type: "error", name: "InvalidPrice", inputs: [] },
	{ type: "error", name: "InvalidSignature", inputs: [] },
	{ type: "error", name: "InvalidToken", inputs: [] },
	{
		type: "error",
		name: "OperatorAlreadyResponded",
		inputs: [
			{ name: "id", type: "uint256", internalType: "uint256" },
			{ name: "operator", type: "address", internalType: "address" },
		],
	},
	{ type: "error", name: "PriceDeviationTooLarge", inputs: [] },
	{
		type: "error",
		name: "SourcesAlreadyExist",
		inputs: [{ name: "token", type: "address", internalType: "address" }],
	},
	{
		type: "error",
		name: "SourcesEmpty",
		inputs: [{ name: "token", type: "address", internalType: "address" }],
	},
	{ type: "error", name: "StalePrice", inputs: [] },
	{ type: "error", name: "SuppliedTaskMismatch", inputs: [] },
] as const;

export default abi;