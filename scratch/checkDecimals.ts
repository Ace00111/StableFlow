import { createPublicClient, http, parseAbi, formatUnits } from 'viem';

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
};

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const abi = parseAbi(['function decimals() view returns (uint8)', 'function symbol() view returns (string)']);

async function check() {
  try {
    const symbol = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: 'symbol',
    });
    const decimals = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: 'decimals',
    });
    const balance = await client.readContract({
      address: USDC_ADDRESS,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: ['0xc6523efebfac753584583de8df808f228f008183'],
    });
    console.log(`Token: ${symbol}, Decimals: ${decimals}, Raw Balance: ${balance.toString()}`);
    console.log(`Formatted (6): ${formatUnits(balance as bigint, 6)}`);
    console.log(`Formatted (18): ${formatUnits(balance as bigint, 18)}`);
  } catch (e) {
    console.error('Error fetching token info:', e);
  }
}

check();
