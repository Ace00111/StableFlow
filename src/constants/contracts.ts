export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
export const SPLITTER_ADDRESS = '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8' as `0x${string}`; // StableFlowSplitter contract address on Arc Testnet

export const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

export const SPLITTER_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
    ],
    name: "FlowExecuted",
    type: "event",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "basisPoints", type: "uint256[]" },
      { name: "totalAmount", type: "uint256" },
    ],
    name: "executeSplit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
