'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Waves } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b border-white/[0.08] bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Waves className="text-white w-6 h-6" />
            </div>
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              Stable<span className="text-blue-500">Flow</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Dashboard
            </Link>
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
