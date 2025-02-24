const abi = [
    {
      type: "constructor",
      inputs: [
        { name: "_owner", type: "address", internalType: "address" },
        { name: "_feeReceiver", type: "address", internalType: "address" },
        { name: "_feeMaker", type: "uint256", internalType: "uint256" },
        { name: "_feeTaker", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "balanceOf",
      inputs: [
        { name: "owner", type: "address", internalType: "address" },
        { name: "id", type: "uint256", internalType: "uint256" },
      ],
      outputs: [{ name: "balance", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "deposit",
      inputs: [
        { name: "currency", type: "address", internalType: "Currency" },
        { name: "amount", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "deposit",
      inputs: [
        { name: "currency", type: "address", internalType: "Currency" },
        { name: "amount", type: "uint256", internalType: "uint256" },
        { name: "user", type: "address", internalType: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "feeMaker",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "feeTaker",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getBalance",
      inputs: [
        { name: "user", type: "address", internalType: "address" },
        { name: "currency", type: "address", internalType: "Currency" },
      ],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "withdraw",
      inputs: [
        { name: "currency", type: "address", internalType: "Currency" },
        { name: "amount", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const
  
  export default abi
  
  