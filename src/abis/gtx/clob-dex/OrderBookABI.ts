const abi = [
    {
      type: "constructor",
      inputs: [
        {
          name: "_poolManager",
          type: "address",
          internalType: "address",
        },
        {
          name: "_balanceManager",
          type: "address",
          internalType: "address",
        },
        {
          name: "_maxOrderAmount",
          type: "uint256",
          internalType: "uint256",
        },
        { 
          name: "_lotSize", 
          type: "uint256", 
          internalType: "uint256" 
        },
        {
          name: "_poolKey",
          type: "tuple",
          internalType: "struct PoolKey",
          components: [
            {
              name: "baseCurrency",
              type: "address",
              internalType: "Currency",
            },
            {
              name: "quoteCurrency",
              type: "address",
              internalType: "Currency",
            },
          ],
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "placeOrder",
      inputs: [
        { name: "price", type: "uint64", internalType: "Price" },
        { name: "quantity", type: "uint128", internalType: "Quantity" },
        { name: "side", type: "uint8", internalType: "enum Side" },
        { name: "user", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint48", internalType: "OrderId" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "placeMarketOrder",
      inputs: [
        { name: "quantity", type: "uint128", internalType: "Quantity" },
        { name: "side", type: "uint8", internalType: "enum Side" },
        { name: "user", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint48", internalType: "OrderId" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "cancelOrder",
      inputs: [
        { name: "side", type: "uint8", internalType: "enum Side" },
        { name: "price", type: "uint64", internalType: "Price" },
        { name: "orderId", type: "uint48", internalType: "OrderId" },
        { name: "user", type: "address", internalType: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getBestPrice",
      inputs: [
        { name: "side", type: "uint8", internalType: "enum Side" }
      ],
      outputs: [
        {
          name: "",
          type: "tuple",
          internalType: "struct IOrderBook.PriceVolume",
          components: [
            { name: "price", type: "uint64", internalType: "Price" },
            { name: "volume", type: "uint256", internalType: "uint256" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getUserActiveOrders",
      inputs: [
        { name: "user", type: "address", internalType: "address" }
      ],
      outputs: [
        {
          name: "",
          type: "tuple[]",
          internalType: "struct IOrderBook.Order[]",
          components: [
            { name: "id", type: "uint48", internalType: "OrderId" },
            { name: "user", type: "address", internalType: "address" },
            { name: "next", type: "uint48", internalType: "OrderId" },
            { name: "prev", type: "uint48", internalType: "OrderId" },
            { name: "timestamp", type: "uint48", internalType: "uint48" },
            { name: "expiry", type: "uint48", internalType: "uint48" },
            { name: "price", type: "uint64", internalType: "Price" },
            { name: "status", type: "uint8", internalType: "enum Status" },
            { name: "quantity", type: "uint128", internalType: "Quantity" },
            { name: "filled", type: "uint128", internalType: "Quantity" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getOrderQueue",
      inputs: [
        { name: "side", type: "uint8", internalType: "enum Side" },
        { name: "price", type: "uint64", internalType: "Price" },
      ],
      outputs: [
        { name: "orderCount", type: "uint48", internalType: "uint48" },
        { name: "totalVolume", type: "uint256", internalType: "uint256" },
      ],
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
      name: "setRouter",
      inputs: [
        { name: "_router", type: "address", internalType: "address" }
      ],
      outputs: [],
      stateMutability: "nonpayable",
    }
  ] as const
  
  export default abi