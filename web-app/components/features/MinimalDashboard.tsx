'use client';

import { useState } from 'react';
import { SimplifiedAnalysisResult } from '@/lib/marketAnalyst';
import { HotActivities } from './HotActivities';
import { NewsFeed } from './NewsFeed';
import { ComparisonChart } from '@/components/ui/ComparisonChart';
import { SocialSentiment } from './SocialSentiment';

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
  const topOutcome = safeAnalysis[0] || {
    option: 'Unknown',
    marketProbability: 0,
    aiScore: 0,
    pricingLabel: 'Neutral',
    note: 'No analysis data available.'
  };

  const isUnderpriced = topOutcome.pricingLabel === 'Underpriced';
  const isOverpriced = topOutcome.pricingLabel === 'Overpriced';

  // Whale Data from Result
  const whaleData = (result as any).event_metrics?.whaleData || { buyWall: 0, sellWall: 0, largeTrades: 0 };
  const hasWhaleActivity = whaleData.buyWall > 0 || whaleData.sellWall > 0 || whaleData.largeTrades > 0;

  // Cache status display
  const getCacheStatus = () => {
    if (!result.cached && result.cacheAgeMinutes === 0) {
      return { text: 'Fresh analysis', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' };
    }
    if (result.cacheAgeMinutes !== undefined) {
      const age = result.cacheAgeMinutes;
      const ttl = result.ttlMinutes || 120;
      const ratio = age / ttl;
      
      if (ratio < 0.3) {
        return { text: `Updated ${age}m ago`, color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' };
      } else if (ratio < 0.7) {
        return { text: `Updated ${age}m ago`, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' };
      } else {
        return { text: `Updated ${age}m ago`, color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' };
      }
    }
    return { text: 'Analysis ready', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' };
  };

  const cacheStatus = getCacheStatus();

  const filteredAnalysis = safeAnalysis
    .filter(item => item.marketProbability >= 2)
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

    const [showAllOptions, setShowAllOptions] = useState(false);
  const displayOptions = showAllOptions ? filteredAnalysis : filteredAnalysis.slice(0, 2);

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20 px-4 md:px-8">
      {/* Whale Alert Banner (Always Visible) */}
      <div className="mb-6 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
          <div className="flex gap-4 text-xs font-mono text-blue-300">
            <span>WHALES BUYING: <b className="text-white">{whaleData.buyWall}</b></span>
            <span>WHALES SELLING: <b className="text-white">{whaleData.sellWall}</b></span>
            <span>RECENT BIG TRADES: <b className="text-white">{whaleData.largeTrades}</b></span>
          </div>
          <div className="text-[10px] text-blue-500/50 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            LIVE WHALE TRACKER
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8 border-b border-white/5 pb-8">
         <div className="flex gap-5 items-start">
             {result.market_image ? (
                  <img src={result.market_image} alt="Market" className="w-16 h-16 rounded-xl border border-white/10 object-cover bg-white/5" />
              ) : (
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xl font-mono text-gray-600">#</div>
              )}
             <div>
                 <div className="flex flex-wrap gap-2 mb-2">
                     <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                         isUnderpriced ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                         isOverpriced ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                         'border-blue-500/30 text-blue-400 bg-blue-500/10'
                     }`}>
                         {topOutcome.pricingLabel}
                     </span>
                     <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 text-gray-400">
                         {result.category || 'Binary'}
                     </span>
                     {/* Cache Status Badge */}
                     <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${cacheStatus.bgColor} ${cacheStatus.color} flex items-center gap-1`}>
                         <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                         {cacheStatus.text}
                     </span>
                 </div>
                 <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight leading-tight max-w-3xl">
                     {result.title}
                 </h1>
             </div>
         </div>
         {/* Refresh Button */}
         {onRefresh && (
           <button
             onClick={onRefresh}
             disabled={isRefreshing || (result.refreshAvailableIn !== undefined && result.refreshAvailableIn > 0)}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
               isRefreshing || (result.refreshAvailableIn !== undefined && result.refreshAvailableIn > 0)
                 ? 'border-white/10 text-gray-500 cursor-not-allowed' 
                 : 'border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5'
             }`}
             title={result.refreshAvailableIn && result.refreshAvailableIn > 0 ? `Wait ${result.refreshAvailableIn}m to refresh` : 'Refresh analysis'}
           >
             <svg 
               className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
               fill="none" 
               stroke="currentColor" 
               viewBox="0 0 24 24"
             >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
             <span className="text-sm font-medium">
               {isRefreshing ? 'Refreshing...' : 
                result.refreshAvailableIn && result.refreshAvailableIn > 0 ? `Wait ${result.refreshAvailableIn}m` : 
                'Refresh'}
             </span>
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
              <div className="rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000"></div>

                  <div className="p-8 pb-4 relative z-10 flex justify-between items-start border-b border-white/5">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                  <div className="w-4 h-4 bg-black rounded-full"></div>
                              </div>
                              <h2 className="text-xl font-medium text-white tracking-tight">Intelligence Report</h2>
                          </div>
                          <p className="text-sm text-gray-400 font-light max-w-xl">
                              Real-time analysis of probability divergence across all outcomes.
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-gray-400">
                              CONFIDENCE: <span className="text-white font-bold">{topOutcome.aiScore > 80 ? 'HIGH' : 'MEDIUM'}</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 space-y-3 relative z-10">
                      
                      {displayOptions.map((item, idx) => (
                          <div key={idx} className="group/item relative overflow-hidden rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 hover:bg-black/60 transition-all duration-300">
                              <div className="flex flex-col md:flex-row">
                                  <div className="p-5 md:w-[280px] shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01]">
                                      <div className="flex items-center gap-4 mb-4">
                                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0 relative">
                                              {item.image ? (
                                                  <img src={item.image} alt={item.option} className="w-full h-full object-cover" />
                                              ) : (
                                                  <span className="text-lg font-bold text-white/20">{item.option.charAt(0)}</span>
                                              )}
                                          </div>
                                          <div className="min-w-0">
                                              <h3 className="text-lg font-medium text-white leading-tight truncate">{item.option}</h3>
                                              <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                                                  item.pricingLabel === 'Underpriced' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                  item.pricingLabel === 'Overpriced' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                              }`}>
                                                  <span className={`w-1 h-1 rounded-full ${
                                                      item.pricingLabel === 'Underpriced' ? 'bg-green-400' :
                                                      item.pricingLabel === 'Overpriced' ? 'bg-red-400' : 'bg-blue-400'
                                                  }`}></span>
                                                  {item.pricingLabel}
                                              </div>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 mt-auto">
                                          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                              <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Market</div>
                                              <div className="text-base font-mono text-gray-300">{item.marketProbability}%</div>
                                          </div>
                                          <div className="p-2 rounded-lg bg-white/5 border border-white/5 relative overflow-hidden">
                                              <div className={`absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl ${
                                                  item.aiScore > item.marketProbability ? 'from-green-500/20' : 'from-red-500/20'
                                              } blur-lg rounded-full`}></div>
                                              <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">PredictlyAI Model</div>
                                              <div className={`text-base font-mono font-bold ${
                                                  item.aiScore > item.marketProbability ? 'text-green-400' :
                                                  item.aiScore < item.marketProbability ? 'text-red-400' : 'text-blue-400'
                                              }`}>
                                                  {item.aiScore}%
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex-1 p-5 flex flex-col justify-center relative">
                                      <div className="absolute top-4 left-4 text-4xl text-white/5 font-serif font-bold italic">"</div>
                                      <p className="text-sm text-gray-300 font-light leading-relaxed pl-6 relative z-10">
                                          {item.note || (
                                              item.pricingLabel === 'Underpriced'
                                              ? `Our models detect a significant inefficiency here. Social sentiment and news volume suggest a higher probability (${item.aiScore}%) than the current market consensus (${item.marketProbability}%). This represents a strong value opportunity.`
                                              : item.pricingLabel === 'Overpriced'
                                              ? `Market enthusiasm appears overheated. While popular, our data indicates the true probability (${item.aiScore}%) is lower than the trading price (${item.marketProbability}%). Caution is advised as correction is likely.`
                                              : 'Market pricing aligns closely with our predictive models. The current spread is within standard volatility margins, suggesting an efficient market state for this outcome.'
                                          )}
                                      </p>

                                      <div className="mt-6 flex items-center gap-3">
                                          <div className="text-[9px] font-mono text-gray-500 uppercase">Divergence</div>
                                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden flex relative">
                                              <div
                                                  className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
                                                  style={{ left: `${item.marketProbability}%` }}
                                              ></div>
                                              <div
                                                  className={`h-full transition-all duration-1000 ${
                                                      item.aiScore > item.marketProbability ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                                                  }`}
                                                  style={{ width: `${item.aiScore}%` }}
                                              ></div>
                                          </div>
                                          <div className={`text-[10px] font-mono font-bold ${
                                              item.aiScore > item.marketProbability ? 'text-green-400' : 'text-red-400'
                                          }`}>
                                              {item.aiScore > item.marketProbability ? '+' : ''}
                                              {(item.aiScore - item.marketProbability).toFixed(1)}%
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {filteredAnalysis.length > 2 && (
                      <div className="p-4 pt-0 relative z-10">
                          <button
                              onClick={() => setShowAllOptions(!showAllOptions)}
                              className="w-full py-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group/btn flex items-center justify-center gap-2"
                          >
                              <span className="text-xs font-mono uppercase tracking-widest text-gray-400 group-hover/btn:text-white transition-colors">
                                  {showAllOptions ? 'Show Less' : `Analyze ${filteredAnalysis.length - 2} More Scenarios`}
                              </span>
                              <svg className={`w-3 h-3 text-gray-500 group-hover/btn:text-white transition-all ${showAllOptions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                          </button>
                      </div>
                  )}
              </div>

              <div className="p-8 rounded-[2.25rem] bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border border-white/10 relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none"></div>
                  <div className="absolute -left-24 -bottom-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none"></div>

                  <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                              <div className="w-7 h-7 rounded-full bg-white/90 border border-white/40 flex items-center justify-center">
                                  <div className="w-3.5 h-3.5 rounded-full bg-black"></div>
                              </div>
                          </div>
                          <div>
                              <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-semibold text-white tracking-tight">pAI Probability Distribution</h3>
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">PredictlyAI</span>
                              </div>
                              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Signal map - Confidence spread</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 uppercase tracking-widest">
                              Model Focus
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                              Live
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Coverage</div>
                          <div className="text-lg font-semibold text-white mt-1">{chartData.length}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Avg Market</div>
                          <div className="text-lg font-semibold text-white mt-1">
                              {chartData.length
                                  ? (chartData.reduce((sum, item) => sum + item.marketValue, 0) / chartData.length).toFixed(1)
                                  : '0.0'}%
                          </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Avg AI</div>
                          <div className="text-lg font-semibold text-white mt-1">
                              {chartData.length
                                  ? (chartData.reduce((sum, item) => sum + item.aiValue, 0) / chartData.length).toFixed(1)
                                  : '0.0'}%
                          </div>
                      </div>
                  </div>

                  <div className="h-[300px] relative z-10">
                      <ComparisonChart data={chartData} />
                  </div>
              </div>

              <NewsFeed topic={result.title || 'market'} />
          </div>

          <div className="lg:col-span-4 space-y-8">
              <HotActivities onSelect={onSelect} />
              <SocialSentiment topic={result.title || 'market'} sentimentScore={Math.round(topOutcome.aiScore || 0)} />
          </div>
      </div>
    </div>
  );
}
