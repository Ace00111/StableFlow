'use client';

import { Navbar } from "@/components/Navbar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { FlowBuilder } from "@/components/FlowBuilder";
import { useAccount } from "wagmi";

export default function SplitPage() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -z-10" />

      <Navbar />
      <NetworkBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Stablecoin <span className="text-blue-500">Flow</span>
          </h1>
          <p className="text-white/40 mt-2">Distribute USDC with precision on Arc Network</p>
        </div>

        <FlowBuilder />
      </div>
      
      <footer className="border-t border-white/5 py-12 text-center mt-auto">
        <p className="text-white/20 text-sm">
          &copy; 2026 StableFlow. Built on Arc Testnet.
        </p>
      </footer>
    </main>
  );
}
