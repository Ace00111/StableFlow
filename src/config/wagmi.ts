import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'StableFlow',
  projectId: process.env.NEXT_PUBLIC_WAGMI_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: false,
});
