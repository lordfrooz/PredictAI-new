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
  const filteredAnalysis = safeAnalysis
    .filter(item => item.marketProbability >= 1) // Show more options
    .sort((a, b) => b.marketProbability - a.marketProbability);

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
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1)); // This counts down minutes roughly if simply decremented, but better to just decrement on re-fetch or keep static. 
      // Actually, refreshAvailableIn is in minutes. Let's not auto-decrement minutes loosely. 
      // Instead, we'll just show the static value or rely on user re-action.
      // But user asked for "refresh timer needs to work".
      // Let's treat it as a countdown.
    }, 60000); // Decrease every minute
    return () => clearInterval(timer);
  }, [timeLeft]);

  const canRefresh = timeLeft <= 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 px-4 md:px-6">
      
      {/* 1. STATUS BAR & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-start gap-4">
           {result.market_image ? (
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 overflow-hidden shrink-0">
                  <img src={result.market_image} alt="Market" className="w-full h-full object-cover opacity-80" />
              </div>
           ) : (
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono shrink-0">MK</div>
           )}
           <div>
               <div className="flex items-center gap-2 mb-1">
                   <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                       {result.category || 'MARKET'}
                   </span>
                   <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                       ID: {result.title?.substring(0, 8)}...
                   </span>
               </div>
               <h1 className="text-xl md:text-2xl font-medium text-white tracking-tight max-w-2xl leading-snug">
                   {result.title}
               </h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Whale Ticker */}
           <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg">
               <div className="flex flex-col">
                   <span className="text-[9px] font-mono text-gray-500 uppercase">Buy Vol</span>
                   <span className="text-xs font-mono text-green-400">${whaleData.buyWall.toLocaleString()}</span>
               </div>
               <div className="w-px h-6 bg-white/10"></div>
               <div className="flex flex-col">
                   <span className="text-[9px] font-mono text-gray-500 uppercase">Sell Vol</span>
                   <span className="text-xs font-mono text-red-400">${whaleData.sellWall.toLocaleString()}</span>
               </div>
               <div className="w-px h-6 bg-white/10"></div>
               <div className="flex flex-col">
                   <span className="text-[9px] font-mono text-gray-500 uppercase">Whales</span>
                   <span className="text-xs font-mono text-white">{whaleData.largeTrades}</span>
               </div>
           </div>

           {/* Refresh Button & Timer */}
           {onRefresh && (
             <div className="flex items-center gap-3">
                 {!canRefresh && (
                     <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                         Next Update: {timeLeft}m
                     </span>
                 )}
                 <button
                   onClick={canRefresh ? onRefresh : undefined}
                   disabled={isRefreshing || !canRefresh}
                   className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                       canRefresh 
                       ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer' 
                       : 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
                   }`}
                   title={canRefresh ? "Refresh Analysis" : `Wait ${timeLeft} minutes for next analysis`}
                 >
                   <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                   {canRefresh && <span className="text-xs font-bold hidden md:inline">Refresh</span>}
                 </button>
             </div>
           )}
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
                                        {item.image ? <img src={item.image} className="w-full h-full object-cover opacity-70" /> : idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-medium text-white truncate">{item.option}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 rounded border ${
                                                isUnderpriced ? 'bg-white text-black border-white font-bold' :
                                                isOverpriced ? 'bg-transparent text-gray-400 border-gray-600' :
                                                'bg-white/10 text-white border-white/20'
                                            }`}>
                                                {item.pricingLabel}
                                            </span>
                                            <span className="text-[9px] font-mono text-gray-600">
                                                Vol: Low
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 md:gap-12 shrink-0">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-mono text-gray-500 uppercase">Market</span>
                                        <span className="text-lg font-mono text-gray-300">{item.marketProbability}%</span>
                                    </div>
                                    <div className="flex flex-col items-end relative">
                                        <span className="text-[9px] font-mono text-white uppercase font-bold tracking-wider">PredictlyAI</span>
                                        <span className={`text-xl font-mono font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.4)]`}>
                                            {item.aiScore}%
                                        </span>
                                        {/* Edge Badge */}
                                        <div className={`absolute -right-8 top-1 text-[9px] font-mono font-bold ${
                                            isPositiveEdge ? 'text-white' : 'text-gray-400'
                                        }`}>
                                            {isPositiveEdge ? '+' : ''}{edge}%
                                        </div>
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
                                        className="border-t border-white/5 bg-gradient-to-b from-[#0A0A0A] to-black relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
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
                                                    <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] text-white font-bold border border-white/10 uppercase tracking-wide">Confidence: High</span>
                                                    <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-gray-400 font-bold border border-white/5 uppercase tracking-wide">Source: Multi-Model</span>
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
                                                        <div className="flex justify-between text-[10px] text-white mb-2 uppercase font-bold tracking-wide">
                                                            <span>PredictlyAI Model</span>
                                                            <span className="font-mono">{item.aiScore}%</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                            <div className="h-full bg-white rounded-full relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.6)]" style={{ width: `${item.aiScore}%` }}></div>
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
