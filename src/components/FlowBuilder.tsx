'use client';

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Plus, Trash2, Send, CheckCircle2, Loader2, Share2, Download, X, Copy, Check, Bookmark, Book, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useConfig, useBalance } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { USDC_ADDRESS, USDC_ABI, SPLITTER_ADDRESS, SPLITTER_ABI } from '@/constants/contracts';
import { useFlowStore, Allocation } from '@/store/useFlowStore';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

export function FlowBuilder() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([
    { label: 'Savings', address: '', percentage: 50 },
    { label: 'Spending', address: '', percentage: 50 },
  ]);
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'executing' | 'success'>('idle');
  const [lastTxHash, setLastTxHash] = useState('');
  const [showCard, setShowCard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const PRESETS = [
    { name: 'Equal Split', allocations: [{ label: 'Wallet 1', address: '', percentage: 50 }, { label: 'Wallet 2', address: '', percentage: 50 }] },
    { name: 'Golden Ratio', allocations: [{ label: 'Main', address: '', percentage: 62 }, { label: 'Side', address: '', percentage: 38 }] },
    { name: 'Tithes (10%)', allocations: [{ label: 'Main', address: '', percentage: 90 }, { label: 'Giving', address: '', percentage: 10 }] },
  ];
  const [copied, setCopied] = useState(false);
  
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const { rules, addRule, addToHistory, savedAddresses, addAddress, removeAddress } = useFlowStore();
  const [showAddressBook, setShowAddressBook] = useState(false);
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
  });

  const totalPercentage = allocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
  const allAddressesValid = allocations.every(a => isAddress(a.address));
  
  // Use dynamic decimals from balance hook (Arc USDC is 18)
  const usdcDecimals = balance?.decimals || 18;
  const amountBigInt = amount ? parseUnits(amount, usdcDecimals) : 0n;
  const amountValid = !!amount && parseFloat(amount) > 0;
  const gasBuffer = parseUnits('0.1', usdcDecimals);
  const isInsufficientBalance = balance ? balance.value < (amountBigInt + gasBuffer) : false;
  
  // Ensure every row with a percentage has an address
  const allRowsComplete = allocations.every(a => 
    (a.percentage > 0 && isAddress(a.address)) || (a.percentage === 0 && !a.address) || (a.percentage === 0 && isAddress(a.address))
  );

  const isValid = Math.abs(totalPercentage - 100) < 0.01 && 
                  allocations.length >= 2 && 
                  allAddressesValid && 
                  amountValid && 
                  !isInsufficientBalance &&
                  allRowsComplete;

  const handleAddAllocation = () => {
    if (allocations.length >= 5) return;
    setAllocations([...allocations, { label: `Wallet ${allocations.length + 1}`, address: '', percentage: 0 }]);
  };

  const handleRemoveAllocation = (index: number) => {
    if (allocations.length <= 2) return;
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, field: keyof Allocation, value: string | number) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setAllocations(newAllocations);
    setSelectedRuleId(''); // Reset selection if edited
  };

  const handleSaveRule = () => {
    if (!ruleName || totalPercentage !== 100) return;
    addRule({
      name: ruleName,
      allocations: [...allocations],
    });
    setRuleName('');
  };

  const handleSelectRule = (id: string) => {
    const rule = rules?.find(r => r.id === id);
    if (rule) {
      setAllocations([...rule.allocations]);
      setSelectedRuleId(id);
    }
  };

  const handleExecute = async () => {
    if (!isValid || !address) return;
    const usdcDecimals = balance?.decimals || 18;
    const amountBigInt = parseUnits(amount, usdcDecimals);

    try {
      setTxStep('approving');

      // 1. Pre-execution balance check (use native balance since USDC is the gas token)
      const senderBalance = balance?.value ?? 0n;

      if (senderBalance < amountBigInt) {
        throw new Error('Insufficient USDC balance');
      }

      // 2. Allowance check and Approval (SKIP for native USDC)
      const isNativeUSDC = USDC_ADDRESS.toLowerCase() === '0x3600000000000000000000000000000000000000'.toLowerCase();
      
      if (!isNativeUSDC) {
        const currentAllowance = await readContract(config, {
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, SPLITTER_ADDRESS],
        }) as bigint;

        console.log('USDC Allowance:', formatUnits(currentAllowance, usdcDecimals));

        if (currentAllowance < amountBigInt) {
          const approveHash = await writeContractAsync({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [SPLITTER_ADDRESS, amountBigInt],
          });
          await waitForTransactionReceipt(config, { hash: approveHash });
        }
      } else {
        console.log('Native USDC detected — skipping approval step.');
      }

      setTxStep('executing');

      // 3. Prepare recipients and basis points
      const validAllocs = allocations.filter((a) => isAddress(a.address));
      const recipients = validAllocs.map((a) => a.address as `0x${string}`);
      
      // Calculate basis points (100% = 10000). The contract expects values that sum to 10000.
      const roundedBps = validAllocs.map((a) => Math.round(a.percentage * 100));
      const totalBps = roundedBps.reduce((s, v) => s + v, 0);
      
      // Handle rounding error by adjusting the largest share or last recipient
      if (totalBps !== 10000) {
        roundedBps[roundedBps.length - 1] += (10000 - totalBps);
      }
      
      const basisPoints = roundedBps.map((b) => BigInt(b));

      console.log('--- Debug Transaction Info ---');
      console.log('User Address:', address);
      console.log('Splitter Address:', SPLITTER_ADDRESS);
      console.log('Is Native USDC:', isNativeUSDC);
      console.log('USDC Decimals:', usdcDecimals);
      console.log('USDC Balance:', formatUnits(senderBalance, usdcDecimals));
      console.log('Target Amount (Units):', amountBigInt.toString());
      console.log('Target Amount (Human):', amount);
      console.log('Recipients:', recipients);
      console.log('Basis Points:', basisPoints.map(b => b.toString()));
      console.log('------------------------------');
      
      const splitHash = await writeContractAsync({
        address: SPLITTER_ADDRESS,
        abi: SPLITTER_ABI,
        functionName: 'executeSplit',
        args: [USDC_ADDRESS, recipients, basisPoints, amountBigInt],
        value: isNativeUSDC ? amountBigInt : 0n, // Send USDC as value if native
      });

      console.log('Transaction Hash:', splitHash);
      const receipt = await waitForTransactionReceipt(config, { hash: splitHash });
      console.log('Transaction Receipt:', receipt);

      setLastTxHash(splitHash);
      setTxStep('success');
      
      addToHistory({
        amount,
        ruleName: ruleName || 'Manual Flow',
        txHash: splitHash,
        allocations: [...allocations],
      });
      
      void refetchBalance();
      setShowCard(true);
      setTxStep('idle');
      setRuleName('');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ffffff']
      });

    } catch (error: any) {
      console.error('Flow Execution Error:', error);
      const errMsg = error?.shortMessage || error?.message || 'Transaction failed';
      alert(errMsg); // Basic alert for now, could be a toast
      setTxStep('idle');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCard = async () => {
    const node = document.getElementById('viral-card');
    if (node) {
      setIsGenerating(true);
      try {
        // Wait a bit for fonts to render
        await new Promise(r => setTimeout(r, 500));
        const dataUrl = await toPng(node, { 
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        const link = document.createElement('a');
        link.download = `stableflow-receipt-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to generate image:', err);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const shareOnX = () => {
    const text = `I just automated my stablecoins with @StableFlow.\n${amount} USDC → flowed via @ArcNetwork. 🌊`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Flow Rule</h2>
            <p className="text-white/50 text-sm mt-1">Configure your USDC percentage distributions</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Your Balance</p>
            <p className="text-xl font-mono text-blue-400">
              {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toLocaleString() : '0.00'} <span className="text-sm font-sans">USDC</span>
            </p>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="mb-10 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <span>Allocation Strategy</span>
            <span className={totalPercentage === 100 ? 'text-blue-400' : 'text-red-400/60'}>
              {totalPercentage}% / 100%
            </span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
            {allocations.map((alloc, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${alloc.percentage}%` }}
                className={`h-full border-r border-black/20 last:border-none`}
                style={{ 
                   backgroundColor: `hsl(${220 + (i * 25)}, 70%, ${50 - (i * 5)}%)`,
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {allocations.map((alloc, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${220 + (i * 25)}, 70%, ${50 - (i * 5)}%)` }} />
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{alloc.label || `Wallet ${i+1}`}</span>
              </div>
            ))}
          </div>
        </div>

        { (rules?.length > 0 || PRESETS.length > 0) && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">Templates:</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setAllocations([...preset.allocations]);
                      setSelectedRuleId(preset.name);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedRuleId === preset.name 
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' 
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {rules?.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">Your Rules:</label>
                <div className="flex flex-wrap gap-2">
                  {rules.map((rule) => (
                    <button
                      key={rule.id}
                      onClick={() => handleSelectRule(rule.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedRuleId === rule.id 
                          ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {rule.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">Address Book:</label>
              <button
                onClick={() => setShowAddressBook(!showAddressBook)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all"
              >
                <Book className="w-3 h-3" />
                {savedAddresses?.length || 0} Saved
              </button>
              
              {showAddressBook && savedAddresses?.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        // Find first empty address or add new
                        const emptyIndex = allocations.findIndex(a => !a.address);
                        if (emptyIndex !== -1) {
                          handleUpdateAllocation(emptyIndex, 'address', addr.address);
                          handleUpdateAllocation(emptyIndex, 'label', addr.label);
                        } else if (allocations.length < 5) {
                          setAllocations([...allocations, { label: addr.label, address: addr.address, percentage: 0 }]);
                        }
                      }}
                      className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/60 hover:bg-white/10 hover:text-white border border-white/5 transition-all"
                    >
                      {addr.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-[1fr_2fr_100px_80px] gap-4 px-4 text-xs font-bold text-white/30 uppercase tracking-widest">
            <div>Label</div>
            <div>Wallet Address</div>
            <div>Percent</div>
            <div></div>
          </div>
          
          <AnimatePresence mode="popLayout">
            {allocations.map((alloc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col md:grid md:grid-cols-[1fr_2fr_100px_80px] gap-4 items-center bg-white/[0.02] p-4 md:p-2 rounded-xl border border-white/[0.05]"
              >
                <div className="w-full md:w-auto">
                  <label className="text-[10px] font-bold text-white/20 uppercase mb-1 block md:hidden">Label</label>
                  <input
                    type="text"
                    value={alloc.label}
                    onChange={(e) => handleUpdateAllocation(index, 'label', e.target.value)}
                    placeholder="e.g. Savings"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-white/20 p-0"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <label className="text-[10px] font-bold text-white/20 uppercase mb-1 block md:hidden">Wallet Address</label>
                  <input
                    type="text"
                    value={alloc.address}
                    onChange={(e) => handleUpdateAllocation(index, 'address', e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-mono text-white/80 placeholder:text-white/20 p-0"
                  />
                </div>
                <div className="w-full md:w-auto flex items-center gap-4">
                  <div className="flex-1 md:w-full">
                    <label className="text-[10px] font-bold text-white/20 uppercase mb-1 block md:hidden">Percent</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={alloc.percentage}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          handleUpdateAllocation(index, 'percentage', val);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-[10px]">%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      onClick={() => {
                        if (alloc.address && isAddress(alloc.address)) {
                          const exists = savedAddresses?.find(
                            (a) => a.address.toLowerCase() === alloc.address.toLowerCase()
                          );
                          if (!exists) {
                            addAddress({ label: alloc.label || 'Saved Wallet', address: alloc.address });
                          }
                        }
                      }}
                      disabled={!isAddress(alloc.address)}
                      className="text-white/20 hover:text-blue-400 transition-colors disabled:opacity-30 p-2 bg-white/5 rounded-lg"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveAllocation(index)}
                      disabled={allocations.length <= 2}
                      className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-0 p-2 bg-white/5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (alloc.address && isAddress(alloc.address)) {
                        const exists = savedAddresses?.find(
                          (a) => a.address.toLowerCase() === alloc.address.toLowerCase()
                        );
                        if (!exists) {
                          addAddress({ label: alloc.label || 'Saved Wallet', address: alloc.address });
                        }
                      }
                    }}
                    disabled={!isAddress(alloc.address)}
                    className="text-white/20 hover:text-blue-400 transition-colors disabled:opacity-30 p-1"
                    title="Save to Address Book"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveAllocation(index)}
                    disabled={allocations.length <= 2}
                    className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={handleAddAllocation}
            disabled={allocations.length >= 5}
            className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-white/40 text-sm font-medium hover:border-white/20 hover:text-white/60 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Wallet {allocations.length}/5
          </button>

          <div className="flex items-center gap-4 pt-4">
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Name this rule..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:border-blue-500 focus:ring-0 outline-none"
            />
            <button
              onClick={handleSaveRule}
              disabled={!ruleName || totalPercentage !== 100}
              className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-bold rounded-xl border border-blue-500/20 transition-all"
            >
              Save Rule
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Total Amount (USDC)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-white/[0.03] border ${isInsufficientBalance ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-4 px-6 text-2xl font-mono text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none`}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (balance) {
                      const buffer = parseUnits('0.1', balance.decimals);
                      const maxAmount = balance.value > buffer ? balance.value - buffer : 0n;
                      setAmount(formatUnits(maxAmount, balance.decimals));
                    }
                  }}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-wider transition-colors"
                >
                  Max
                </button>
                <div className="text-white/20 font-bold">USDC</div>
              </div>
            </div>
            {isInsufficientBalance && (
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider px-2 mt-1">
                Insufficient balance (Available: {balance ? formatUnits(balance.value, balance.decimals) : '0'})
              </p>
            )}
          </div>
          
          <div className="w-full sm:w-auto">
            {(!mounted || !isConnected) ? (
              <div className="w-full sm:w-[200px]">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <>
                <div className="mb-2 text-right">
                  {!amountValid ? (
                    <span className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">Enter Amount</span>
                  ) : isInsufficientBalance ? (
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Insufficient USDC</span>
                  ) : totalPercentage !== 100 ? (
                    <span className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">Sum must be 100%</span>
                  ) : !allAddressesValid ? (
                    <span className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">Invalid Addresses</span>
                  ) : !allRowsComplete ? (
                    <span className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">Missing Addresses</span>
                  ) : (
                    <span className="text-[10px] text-green-400/60 font-bold uppercase tracking-wider">Ready to Flow</span>
                  )}
                </div>
                <button
                  onClick={handleExecute}
                  disabled={!isValid || txStep !== 'idle'}
                  className="w-full sm:w-[200px] bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 overflow-hidden group"
                >
                  {txStep === 'idle' ? (
                    <>
                      <span>Execute Flow</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{txStep === 'approving' ? 'Step 1: Approving' : 'Step 2: Executing'}</span>
                      </div>
                      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: txStep === 'approving' ? '50%' : '100%' }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal / Viral Card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-md w-full"
            >
              <div id="viral-card" className="bg-[#080808] p-10 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                {/* Close Button */}
                <button 
                  onClick={() => setShowCard(false)}
                  className="absolute top-6 right-6 z-20 text-white/20 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Visual Flair */}
                <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] bg-blue-500/20 blur-[60px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[150px] h-[150px] bg-purple-500/10 blur-[60px] rounded-full" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/40 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Waves className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Flow Executed</h3>
                  <div className="flex items-center gap-2 mb-10">
                    <span className="h-[1px] w-4 bg-white/20" />
                    <p className="text-blue-400/80 text-xs font-bold uppercase tracking-[0.3em]">StableFlow Protocol</p>
                    <span className="h-[1px] w-4 bg-white/20" />
                  </div>
                  
                  <div className="w-full bg-white/[0.02] backdrop-blur-sm rounded-[32px] p-8 border border-white/[0.05] mb-8 shadow-inner">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] mb-4">Total Distribution</p>
                    <p className="text-5xl font-mono font-bold text-white mb-8 tracking-tighter">
                      {parseFloat(amount).toLocaleString()} <span className="text-xl font-sans text-blue-500">USDC</span>
                    </p>
                    
                    <div className="space-y-4">
                      {allocations.map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${220 + (i * 25)}, 70%, 50%)` }} />
                            <span className="text-white/70 font-medium">{a.label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-white font-mono font-bold">{a.percentage}%</span>
                            <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${a.percentage}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 w-full pt-4">
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
                      Immutable Proof on Arc Network
                    </div>

                    <button 
                      onClick={() => copyToClipboard(lastTxHash)}
                      className="flex items-center gap-2 text-[10px] font-mono text-white/20 hover:text-blue-400 transition-colors bg-white/5 px-3 py-1 rounded-lg border border-white/5"
                    >
                      TX: {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-8)}
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={downloadCard}
                  disabled={isGenerating}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isGenerating ? 'Generating...' : 'Download'}
                </button>
                <button
                  onClick={shareOnX}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Share2 className="w-5 h-5" />
                  Share on X
                </button>
              </div>

              <button
                onClick={() => setShowCard(false)}
                className="w-full mt-6 text-white/30 hover:text-white text-xs font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
              >
                Continue to FlowBuilder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
