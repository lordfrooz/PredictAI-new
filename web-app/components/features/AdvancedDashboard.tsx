import React, { useState } from 'react';
import { SimplifiedAnalysisResult } from '@/lib/marketAnalyst';
import { ComparisonChart } from '../ui/ComparisonChart';
import { HotActivities } from './HotActivities';
import { NewsFeed } from './NewsFeed';

export const AdvancedDashboard = ({ result, onOpenGuide, onSelect }: { result: SimplifiedAnalysisResult, onOpenGuide: () => void, onSelect?: (url: string) => void }) => {
  const [showAllAnalysis, setShowAllAnalysis] = useState(false);

  // Safety Check
  if (!result || !result.analysis) {
    return <div className="text-gray-500 font-mono text-xs text-center p-20 uppercase tracking-widest">Analysis data unavailable.</div>;
  }

  const chartData = (result.analysis || []).slice(0, 5).map(item => ({
    label: item.option,
    marketValue: item.marketProbability,
    aiValue: item.aiScore,
    deviationColor: item.pricingLabel === 'Underpriced' ? '#4ade80' : // green-400
                    item.pricingLabel === 'Overpriced' ? '#f87171' : // red-400
                    '#60a5fa' // blue-400 for neutral
  }));

  const displayedAnalysis = showAllAnalysis ? result.analysis : result.analysis.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-white/5 pb-10">
         
         <div className="flex gap-6 items-start w-full">
            {result.market_image ? (
                <div className="relative shrink-0 group">
                    <img src={result.market_image} alt="logo" className="w-24 h-24 border border-white/10 bg-black object-cover transition-all duration-500 rounded-2xl" />
                </div>
            ) : (
                <div className="w-24 h-24 border border-white/10 bg-white/5 flex items-center justify-center rounded-2xl">
                    <span className="text-2xl font-mono text-gray-700">#</span>
                </div>
            )}
            
            <div className="flex-1 min-w-0 pt-1">
               <div className="flex flex-wrap gap-3 mb-4 items-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-mono flex items-center gap-2 px-3 py-1 border border-green-500/20 bg-green-500/5 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                     <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span>
                     Live Analysis
                  </span>
                  {result.marketStructure && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-mono px-3 py-1 border border-blue-500/20 bg-blue-500/5 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.1)]">
                          {result.marketStructure}
                      </span>
                  )}
               </div>
               
               <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-4 leading-tight">
                   {result.event}
               </h1>
               
               <div className="text-gray-400 text-sm font-light max-w-3xl leading-relaxed border-l-2 border-white/10 pl-4 ml-1 italic flex items-center gap-2">
                  <span>Hybrid Intelligence:</span>
                  <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 not-italic text-white text-xs shadow-lg">
                     {/* PredictlyAI Logo */}
                     <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white">PredictlyAI</span>
                     </div>
                  </span>
                  <span>+ Quant Model</span>
               </div>
            </div>

            <button 
                onClick={onOpenGuide}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-transparent border border-white/10 text-[10px] text-gray-400 font-mono hover:bg-white hover:text-black transition-all uppercase tracking-widest whitespace-nowrap"
            >
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-current rounded-full">?</span>
                Methodology
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 2. Main Probability List */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Chart Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                    <h3 className="text-sm font-light text-white flex items-center gap-2">
                        Market vs AI Divergence
                    </h3>
                    <div className="flex gap-4 text-[10px] font-mono uppercase tracking-wider">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#333]"></div> <span className="text-gray-500">Market</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white"></div> <span className="text-white">AI Model</span></div>
                    </div>
                </div>
                
                <div className="p-6 border border-white/5 bg-[#0A0A0A] relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                    {/* Add Blue/Purple Gradient Glow similar to Landing Page */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none"></div>
                    <ComparisonChart data={chartData} />
                </div>
            </div>

            {/* Analysis Cards */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <h3 className="text-sm font-light text-white">Outcome Analysis</h3>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                {displayedAnalysis.map((item, idx) => (
                    <div key={idx} className="group relative bg-[#0A0A0A] border border-white/5 hover:border-white/20 p-6 transition-all duration-300 overflow-hidden rounded-[2rem]">
                        {/* Dynamic Background Glow based on Pricing */}
                        <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                             item.pricingLabel === 'Underpriced' ? 'from-green-500/5 via-emerald-500/5 to-transparent' :
                             item.pricingLabel === 'Overpriced' ? 'from-red-500/5 via-orange-500/5 to-transparent' :
                             'from-white/5 via-gray-500/5 to-transparent'
                        }`}></div>

                        <div className="flex flex-col md:flex-row gap-6 relative z-10">
                           {/* Left: Info */}
                           <div className="flex-1 min-w-0 space-y-4">
                               <div className="flex items-start justify-between gap-4">
                                   <div className="flex items-center gap-4">
                                       {item.image && (
                                            <img src={item.image} alt={item.option} className="w-12 h-12 object-cover grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/10 rounded-2xl" />
                                       )}
                                       <div>
                                            <h4 className="text-lg font-light text-white tracking-tight">{item.option}</h4>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono uppercase tracking-wider border rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${
                                                    item.pricingLabel === 'Underpriced' ? 'text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_8px_rgba(74,222,128,0.2)]' :
                                                    item.pricingLabel === 'Overpriced' ? 'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 
                                                    'text-gray-400 border-white/10 bg-white/5'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${
                                                        item.pricingLabel === 'Underpriced' ? 'bg-green-400 animate-pulse' :
                                                        item.pricingLabel === 'Overpriced' ? 'bg-red-400 animate-pulse' : 'bg-gray-400'
                                                    }`}></span>
                                                    {item.pricingLabel}
                                                </span>
                                            </div>
                                       </div>
                                   </div>
                               </div>

                               {/* AI Rationale */}
                               <div className="pl-16 relative">
                                    <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${
                                        item.pricingLabel === 'Underpriced' ? 'bg-gradient-to-b from-green-500/50 to-transparent' :
                                        item.pricingLabel === 'Overpriced' ? 'bg-gradient-to-b from-red-500/50 to-transparent' : 'bg-gradient-to-b from-white/20 to-transparent'
                                    }`}></div>
                                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 relative group-hover:bg-white/[0.05] transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {/* PredictlyAI Logo / Icon */}
                                                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                                    <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                                                </div>
                                                <div className="text-[10px] text-white font-mono uppercase tracking-wider font-bold">
                                                    PredictlyAI Analysis
                                                </div>
                                            </div>
                                            
                                            {/* Mini Score Comparison */}
                                            <div className="flex items-center gap-3 text-[9px] font-mono bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                                                <div className="text-gray-500">
                                                    MKT: <span className="text-gray-300">{item.marketProbability}%</span>
                                                </div>
                                                <div className="w-px h-3 bg-white/10"></div>
                                                <div className={item.aiScore > item.marketProbability ? "text-green-400" : "text-red-400"}>
                                                    PredictlyAI: <span className="font-bold">{item.aiScore}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-xs text-gray-300 font-light leading-relaxed italic pl-1">
                                            "{item.note}"
                                        </p>
                                    </div>
                               </div>
                           </div>
                           
                           {/* Right: Stats */}
                           <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:gap-1 shrink-0 md:w-32 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                              <div className="text-right">
                                  <div className="text-[9px] text-gray-600 uppercase font-mono tracking-widest mb-1">AI Score</div>
                                  <div className={`text-3xl font-light tracking-tighter ${
                                     item.aiScore > 75 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400' : 'text-gray-400'
                                  }`}>
                                     {item.aiScore}<span className="text-sm text-gray-600">%</span>
                                  </div>
                              </div>
                              
                              <div className="text-right">
                                  <div className="text-[9px] text-gray-600 uppercase font-mono tracking-widest mb-1">Deviation</div>
                                  <div className={`text-sm font-mono font-bold ${
                                      (item.pricingDeviation ?? 0) > 0 ? 'text-green-400' : (item.pricingDeviation ?? 0) < 0 ? 'text-red-400' : 'text-gray-500'
                                  }`}>
                                      {(item.pricingDeviation ?? 0) > 0 ? '+' : ''}{item.pricingDeviation ?? 0}%
                                  </div>
                              </div>
                           </div>
                        </div>

                        {/* Comparative Bar */}
                        <div className="mt-6 relative h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                           {/* Market Marker */}
                           <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10" style={{ left: `${item.marketProbability}%` }}></div>
                           
                           {/* AI Bar */}
                           <div className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                               item.pricingLabel === 'Underpriced' ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.4)]' :
                               item.pricingLabel === 'Overpriced' ? 'bg-gradient-to-r from-red-500 to-orange-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 
                               'bg-white/30'
                           }`} style={{ width: `${item.aiScore}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                            <span>Market: {item.marketProbability}%</span>
                            <span>AI Model</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {result.analysis.length > 5 && (
                <button 
                    onClick={() => setShowAllAnalysis(!showAllAnalysis)}
                    className="w-full py-4 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-white border border-white/5 hover:bg-white/5 rounded-[2rem] transition-all"
                >
                    {showAllAnalysis ? 'Show Less' : `View ${result.analysis.length - 5} More Outcomes`}
                </button>
            )}
         </div>

         {/* 3. Sidebar: Feed & Activities */}
         <div className="space-y-8 h-full">
            <div className="sticky top-8 space-y-6 h-[calc(100vh-100px)] flex flex-col">
                <div className="flex-1 min-h-0">
                    <HotActivities onSelect={onSelect} />
                </div>
                <div className="flex-1 min-h-0">
                    <NewsFeed topic={result.event ?? result.title} />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
