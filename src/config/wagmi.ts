import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
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

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_WAGMI_PROJECT_ID) {
  console.warn('[StableFlow] NEXT_PUBLIC_WAGMI_PROJECT_ID is not set. WalletConnect will not work.');
}

export const config = getDefaultConfig({
  appName: 'StableFlow',
  projectId: process.env.NEXT_PUBLIC_WAGMI_PROJECT_ID || '',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: false,
});
