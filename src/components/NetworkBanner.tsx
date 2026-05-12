'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { arcTestnet } from '@/config/wagmi';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkBanner() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chain?.id === arcTestnet.id) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-3 flex items-center justify-between overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">
            Unsupported network detected. Please switch to Arc Testnet to continue.
          </p>
        </div>
        <button
          onClick={() => switchChain({ chainId: arcTestnet.id })}
          disabled={isPending}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            'Switch Network'
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
