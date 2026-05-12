'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Waves, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/split" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Distribute
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Dashboard
            </Link>
            <div className="ml-2">
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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white/70 hover:text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.08] flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-2"
            >
              Home
            </Link>
            <Link 
              href="/split" 
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-2"
            >
              Distribute
            </Link>
            <Link 
              href="/dashboard" 
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-2"
            >
              Dashboard
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
