const abi = [
    {
      type: "constructor",
      inputs: [
        { name: "_owner", type: "address", internalType: "address" },
        { name: "_balanceManager", type: "address", internalType: "address" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "createPool",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct PoolKey",
          components: [
            { name: "baseCurrency", type: "address", internalType: "Currency" },
            { name: "quoteCurrency", type: "address", internalType: "Currency" },
          ],
        },
        { name: "_lotSize", type: "uint256", internalType: "uint256" },
        { name: "_maxOrderAmount", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getPool",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct PoolKey",
          components: [
            { name: "baseCurrency", type: "address", internalType: "Currency" },
            { name: "quoteCurrency", type: "address", internalType: "Currency" },
          ],
        },
      ],
      outputs: [
        {
          name: "",
          type: "tuple",
          internalType: "struct IPoolManager.Pool",
          components: [
            { name: "maxOrderAmount", type: "uint256", internalType: "uint256" },
            { name: "lotSize", type: "uint256", internalType: "uint256" },
            { name: "baseCurrency", type: "address", internalType: "Currency" },
            { name: "quoteCurrency", type: "address", internalType: "Currency" },
            { name: "orderBook", type: "address", internalType: "contract IOrderBook" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getPoolId",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct PoolKey",
          components: [
            { name: "baseCurrency", type: "address", internalType: "Currency" },
            { name: "quoteCurrency", type: "address", internalType: "Currency" },
          ],
        },
      ],
      outputs: [{ name: "", type: "bytes32", internalType: "PoolId" }],
      stateMutability: "pure",
    },
  ] as const
  
  export default abi
  
  