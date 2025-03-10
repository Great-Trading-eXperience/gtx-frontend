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
          name: "_depositHandler",
          type: "address",
          internalType: "address",
        },
        {
          name: "_withdrawHandler",
          type: "address",
          internalType: "address",
        },
        {
          name: "_orderHandler",
          type: "address",
          internalType: "address",
        },
        {
          name: "_wnt",
          type: "address",
          internalType: "address",
        },
        {
          name: "_positionHandler",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "cancelDeposit",
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
      name: "cancelOrder",
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
      name: "createDeposit",
      inputs: [
        {
          name: "_params",
          type: "tuple",
          internalType: "struct DepositHandler.CreateDepositParams",
          components: [
            {
              name: "receiver",
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
              name: "initialLongToken",
              type: "address",
              internalType: "address",
            },
            {
              name: "initialShortToken",
              type: "address",
              internalType: "address",
            },
            {
              name: "minMarketTokens",
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
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "createOrder",
      inputs: [
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
      name: "depositHandler",
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
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "multicall",
      inputs: [
        {
          name: "data",
          type: "bytes[]",
          internalType: "bytes[]",
        },
      ],
      outputs: [
        {
          name: "results",
          type: "bytes[]",
          internalType: "bytes[]",
        },
      ],
      stateMutability: "nonpayable",
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
      name: "sendTokens",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
        {
          name: "_receiver",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "sendWnt",
      inputs: [
        {
          name: "_receiver",
          type: "address",
          internalType: "address",
        },
        {
          name: "_amount",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdrawHandler",
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
      type: "error",
      name: "MulticallFailed",
      inputs: [
        {
          name: "index",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "reason",
          type: "bytes",
          internalType: "bytes",
        },
      ],
    },
    {
      type: "error",
      name: "NotOwner",
      inputs: [],
    },
  ] as const;
  
  export default abi;