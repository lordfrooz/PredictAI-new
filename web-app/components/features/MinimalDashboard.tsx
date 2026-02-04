'use client';

import { useState, useEffect } from 'react';
import { SimplifiedAnalysisResult } from '@/lib/marketAnalyst';
import { HotActivities } from './HotActivities';
import { ComparisonChart } from '@/components/ui/ComparisonChart';
import { motion, AnimatePresence } from 'framer-motion';

// Extended result type with cache metadata
interface AnalysisResultWithCache extends SimplifiedAnalysisResult {
  cached?: boolean;
  cachedAt?: string;
  expiresAt?: string;
  cacheAgeMinutes?: number;
  ttlMinutes?: number;
  refreshAvailableIn?: number;
}

interface MinimalDashboardProps {
  result: AnalysisResultWithCache;
  onOpenGuide?: () => void;
  onSelect?: (url: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function MinimalDashboard({ result, onSelect, onRefresh, isRefreshing }: MinimalDashboardProps) {
  const safeAnalysis = result.analysis || [];
  
  // Whale Data from Result
  const whaleData = (result as any).event_metrics?.whaleData || { buyWall: 0, sellWall: 0, largeTrades: 0 };

  // Filter & Sort
  const filteredAnalysis = [...safeAnalysis] // Create a copy to prevent mutation issues
    .filter(item => item.marketProbability >= 1) // Show more options
    .sort((a, b) => {
        const diff = Number(b.marketProbability) - Number(a.marketProbability);
        if (diff !== 0) return diff;
        return Number(b.aiScore) - Number(a.aiScore); // Secondary sort by AI score
    });

  const chartData = filteredAnalysis
    .slice(0, 5)
    .map(item => ({
      label: `${item.option} (${item.marketProbability}%)`,
      marketValue: item.marketProbability,
      aiValue: item.aiScore,
      deviationColor: item.pricingLabel === 'Underpriced' ? '#4ade80' :
                      item.pricingLabel === 'Overpriced' ? '#f87171' : '#60a5fa'
    }));

  const [expandedOption, setExpandedOption] = useState<number | null>(0);

  // Refresh Timer Logic
  const [timeLeft, setTimeLeft] = useState<number>(result.refreshAvailableIn || 0);

  useEffect(() => {
    setTimeLeft(result.refreshAvailableIn || 0);
  }, [result.refreshAvailableIn]);

  useEffect(() => {
    // If user has fresh result (ttl > 0) but timer is 0, it means just analyzed.
    // If result.refreshAvailableIn is provided, use it.
    // Otherwise, calculate based on cachedAt + ttl
    if (result.ttlMinutes && !result.refreshAvailableIn) {
       const cachedTime = new Date(result.cachedAt || new Date()).getTime();
       const now = new Date().getTime();
       const diffMins = Math.floor((now - cachedTime) / 60000);
       const remaining = Math.max(0, result.ttlMinutes - diffMins);
       if (remaining > 0 && timeLeft === 0) setTimeLeft(remaining);
    }
  }, [result]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 60000); // Decrease every minute
    return () => clearInterval(timer);
  }, [timeLeft]);

  const canRefresh = timeLeft <= 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 px-4 md:px-6">
      
      {/* 1. STATUS BAR & HEADER - REDESIGNED */}
      <div className="relative mb-12 p-8 rounded-3xl border border-white/10 bg-[#080808] overflow-hidden group shadow-2xl">
         
         {/* Abstract Geometric Background - No Video */}
         <div className="absolute inset-0 z-0 bg-[#080808]">
             {/* Dynamic Mesh Gradients */}
             <div className="absolute top-[-50%] right-[-20%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-transparent blur-[120px] opacity-40 animate-pulse-slow"></div>
             <div className="absolute bottom-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0a0a] to-transparent blur-[120px] opacity-40 animate-pulse-slow delay-700"></div>
             
             {/* Architectural Lines */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] opacity-20"></div>
             
             {/* Noise Texture */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
         </div>

         <div className="relative z-10 flex flex-col items-center justify-center text-center gap-8 py-12">
            
            {/* Market Identity - Ultra Minimalist */}
            <div className="flex flex-col items-center gap-6">
               {/* Floating Icon */}
               <div className="relative group/icon">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"></div>
                   <div className="relative w-24 h-24 rounded-2xl bg-[#0F0F0F] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-500 group-hover/icon:scale-105">
                       {result.market_image ? (
                          <img src={result.market_image} alt="Market" className="w-full h-full object-cover opacity-100" />
                       ) : (
                          <span className="text-2xl font-mono text-gray-500">MK</span>
                       )}
                   </div>
               </div>

               <div className="flex flex-col items-center gap-4 max-w-3xl">
                   <div className="flex items-center gap-3">
                       <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-gray-300 backdrop-blur-md">
                           {result.category || 'MARKET'}
                       </span>
                       <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                       <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                           ID: {result.title?.substring(0, 8)}...
                       </span>
                   </div>
                   
                   <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-tight drop-shadow-xl">
                       {result.title}
                   </h1>
               </div>
            </div>

            {/* Actions - Integrated */}
            <div className="mt-2 flex items-center gap-4">
               {onRefresh && (
                 <>
                     {!canRefresh && (
                         <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md text-[11px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                             <span>Next Update: {timeLeft}m</span>
                         </div>
                     )}
                     <button
                       onClick={canRefresh ? onRefresh : undefined}
                       disabled={isRefreshing || !canRefresh}
                       className={`group/btn relative px-8 py-3 rounded-xl overflow-hidden transition-all duration-300 ${
                           canRefresh 
                           ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.15)]' 
                           : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                       }`}
                     >
                       <span className="relative z-10 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em]">
                           <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                           </svg>
                           {canRefresh ? 'Analyze Now' : 'Processing'}
                       </span>
                     </button>
                 </>
               )}
            </div>
         </div>
      </div>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ANALYSIS TABLE (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Live Analysis Feed</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{filteredAnalysis.length} Outcomes Tracked</span>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {filteredAnalysis.map((item, idx) => {
                    const isExpanded = expandedOption === idx;
                    const isUnderpriced = item.pricingLabel === 'Underpriced';
                    const isOverpriced = item.pricingLabel === 'Overpriced';
                    const edge = (item.aiScore - item.marketProbability).toFixed(1);
                    const isPositiveEdge = Number(edge) > 0;

                    return (
                        <motion.div 
                            key={idx}
                            layout
                            onClick={() => setExpandedOption(isExpanded ? null : idx)}
                            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                                isExpanded 
                                ? 'bg-[#0F0F0F] border-white/20 shadow-2xl' 
                                : 'bg-[#0A0A0A] border-white/5 hover:border-white/10 hover:bg-[#111]'
                            }`}
                        >
                            {/* Summary Row */}
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded bg-white/5 border border-white/5 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                                        {item.image ? <img src={item.image} className="w-full h-full object-cover opacity-80" /> : idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-medium text-white truncate">{item.option}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Pricing Label */}
                                            <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 rounded border ${
                                                isUnderpriced ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                isOverpriced ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {item.pricingLabel}
                                            </span>
                                            
                                            {/* Edge Label - Moved Here */}
                                            {Math.abs(Number(edge)) > 0 && (
                                                <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 rounded border ${
                                                    isPositiveEdge 
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                    Edge: {isPositiveEdge ? '+' : ''}{edge}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 md:gap-12 shrink-0">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-mono text-gray-500 uppercase">Market</span>
                                        <span className="text-lg font-mono text-gray-300">{item.marketProbability}%</span>
                                    </div>
                                    <div className="flex flex-col items-end relative">
                                        <span className="text-[9px] font-mono text-blue-400 uppercase font-bold tracking-wider">PredictlyAI</span>
                                        <span className={`text-xl font-mono font-bold ${
                                            isPositiveEdge ? 'text-green-400' : 'text-red-400'
                                        } shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                                            {item.aiScore}%
                                        </span>
                                    </div>
                                    <div className="hidden md:block">
                                        <svg className={`w-5 h-5 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-gradient-to-b from-[#0A0A0A] to-[#111] relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${isPositiveEdge ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {/* Brand Logo Mini */}
                                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                                        <div className="w-3.5 h-3.5 bg-black rounded-full"></div>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">PredictlyAI Insight</h4>
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed font-light border-l-2 border-white/20 pl-4 py-2">
                                                    {item.note || "Analysis indicates standard market efficiency for this outcome."}
                                                </p>
                                                
                                                <div className="flex gap-2 mt-4">
                                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-[10px] text-blue-400 font-bold border border-blue-500/20 uppercase tracking-wide">Confidence: High</span>
                                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-[10px] text-purple-400 font-bold border border-purple-500/20 uppercase tracking-wide">Source: Multi-Model</span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[#0F0F0F] rounded-xl p-5 border border-white/10">
                                                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-5 border-b border-white/10 pb-2">Model Confidence</h4>
                                                <div className="space-y-5">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-wide">
                                                            <span>Market Consensus</span>
                                                            <span className="font-mono text-white">{item.marketProbability}%</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gray-500 rounded-full" style={{ width: `${item.marketProbability}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className={`flex justify-between text-[10px] mb-2 uppercase font-bold tracking-wide ${isPositiveEdge ? 'text-green-400' : 'text-red-400'}`}>
                                                            <span>PredictlyAI Model</span>
                                                            <span className="font-mono">{item.aiScore}%</span>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden relative ${isPositiveEdge ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                                            <div className={`absolute inset-0 animate-pulse ${isPositiveEdge ? 'bg-green-500/20' : 'bg-red-500/20'}`}></div>
                                                            <div className={`h-full rounded-full relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isPositiveEdge ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${item.aiScore}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Chart Widget */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Model Distribution</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
                <div className="h-[200px] w-full">
                    <ComparisonChart data={chartData} />
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-gray-500">
                     <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-sm bg-gray-500"></span> Market
                     </div>
                     <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-sm bg-blue-500"></span> AI Model
                     </div>
                </div>
            </div>

        </div>
      </div>

      {/* Market Pulse Full Width */}
      <div className="mt-8">
           <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Market Pulse</span>
          </div>
          <HotActivities onSelect={onSelect} />
      </div>

    </div>
  );
}
