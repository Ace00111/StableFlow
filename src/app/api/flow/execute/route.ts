import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseUnits, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arcTestnet } from '@/constants/chain'; // I might need to create this or find where it's defined
import { SPLITTER_ADDRESS, SPLITTER_ABI, USDC_ADDRESS } from '@/constants/contracts';

export async function POST(req: NextRequest) {
  try {
    const { recipients, basisPoints, amount } = await req.json();

    if (!process.env.PRIVATE_KEY) {
      return NextResponse.json({ error: 'Server private key not configured' }, { status: 500 });
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    
    // Create clients
    const publicClient = createPublicClient({
      chain: {
        id: 49443,
        name: 'Arc Testnet',
        network: 'arc-testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://rpc.testnet.arc.network'] },
          public: { http: ['https://rpc.testnet.arc.network'] },
        },
        blockExplorers: {
          default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
        },
      },
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: {
        id: 49443,
        name: 'Arc Testnet',
        network: 'arc-testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://rpc.testnet.arc.network'] },
          public: { http: ['https://rpc.testnet.arc.network'] },
        },
        blockExplorers: {
          default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
        },
      },
      transport: http(),
    });

    const amountBigInt = parseUnits(amount, 18);

    console.log('API Executing Split:', {
      from: account.address,
      amount,
      recipients,
    });

    const hash = await walletClient.writeContract({
      address: SPLITTER_ADDRESS,
      abi: SPLITTER_ABI,
      functionName: 'executeSplit',
      args: [USDC_ADDRESS, recipients, basisPoints.map((b: number) => BigInt(b)), amountBigInt],
      value: amountBigInt, // On Arc, native USDC is sent as value
    });

    return NextResponse.json({ success: true, hash });

  } catch (error: any) {
    console.error('API Flow Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.shortMessage || error.message || 'Transaction failed' 
    }, { status: 500 });
  }
}
