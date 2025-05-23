const abi =
    [
        {
            "type": "constructor",
            "inputs": [
                { "name": "_mailbox", "type": "address", "internalType": "address" },
                { "name": "_permit2", "type": "address", "internalType": "address" }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "FILLED",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "GTX_BALANCE_MANAGER_ADDRESS",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "GTX_HOST_CHAIN_ID",
            "inputs": [],
            "outputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "GTX_ROUTER_ADDRESS",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "OPENED",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "PACKAGE_VERSION",
            "inputs": [],
            "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "PERMIT2",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "contract IPermit2" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "REFUNDED",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "RESOLVED_CROSS_CHAIN_ORDER_TYPEHASH",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "SETTLED",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "UNKNOWN",
            "inputs": [],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "destinationGas",
            "inputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
            "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "domains",
            "inputs": [],
            "outputs": [{ "name": "", "type": "uint32[]", "internalType": "uint32[]" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "enrollRemoteRouter",
            "inputs": [
                { "name": "_domain", "type": "uint32", "internalType": "uint32" },
                { "name": "_router", "type": "bytes32", "internalType": "bytes32" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "enrollRemoteRouters",
            "inputs": [
                { "name": "_domains", "type": "uint32[]", "internalType": "uint32[]" },
                { "name": "_addresses", "type": "bytes32[]", "internalType": "bytes32[]" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "fill",
            "inputs": [
                { "name": "_orderId", "type": "bytes32", "internalType": "bytes32" },
                { "name": "_originData", "type": "bytes", "internalType": "bytes" },
                { "name": "_fillerData", "type": "bytes", "internalType": "bytes" }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "filledOrders",
            "inputs": [{ "name": "orderId", "type": "bytes32", "internalType": "bytes32" }],
            "outputs": [
                { "name": "originData", "type": "bytes", "internalType": "bytes" },
                { "name": "fillerData", "type": "bytes", "internalType": "bytes" }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "handle",
            "inputs": [
                { "name": "_origin", "type": "uint32", "internalType": "uint32" },
                { "name": "_sender", "type": "bytes32", "internalType": "bytes32" },
                { "name": "_message", "type": "bytes", "internalType": "bytes" }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "hook",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "contract IPostDispatchHook" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "initialize",
            "inputs": [
                { "name": "_customHook", "type": "address", "internalType": "address" },
                { "name": "_interchainSecurityModule", "type": "address", "internalType": "address" },
                { "name": "_owner", "type": "address", "internalType": "address" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "interchainSecurityModule",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "contract IInterchainSecurityModule" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "lastNonce",
            "inputs": [],
            "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "localDomain",
            "inputs": [],
            "outputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "mailbox",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "contract IMailbox" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "open",
            "inputs": [
                {
                    "name": "_order",
                    "type": "tuple",
                    "internalType": "struct OnchainCrossChainOrder",
                    "components": [
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "openFor",
            "inputs": [
                {
                    "name": "_order",
                    "type": "tuple",
                    "internalType": "struct GaslessCrossChainOrder",
                    "components": [
                        { "name": "originSettler", "type": "address", "internalType": "address" },
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "nonce", "type": "uint256", "internalType": "uint256" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                },
                { "name": "_signature", "type": "bytes", "internalType": "bytes" },
                { "name": "_originFillerData", "type": "bytes", "internalType": "bytes" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "openOrders",
            "inputs": [{ "name": "orderId", "type": "bytes32", "internalType": "bytes32" }],
            "outputs": [{ "name": "orderData", "type": "bytes", "internalType": "bytes" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "orderStatus",
            "inputs": [{ "name": "orderId", "type": "bytes32", "internalType": "bytes32" }],
            "outputs": [{ "name": "status", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "quoteGasPayment",
            "inputs": [{ "name": "_destinationDomain", "type": "uint32", "internalType": "uint32" }],
            "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "refund",
            "inputs": [
                {
                    "name": "_orders",
                    "type": "tuple[]",
                    "internalType": "struct OnchainCrossChainOrder[]",
                    "components": [
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "refund",
            "inputs": [
                {
                    "name": "_orders",
                    "type": "tuple[]",
                    "internalType": "struct GaslessCrossChainOrder[]",
                    "components": [
                        { "name": "originSettler", "type": "address", "internalType": "address" },
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "nonce", "type": "uint256", "internalType": "uint256" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        { "type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
        {
            "type": "function",
            "name": "resolve",
            "inputs": [
                {
                    "name": "_order",
                    "type": "tuple",
                    "internalType": "struct OnchainCrossChainOrder",
                    "components": [
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                }
            ],
            "outputs": [
                {
                    "name": "_resolvedOrder",
                    "type": "tuple",
                    "internalType": "struct ResolvedCrossChainOrder",
                    "components": [
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
                        {
                            "name": "maxSpent",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "minReceived",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "fillInstructions",
                            "type": "tuple[]",
                            "internalType": "struct FillInstruction[]",
                            "components": [
                                { "name": "destinationChainId", "type": "uint256", "internalType": "uint256" },
                                { "name": "destinationSettler", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "originData", "type": "bytes", "internalType": "bytes" }
                            ]
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "resolveFor",
            "inputs": [
                {
                    "name": "_order",
                    "type": "tuple",
                    "internalType": "struct GaslessCrossChainOrder",
                    "components": [
                        { "name": "originSettler", "type": "address", "internalType": "address" },
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "nonce", "type": "uint256", "internalType": "uint256" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderDataType", "type": "bytes32", "internalType": "bytes32" },
                        { "name": "orderData", "type": "bytes", "internalType": "bytes" }
                    ]
                },
                { "name": "_originFillerData", "type": "bytes", "internalType": "bytes" }
            ],
            "outputs": [
                {
                    "name": "_resolvedOrder",
                    "type": "tuple",
                    "internalType": "struct ResolvedCrossChainOrder",
                    "components": [
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
                        {
                            "name": "maxSpent",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "minReceived",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "fillInstructions",
                            "type": "tuple[]",
                            "internalType": "struct FillInstruction[]",
                            "components": [
                                { "name": "destinationChainId", "type": "uint256", "internalType": "uint256" },
                                { "name": "destinationSettler", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "originData", "type": "bytes", "internalType": "bytes" }
                            ]
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "routers",
            "inputs": [{ "name": "_domain", "type": "uint32", "internalType": "uint32" }],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "setDestinationGas",
            "inputs": [
                { "name": "domain", "type": "uint32", "internalType": "uint32" },
                { "name": "gas", "type": "uint256", "internalType": "uint256" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setDestinationGas",
            "inputs": [
                {
                    "name": "gasConfigs",
                    "type": "tuple[]",
                    "internalType": "struct GasRouter.GasRouterConfig[]",
                    "components": [
                        { "name": "domain", "type": "uint32", "internalType": "uint32" },
                        { "name": "gas", "type": "uint256", "internalType": "uint256" }
                    ]
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setGtxBalanceManagerAddress",
            "inputs": [{ "name": "_gtxBalanceManager", "type": "address", "internalType": "address" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setGtxRouterAddress",
            "inputs": [{ "name": "_gtxRouter", "type": "address", "internalType": "address" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setHook",
            "inputs": [{ "name": "_hook", "type": "address", "internalType": "address" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setInterchainSecurityModule",
            "inputs": [{ "name": "_module", "type": "address", "internalType": "address" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "settle",
            "inputs": [{ "name": "_orderIds", "type": "bytes32[]", "internalType": "bytes32[]" }],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "unenrollRemoteRouter",
            "inputs": [{ "name": "_domain", "type": "uint32", "internalType": "uint32" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "unenrollRemoteRouters",
            "inputs": [{ "name": "_domains", "type": "uint32[]", "internalType": "uint32[]" }],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "usedNonces",
            "inputs": [
                { "name": "", "type": "address", "internalType": "address" },
                { "name": "", "type": "uint256", "internalType": "uint256" }
            ],
            "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "witnessHash",
            "inputs": [
                {
                    "name": "_resolvedOrder",
                    "type": "tuple",
                    "internalType": "struct ResolvedCrossChainOrder",
                    "components": [
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
                        {
                            "name": "maxSpent",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "minReceived",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "fillInstructions",
                            "type": "tuple[]",
                            "internalType": "struct FillInstruction[]",
                            "components": [
                                { "name": "destinationChainId", "type": "uint256", "internalType": "uint256" },
                                { "name": "destinationSettler", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "originData", "type": "bytes", "internalType": "bytes" }
                            ]
                        }
                    ]
                }
            ],
            "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
            "stateMutability": "pure"
        },
        {
            "type": "function",
            "name": "witnessTypeString",
            "inputs": [],
            "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "Filled",
            "inputs": [
                { "name": "orderId", "type": "bytes32", "indexed": false, "internalType": "bytes32" },
                { "name": "originData", "type": "bytes", "indexed": false, "internalType": "bytes" },
                { "name": "fillerData", "type": "bytes", "indexed": false, "internalType": "bytes" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "GasSet",
            "inputs": [
                { "name": "domain", "type": "uint32", "indexed": false, "internalType": "uint32" },
                { "name": "gas", "type": "uint256", "indexed": false, "internalType": "uint256" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "HookSet",
            "inputs": [{ "name": "_hook", "type": "address", "indexed": false, "internalType": "address" }],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Initialized",
            "inputs": [{ "name": "version", "type": "uint8", "indexed": false, "internalType": "uint8" }],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "IsmSet",
            "inputs": [{ "name": "_ism", "type": "address", "indexed": false, "internalType": "address" }],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "NonceInvalidation",
            "inputs": [
                { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
                { "name": "nonce", "type": "uint256", "indexed": false, "internalType": "uint256" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Open",
            "inputs": [
                { "name": "orderId", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
                {
                    "name": "resolvedOrder",
                    "type": "tuple",
                    "indexed": false,
                    "internalType": "struct ResolvedCrossChainOrder",
                    "components": [
                        { "name": "user", "type": "address", "internalType": "address" },
                        { "name": "originChainId", "type": "uint256", "internalType": "uint256" },
                        { "name": "openDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "fillDeadline", "type": "uint32", "internalType": "uint32" },
                        { "name": "orderId", "type": "bytes32", "internalType": "bytes32" },
                        {
                            "name": "maxSpent",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "minReceived",
                            "type": "tuple[]",
                            "internalType": "struct Output[]",
                            "components": [
                                { "name": "token", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "amount", "type": "uint256", "internalType": "uint256" },
                                { "name": "recipient", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "chainId", "type": "uint256", "internalType": "uint256" }
                            ]
                        },
                        {
                            "name": "fillInstructions",
                            "type": "tuple[]",
                            "internalType": "struct FillInstruction[]",
                            "components": [
                                { "name": "destinationChainId", "type": "uint256", "internalType": "uint256" },
                                { "name": "destinationSettler", "type": "bytes32", "internalType": "bytes32" },
                                { "name": "originData", "type": "bytes", "internalType": "bytes" }
                            ]
                        }
                    ]
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
                { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Refund",
            "inputs": [{ "name": "orderIds", "type": "bytes32[]", "indexed": false, "internalType": "bytes32[]" }],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Refunded",
            "inputs": [
                { "name": "orderId", "type": "bytes32", "indexed": false, "internalType": "bytes32" },
                { "name": "receiver", "type": "address", "indexed": false, "internalType": "address" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Settle",
            "inputs": [
                { "name": "orderIds", "type": "bytes32[]", "indexed": false, "internalType": "bytes32[]" },
                { "name": "ordersFillerData", "type": "bytes[]", "indexed": false, "internalType": "bytes[]" }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Settled",
            "inputs": [
                { "name": "orderId", "type": "bytes32", "indexed": false, "internalType": "bytes32" },
                { "name": "receiver", "type": "address", "indexed": false, "internalType": "address" }
            ],
            "anonymous": false
        },
        { "type": "error", "name": "InvalidDomain", "inputs": [] },
        { "type": "error", "name": "InvalidGaslessOrderOrigin", "inputs": [] },
        { "type": "error", "name": "InvalidGaslessOrderSettler", "inputs": [] },
        { "type": "error", "name": "InvalidNativeAmount", "inputs": [] },
        { "type": "error", "name": "InvalidNonce", "inputs": [] },
        { "type": "error", "name": "InvalidOrderDomain", "inputs": [] },
        { "type": "error", "name": "InvalidOrderId", "inputs": [] },
        { "type": "error", "name": "InvalidOrderOrigin", "inputs": [] },
        { "type": "error", "name": "InvalidOrderStatus", "inputs": [] },
        {
            "type": "error",
            "name": "InvalidOrderType",
            "inputs": [{ "name": "orderType", "type": "bytes32", "internalType": "bytes32" }]
        },
        {
            "type": "error",
            "name": "InvalidOriginDomain",
            "inputs": [{ "name": "originDomain", "type": "uint32", "internalType": "uint32" }]
        },
        { "type": "error", "name": "InvalidSender", "inputs": [] },
        { "type": "error", "name": "OrderFillExpired", "inputs": [] },
        { "type": "error", "name": "OrderFillNotExpired", "inputs": [] },
        { "type": "error", "name": "OrderOpenExpired", "inputs": [] }
    ]
export default abi;