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

  const renderInsightText = (note: string) => {
    const match = note.match(/AI Fair Value:\s*([0-9.]+%?)\s*\(Market:\s*([0-9.]+%?)\)\.?/i);
    if (!match) return note;
    const [full, aiValue, marketValue] = match;
    const idx = note.indexOf(full);
    if (idx === -1) return note;
    const before = note.slice(0, idx);
    const after = note.slice(idx + full.length);

    return (
      <>
        {before}
        <span className="text-blue-300 font-semibold">AI</span>
        <span className="text-gray-200"> Fair Value: </span>
        <span className="text-white font-semibold">{aiValue}</span>
        <span className="text-gray-500"> (Market: {marketValue})</span>
        {after}
      </>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20 px-4 md:px-6">
      
      {/* 1. STATUS BAR & HEADER - REDESIGNED */}
      <div className="relative mb-10 rounded-2xl border border-white/5 bg-[#0A0A0A] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {result.market_image ? (
                <img src={result.market_image} alt={result.title || 'Market'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-mono text-gray-500">MK</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-gray-300">
                  {result.category || 'Market'}
                </span>
                {result.cached && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Cached
                  </span>
                )}
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  ID: {result.title?.substring(0, 8)}...
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-semibold text-white tracking-tight truncate">
                {result.title}
              </h1>
            </div>
          </div>

          {onRefresh && (
            <div className="flex items-center gap-3 md:justify-end">
              {!canRefresh && (
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>Next Update: {timeLeft}m</span>
                </div>
              )}
              <button
                onClick={canRefresh ? onRefresh : undefined}
                disabled={isRefreshing || !canRefresh}
                className={`px-6 py-2.5 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-widest ${
                  canRefresh
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {canRefresh ? 'Analyze' : 'Processing'}
                </span>
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
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Analysis</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{filteredAnalysis.length} Outcomes</span>
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
                                ? 'bg-[#0F0F0F] border-white/15' 
                                : 'bg-[#0A0A0A] border-white/5 hover:border-white/10 hover:bg-[#0F0F0F]'
                            }`}
                        >
                            {/* Summary Row */}
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0 overflow-hidden">
                                        {item.image ? <img src={item.image} alt={item.option} className="w-full h-full object-cover opacity-90" /> : idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-medium text-white truncate">{item.option}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Pricing Label */}
                                            <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                                isUnderpriced ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                isOverpriced ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {item.pricingLabel}
                                            </span>
                                            
                                            {/* Edge Label - Moved Here */}
                                            {Math.abs(Number(edge)) > 0 && (
                                                <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border ${
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

                                <div className="flex items-center gap-6 md:gap-10 shrink-0">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[9px] font-mono text-gray-500 uppercase">Market</span>
                                        <span className="text-lg font-mono text-gray-300">{item.marketProbability}%</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-mono text-blue-400 uppercase font-bold tracking-wider">AI</span>
                                        <span className={`text-xl font-mono font-bold ${isPositiveEdge ? 'text-green-400' : 'text-red-400'}`}>
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
                                        className="border-t border-white/10 bg-[#0A0A0A] relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${isPositiveEdge ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <h4 className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-widest">
                                                    Insight
                                                </h4>
                                                <p className="text-sm text-gray-300 leading-relaxed font-light border-l-2 border-white/15 pl-4 py-1">
                                                    {renderInsightText(item.note || "Analysis indicates standard market efficiency for this outcome.")}
                                                </p>
                                                
                                                <div className="flex gap-2 mt-4">
                                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-[10px] text-blue-400 font-bold border border-blue-500/20 uppercase tracking-wide">Confidence: High</span>
                                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-[10px] text-purple-400 font-bold border border-purple-500/20 uppercase tracking-wide">Source: Multi-Model</span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[#0F0F0F] rounded-xl p-5 border border-white/10">
                                                <h4 className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-widest mb-4">Confidence</h4>
                                                <div className="space-y-4">
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
                                                        <div className="h-2 rounded-full overflow-hidden bg-white/10">
                                                            <div className={`h-full rounded-full ${isPositiveEdge ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${item.aiScore}%` }}></div>
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
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Distribution</span>
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
           <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Market Pulse</span>
              </div>
          </div>
          <HotActivities onSelect={onSelect} />
      </div>

    </div>
  );
}
