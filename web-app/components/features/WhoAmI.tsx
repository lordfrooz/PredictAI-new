import React, { useState } from 'react';
import { Badge } from '../ui/Primitives';

type EventType = 'POLITICS' | 'CRYPTO' | 'SPORTS' | 'POP';

const TYPE_CONFIG = {
    POLITICS: {
        news: '60%',
        social: '10%',
        momentum: '5%',
        core: '25%',
        desc: 'Elections are driven by polling data and news cycles.'
    },
    CRYPTO: {
        news: '15%',
        social: '40%',
        momentum: '35%',
        core: '10%',
        desc: 'Crypto markets react heavily to social sentiment and technicals.'
    },
    SPORTS: {
        news: '10%',
        social: '5%',
        momentum: '5%',
        core: '80%',
        desc: 'Sports outcomes are pure statistics and historical performance.'
    },
    POP: {
        news: '20%',
        social: '70%',
        momentum: '5%',
        core: '5%',
        desc: 'Viral events are dominated by social media trends.'
    }
};

export const WhoAmI = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [activeType, setActiveType] = useState<EventType>('POLITICS');
  const totalSteps = 5;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-300" 
        onClick={onClose}
      ></div>

      {/* Side Panel */}
    <div className="w-full max-w-lg h-full bg-[#050505] border-l border-[#222] relative shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out animate-slide-in-right flex flex-col">
        
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        
        {/* Header */}
                <div className="p-6 border-b border-[#222] flex justify-between items-center relative z-10 bg-[#050505]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                        </div>
                        <div>
                                <h2 className="text-sm font-bold text-white font-mono tracking-widest uppercase">System Architecture</h2>
                                <div className="text-[10px] text-gray-500 font-mono">INTELLIGENCE BRIEFING - {step}/{totalSteps}</div>
                        </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
          
          {/* STEP 1: CONCEPTUAL SHIFT */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-[#1a1a1a] font-mono">01</div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        Beyond "Number Go Up"
                    </h3>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                        <svg className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono relative z-10">
                        Most tools track asset prices (Crypto, Stocks). <strong className="text-blue-400">PredictlyAI tracks OUTCOMES.</strong>
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono mt-3 relative z-10">
                        We model the probability of real-world events: Elections, Fed Rates, Product Launches, Geopolitics. 
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                        <span>Traditional</span>
                        <span>PredictlyAI Approach</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-[#111] rounded-lg border border-[#222]">
                        <div className="flex-1 text-center text-xs text-gray-500 line-through decoration-red-500/50">"Buy Bitcoin"</div>
                        <div className="w-px h-8 bg-[#333]"></div>
                        <div className="flex-1 text-center text-xs text-white font-bold text-blue-400">"Will BTC hit 100k by Q4?"</div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-[#111] rounded-lg border border-[#222]">
                        <div className="flex-1 text-center text-xs text-gray-500 line-through decoration-red-500/50">"Short Tesla"</div>
                        <div className="w-px h-8 bg-[#333]"></div>
                        <div className="flex-1 text-center text-xs text-white font-bold text-blue-400">"Will Apple Vision Pro Flop?"</div>
                    </div>
                </div>
            </div>
          )}

          {/* STEP 2: DYNAMIC WEIGHTING */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-[#1a1a1a] font-mono">02</div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        Context-Aware Analysis
                    </h3>
                </div>

                <p className="text-xs text-gray-400 font-mono">
                    PredictlyAI is not static. We dynamically adjust our algorithm based on the market type.
                </p>

                {/* Type Selector */}
                <div className="flex gap-2 p-1 bg-[#111] rounded-lg border border-[#222]">
                    {(['POLITICS', 'CRYPTO', 'SPORTS', 'POP'] as EventType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`flex-1 py-2 rounded text-[10px] font-bold font-mono transition-all ${
                                activeType === type 
                                ? 'bg-white text-black shadow-lg' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded text-center">
                    <p className="text-[10px] text-blue-300 font-mono italic">
                        "{TYPE_CONFIG[activeType].desc}"
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Vector 1: News */}
                    <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-white uppercase">Global News</span>
                        </div>
                        <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-green-500 transition-all duration-500 ease-out"
                                style={{ width: TYPE_CONFIG[activeType].news }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono">{TYPE_CONFIG[activeType].news} Weight</p>
                    </div>

                    {/* Vector 2: Social */}
                    <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-white uppercase">Social Hive</span>
                        </div>
                        <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: TYPE_CONFIG[activeType].social }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono">{TYPE_CONFIG[activeType].social} Weight</p>
                    </div>

                    {/* Vector 3: Technicals */}
                    <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-white uppercase">Momentum</span>
                        </div>
                        <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-yellow-500 transition-all duration-500 ease-out"
                                style={{ width: TYPE_CONFIG[activeType].momentum }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono">{TYPE_CONFIG[activeType].momentum} Weight</p>
                    </div>

                    {/* Vector 4: Fundamentals */}
                    <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-white uppercase">Core Data</span>
                        </div>
                        <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-purple-500 transition-all duration-500 ease-out"
                                style={{ width: TYPE_CONFIG[activeType].core }}
                            ></div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono">{TYPE_CONFIG[activeType].core} Weight</p>
                    </div>
                </div>
            </div>
          )}

          {/* STEP 3: THE BRAIN (PROCESSING) */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-[#1a1a1a] font-mono">03</div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        The Scoring Engine
                    </h3>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-5 relative overflow-hidden">
                    {/* Visualizing Logic */}
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center border-b border-[#333] pb-2">
                            <span className="text-[10px] text-gray-400 font-mono">INPUT EVENT</span>
                            <span className="text-xs text-white font-bold">"Fed Rate Cut in March?"</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-500">NEWS (AI HEADLINES)</span>
                                <span className="text-green-400">+6.2 (Policy cues)</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-500">SOCIAL (PULSE)</span>
                                <span className="text-blue-400">+2.4 (Neutral bias)</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-500">MOMENTUM (24H)</span>
                                <span className="text-yellow-400">+1.8 (Market shift)</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-500">CORE (LIQUIDITY)</span>
                                <span className="text-purple-400">+3.1 (Depth check)</span>
                            </div>
                        </div>

                        <div className="h-px w-full bg-[#333]"></div>

                        <div className="flex justify-between items-end">
                            <div className="text-[10px] text-gray-400 font-mono">WEIGHTED PROBABILITY</div>
                            <div className="text-3xl font-black text-white font-mono tracking-tighter">
                                72.4<span className="text-lg text-gray-600">%</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-[50px]"></div>
                </div>

                <p className="text-xs text-gray-400 font-mono text-center">
                    We blend news, social, momentum, and core liquidity using event-specific weights. If pAI is unavailable, scores fall back to quant-only.
                </p>
            </div>
          )}

          {/* STEP 4: THE VALUE GAP */}
          {step === 4 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-[#1a1a1a] font-mono">04</div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        Finding The Edge
                    </h3>
                </div>

                <p className="text-xs text-gray-400 font-mono">
                    We don't just tell you the odds. We tell you if the market is <strong>WRONG</strong>.
                </p>

                {/* Chart Visualization */}
                <div className="bg-[#050505] border border-[#333] rounded-xl p-4 relative">
                    <div className="flex justify-between mb-6">
                        <div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-widest">Prediction Event</div>
                            <div className="text-xs font-bold text-white">NVIDIA Q4 Earnings Beat</div>
                        </div>
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30">OPPORTUNITY</Badge>
                    </div>

                    <div className="relative h-24 w-full flex items-end gap-2 mb-4">
                        {/* Market Bar */}
                        <div className="w-1/2 bg-[#1a1a1a] rounded-t-lg relative group h-[55%] flex flex-col justify-end border-t border-l border-r border-[#333]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono">MARKET</div>
                            <div className="text-center text-xl font-bold text-gray-400 pb-2">55%</div>
                        </div>
                        
                        {/* AI Bar */}
                        <div className="w-1/2 bg-gradient-to-t from-blue-900/40 to-blue-500/20 rounded-t-lg relative group h-[78%] flex flex-col justify-end border-t border-l border-r border-blue-500/50">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 font-mono font-bold">PredictlyAI MODEL</div>
                            <div className="text-center text-xl font-bold text-white pb-2">78%</div>
                        </div>
                        
                        {/* Gap Indicator */}
                        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 h-[33%] w-px bg-green-500 border-l border-dashed border-green-500"></div>
                        <div className="absolute top-[35%] left-1/2 translate-x-2 text-[10px] font-bold text-green-400 bg-black/80 px-1 rounded">
                            +23% EDGE
                        </div>
                    </div>

                    <div className="p-2 bg-green-900/10 border border-green-500/20 rounded text-center">
                        <span className="text-[10px] text-green-400 font-mono">CONCLUSION: MARKET UNDERPRICING REALITY</span>
                    </div>
                </div>
            </div>
          )}

          {/* STEP 5: INFORMATIONAL ADVANTAGE */}
          {step === 5 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-[#1a1a1a] font-mono">05</div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        Informational Advantage
                    </h3>
                </div>

                <p className="text-xs text-gray-400 font-mono">
                    We provide the intelligence. You make the decisions.
                </p>

                {/* Info Card */}
                <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex gap-3">
                            <div className="w-1 bg-blue-500 rounded-full"></div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Pure Analytics</h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                                    We deliver raw probabilities, confidence intervals, and deviation scores. We do not execute trades, hold funds, or offer financial advice.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-1 bg-purple-500 rounded-full"></div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Your Edge</h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                                    Use PredictlyAI as your due diligence engine. Cross-reference our models with your own research to validate high-conviction opportunities.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-red-900/10 border border-red-900/20 rounded-lg">
                    <p className="text-[9px] text-red-400/80 font-mono text-center uppercase tracking-wider">
                        Disclaimer: For Informational Purposes Only. Not Financial Advice.
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold font-mono text-xs rounded hover:bg-gray-200 transition-colors uppercase tracking-widest">
                        Enter System
                    </button>
                </div>
            </div>
          )}

        </div>
        
        {/* Footer Navigation */}
        <div className="p-6 border-t border-[#222] bg-[#0A0A0A] shrink-0 relative z-10 flex gap-4">
            {step > 1 ? (
                <button 
                    onClick={() => setStep(step - 1)} 
                    className="flex-1 py-3 bg-[#111] text-gray-300 font-bold font-mono text-xs uppercase tracking-widest hover:bg-[#222] hover:text-white transition-colors rounded-sm border border-[#333]"
                >
                    &lt; Back
                </button>
            ) : (
                <div className="flex-1"></div>
            )}
            
            {step < totalSteps ? (
                <button 
                    onClick={() => setStep(step + 1)} 
                    className="flex-1 py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-sm"
                >
                    Next &gt;
                </button>
            ) : (
                <button 
                    onClick={onClose} 
                    className="flex-1 py-3 bg-blue-600 text-white font-bold font-mono text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors rounded-sm shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                    Initialize
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
