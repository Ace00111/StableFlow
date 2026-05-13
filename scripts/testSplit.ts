import { createPublicClient, createWalletClient, http, parseUnits, decodeFunctionResult } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import path from 'path';
import { readFileSync } from 'fs';

// Configuration – replace with your testnet values
const RPC_URL = 'https://rpc.testnet.arc.network';
const PRIVATE_KEY = '0xYOUR_PRIVATE_KEY_HERE'; // test account private key

const account = privateKeyToAccount(PRIVATE_KEY);

const client = createWalletClient({
  account,
  chain: {
    id: 11155111, // Arc testnet chain ID (adjust if different)
    name: 'Arc Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  },
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  chain: client.chain,
  transport: http(RPC_URL),
});

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'; // placeholder – ensure this is the real USDC address on Arc testnet
const SPLITTER_ADDRESS = '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8'; // address of deployed splitter

const USDC_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: '_spender', type: 'address' }, { name: '_value', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: '_owner', type: 'address' }], outputs: [{ name: 'balance', type: 'uint256' }], stateMutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
];

const SPLITTER_ABI = [
  { name: 'executeSplit', type: 'function', inputs: [{ name: 'token', type: 'address' }, { name: 'recipients', type: 'address[]' }, { name: 'basisPoints', type: 'uint256[]' }, { name: 'totalAmount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
];

async function main() {
  const amount = parseUnits('10', 18); // 10 USDC (Arc native is 18 decimals)

  // 1️⃣ Ensure we have enough USDC – if not, mint from a faucet or use an address that already holds USDC.
  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log('Current USDC balance:', balance.toString());

  // 2️⃣ Approve splitter
  const approveTx = await client.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [SPLITTER_ADDRESS, amount],
  });
  console.log('Approve tx hash:', approveTx);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // 3️⃣ Execute split – two recipients, 50% each
  const recipients = [
    '0x1111111111111111111111111111111111111111', // replace with real test wallets
    '0x2222222222222222222222222222222222222222',
  ];
  const basisPoints = [5000, 5000]; // 50% + 50% = 10000

  const splitTx = await client.writeContract({
    address: SPLITTER_ADDRESS,
    abi: SPLITTER_ABI,
    functionName: 'executeSplit',
    args: [USDC_ADDRESS, recipients, basisPoints, amount],
  });
  console.log('Split tx hash:', splitTx);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: splitTx });
  console.log('Split receipt:', receipt);
}

main().catch((e) => {
  console.error('Error during execution:', e);
});
