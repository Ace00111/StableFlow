'use client';

import { Navbar } from "@/components/Navbar";
import { useFlowStore } from "@/store/useFlowStore";
import { Clock, ExternalLink, TrendingUp, Wallet, ArrowUpRight, User } from "lucide-react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { history, rules } = useFlowStore();

  const totalVolume = history.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <main className="min-h-screen bg-black relative">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, <span className="text-blue-500">{isConnected ? (address?.slice(0, 6) + '...' + address?.slice(-4)) : 'Guest Scholar'}</span>
            </h1>
            <p className="text-white/40">Track your stablecoin automation performance</p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-4">
              <Link href="/" className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
                Create New Flow
              </Link>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Personalized Workspace</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="text-blue-500 w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-white/50">Total Volume Split</span>
            </div>
            <p className="text-3xl font-mono font-bold">{totalVolume.toLocaleString()} <span className="text-sm font-sans text-blue-500">USDC</span></p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="text-purple-500 w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-white/50">Total Flows</span>
            </div>
            <p className="text-3xl font-mono font-bold">{history.length}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wallet className="text-green-500 w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-white/50">Active Rules</span>
            </div>
            <p className="text-3xl font-mono font-bold">{rules.length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-8">
            {/* Recent History */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Transaction Activity
                  <span className="text-xs bg-blue-500/10 px-2 py-1 rounded text-blue-400 font-mono">{history.length}</span>
                </h2>
                <button className="text-xs font-bold text-white/20 hover:text-white transition-colors uppercase tracking-widest">View All</button>
              </div>
              
              <div className="grid gap-4">
                {history.length === 0 ? (
                  <div className="glass-card p-12 text-center border-dashed border-white/5">
                    <p className="text-white/20">No transactions recorded in this workspace.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="glass-card p-6 flex items-center justify-between group hover:border-white/20 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg shadow-blue-500/5">
                          <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{item.amount} USDC</p>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40 uppercase font-bold tracking-tighter">Success</span>
                          </div>
                          <p className="text-xs text-white/30 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="hidden sm:flex flex-col items-end">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Allocations</p>
                          <div className="flex -space-x-1.5">
                            {item.allocations.map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-lg bg-blue-500/20 border border-black/50 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `hsl(${220 + (i * 25)}, 70%, 40%)` }}>
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                        <a 
                          href={`https://testnet.arcscan.app/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="glass-card p-6 border-blue-500/10">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Rule Library</h2>
              <div className="space-y-4">
                {rules.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-white/20 text-xs">No active rules.</p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-sm text-white/80">{rule.name}</h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
                      </div>
                      <div className="space-y-2">
                        {rule.allocations.map((a, i) => (
                          <div key={i} className="flex justify-between text-[10px]">
                            <span className="text-white/30 truncate max-w-[100px]">{a.label}</span>
                            <span className="font-mono text-blue-400 font-bold">{a.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/40 transition-all border border-white/5">
                Manage All Rules
              </button>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Network Health</h3>
              <p className="text-sm text-white/60 mb-4">Arc Testnet is performing optimally. Average split time: 1.2s</p>
              <div className="flex items-center gap-2 text-[10px] text-green-400 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SYSTEMS OPERATIONAL
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
