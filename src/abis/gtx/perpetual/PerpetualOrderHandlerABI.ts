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
                name: "_orderVault",
                type: "address",
                internalType: "address",
            },
            {
                name: "_wnt",
                type: "address",
                internalType: "address",
            },
            {
                name: "_oracle",
                type: "address",
                internalType: "address",
            },
            {
                name: "_positionHandler",
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
        name: "cancelOrder",
        inputs: [
            {
                name: "_dataStore",
                type: "address",
                internalType: "address",
            },
            {
                name: "_key",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "createOrder",
        inputs: [
            {
                name: "_dataStore",
                type: "address",
                internalType: "address",
            },
            {
                name: "_account",
                type: "address",
                internalType: "address",
            },
            {
                name: "_params",
                type: "tuple",
                internalType: "struct OrderHandler.CreateOrderParams",
                components: [
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
                        name: "market",
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
                        name: "autoCancel",
                        type: "bool",
                        internalType: "bool",
                    },
                ],
            },
        ],
        outputs: [],
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
        name: "executeOrder",
        inputs: [
            {
                name: "_key",
                type: "uint256",
                internalType: "uint256",
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
        name: "orderVault",
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
        name: "wnt",
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
        type: "event",
        name: "OrderCancelled",
        inputs: [
            {
                name: "key",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "OrderCreated",
        inputs: [
            {
                name: "key",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "account",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "receiver",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "cancellationReceiver",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "callbackContract",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "uiFeeReceiver",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "marketToken",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "initialCollateralToken",
                type: "address",
                indexed: false,
                internalType: "address",
            },
            {
                name: "orderType",
                type: "uint8",
                indexed: false,
                internalType: "enum OrderHandler.OrderType",
            },
            {
                name: "sizeDeltaUsd",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "initialCollateralDeltaAmount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "triggerPrice",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "acceptablePrice",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "executionFee",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "updatedAtTime",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "validFromTime",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
            {
                name: "isLong",
                type: "bool",
                indexed: false,
                internalType: "bool",
            },
            {
                name: "isFrozen",
                type: "bool",
                indexed: false,
                internalType: "bool",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "OrderProcessed",
        inputs: [
            {
                name: "key",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "error",
        name: "CollateralTokenPriceIsZero",
        inputs: [],
    },
    {
        type: "error",
        name: "InitialCollateralTokenDoesNotExist",
        inputs: [],
    },
    {
        type: "error",
        name: "InsufficientExecutionFee",
        inputs: [],
    },
    {
        type: "error",
        name: "InsufficientTokenAmount",
        inputs: [],
    },
    {
        type: "error",
        name: "InsufficientWntAmountForExecutionFee",
        inputs: [
            {
                name: "initialCollateralDeltaAmount",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "executionFee",
                type: "uint256",
                internalType: "uint256",
            },
        ],
    },
    {
        type: "error",
        name: "MarketDoesNotExist",
        inputs: [],
    },
    {
        type: "error",
        name: "OnlySelf",
        inputs: [],
    },
    {
        type: "error",
        name: "OrderIsNotValid",
        inputs: [],
    },
    {
        type: "error",
        name: "OrderTypeCannotBeCreated",
        inputs: [
            {
                name: "orderType",
                type: "uint256",
                internalType: "uint256",
            },
        ],
    },
    {
        type: "error",
        name: "OrderTypeCannotBeExecuted",
        inputs: [
            {
                name: "orderType",
                type: "uint256",
                internalType: "uint256",
            },
        ],
    },
    {
        type: "error",
        name: "PriceIsGreaterThanAcceptablePrice",
        inputs: [],
    },
    {
        type: "error",
        name: "TriggerPriceIsGreaterThanCollateralTokenPrice",
        inputs: [],
    },
    {
        type: "error",
        name: "TriggerPriceIsLessThanCollateralTokenPrice",
        inputs: [],
    },
] as const;

export default abi;