import { Navbar } from "@/components/Navbar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { FlowBuilder } from "@/components/FlowBuilder";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -z-10" />

      <Navbar />
      <NetworkBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {!isConnected ? (
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Arc Testnet Live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
              Automate your <span className="text-blue-500">Stablecoins</span> with precision
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
              One payment in, multiple distributions out. The ultimate splitter for modern Web3 finance on Arc Network.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                Non-custodial
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Zap className="w-4 h-4 text-blue-500" />
                Instant Split
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Globe className="w-4 h-4 text-blue-500" />
                Circle USDC Native
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Create New Flow</h2>
            <p className="text-white/40 mt-2">Automate your USDC distributions on Arc Network</p>
          </div>
        )}

        <FlowBuilder />

        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 group hover:border-blue-500/30 transition-all duration-500">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
              <Zap className="text-blue-500 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Flash Split</h3>
            <p className="text-white/40 leading-relaxed">
              Distribute funds across up to 5 wallets in a single transaction. Atomic execution guaranteed by Arc Network.
            </p>
          </div>

          <div className="glass-card p-8 group hover:border-blue-500/30 transition-all duration-500">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
              <Shield className="text-blue-500 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Circle Security</h3>
            <p className="text-white/40 leading-relaxed">
              Built on top of Circle's USDC infrastructure, ensuring institutional-grade stability and reliability.
            </p>
          </div>

          <div className="glass-card p-8 group hover:border-blue-500/30 transition-all duration-500">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
              <ArrowRight className="text-blue-500 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Viral Receipts</h3>
            <p className="text-white/40 leading-relaxed">
              Generate beautiful, shareable allocation cards to showcase your automation rules to the community.
            </p>
          </div>
        </div>
      </div>
      
      <footer className="border-t border-white/5 py-12 text-center">
        <p className="text-white/20 text-sm">
          &copy; 2026 StableFlow. Built on Arc Testnet.
        </p>
      </footer>
    </main>
  );
}
