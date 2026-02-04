import React from 'react';
import { Badge } from '../ui/Primitives';

// Local type for legacy AnalysisView component (not currently used in the app)
interface AnalysisResult {
  summary: {
    title: string;
    category: string;
    marketStage: string;
    dominantSide: string;
    image?: string;
  };
  confidenceScore: 'High' | 'Medium' | 'Low';
  signals: {
    crowdBias: string;
    liquidityQuality: string;
    priceConfidence: string;
  };
  risks: {
    overpricing: boolean;
    crowdedTrade: boolean;
    timing: boolean;
  };
  interpretations: string[];
  finalNote: string;
  // Optional whale data passed from backend
  whaleData?: {
    buyWall: number;
    sellWall: number;
    largeTrades: number;
  };
}

export const AnalysisView = ({ result }: { result: AnalysisResult }) => {
  return (
    <div className="space-y-6 reveal-animation max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-lg md:col-span-2 border border-[#333] bg-[#0A0A0A] relative overflow-hidden group">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          
          {/* Logo Background */}
          {result.summary.image && (
             <div className="absolute right-0 top-0 w-64 h-64 opacity-5 blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/3 pointer-events-none" 
                  style={{ backgroundImage: `url(${result.summary.image})`, backgroundSize: 'cover' }} />
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    Target Market
                </div>
                {result.summary.image && (
                    <img src={result.summary.image} alt="Market Logo" className="w-12 h-12 rounded-lg border border-[#333] shadow-lg object-cover transition-all duration-500" />
                )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2 font-mono tracking-tight">{result.summary.title}</h2>
            <div className="flex gap-3">
                <Badge className="bg-white text-black font-bold">{result.summary.category}</Badge>
                <Badge variant="outline" className="border-gray-700 text-gray-400 font-mono">{result.summary.marketStage} Stage</Badge>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex flex-col justify-center items-center relative overflow-hidden bg-[#0A0A0A] border border-[#333]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          <div className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest z-10">Confidence Score</div>
          <div className={`text-6xl font-bold z-10 font-mono tracking-tighter ${
            result.confidenceScore === 'High' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' :
            result.confidenceScore === 'Medium' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {result.confidenceScore === 'High' ? '98' : result.confidenceScore === 'Medium' ? '75' : '45'}
            <span className="text-lg align-top ml-1 opacity-50">%</span>
          </div>
          <div className={`text-xs mt-2 font-mono ${
              result.confidenceScore === 'High' ? 'text-green-400' : 'text-gray-500'
          }`}>
              {result.confidenceScore.toUpperCase()} CONFIDENCE
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Signals */}
        <div className="glass-panel p-6 rounded-lg space-y-6 bg-[#0A0A0A] border border-[#333]">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono border-b border-[#222] pb-3 flex items-center gap-2">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Behavior Signals
          </h3>
          <div className="space-y-5">
            <SignalRow label="Crowd Bias" value={result.signals.crowdBias} />
            <SignalRow label="Liquidity" value={result.signals.liquidityQuality} />
            <SignalRow label="Price Conviction" value={result.signals.priceConfidence} />
          </div>
        </div>

        {/* Middle Column: Risks */}
        <div className="glass-panel p-6 rounded-lg space-y-6 bg-[#0A0A0A] border border-[#333]">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono border-b border-[#222] pb-3 flex items-center gap-2">
             <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Risk Assessment
          </h3>
          <div className="space-y-5">
            <RiskRow label="Overpricing" active={result.risks.overpricing} />
            <RiskRow label="Crowded Trade" active={result.risks.crowdedTrade} />
            <RiskRow label="Timing Risk" active={result.risks.timing} />
          </div>
        </div>

        {/* Right Column: Dominance */}
        <div className="glass-panel p-6 rounded-lg flex flex-col justify-between bg-[#0A0A0A] border border-[#333]">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono border-b border-[#222] pb-3 mb-4 flex items-center gap-2">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>
            Market Dominance
          </h3>
          <div className="flex-1 flex items-center justify-center">
             <div className="text-center">
                <div className="text-5xl font-black text-white tracking-tighter font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {result.summary.dominantSide}
                </div>
                <div className="text-[10px] text-gray-500 mt-3 font-mono uppercase tracking-widest">Dominant Sentiment</div>
             </div>
          </div>
        </div>
      </div>

      {/* Whale Radar (New) */}
      <WhaleRadar data={result.whaleData} />

      {/* Interpretation */}
      <div className="glass-panel p-8 rounded-lg bg-[#0A0A0A] border border-[#333] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            AI Analysis Log
        </h3>
        <div className="grid md:grid-cols-2 gap-10">
          <ul className="space-y-4">
            {result.interpretations.map((item, i) => (
              <li key={i} className="flex items-start text-gray-300 font-light text-sm leading-relaxed group">
                <span className="mr-4 text-gray-600 font-mono mt-1 group-hover:text-white transition-colors">0{i+1}</span>
                <span className="group-hover:text-white transition-colors">{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg flex items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="text-gray-500 text-[10px] font-bold uppercase mb-3 tracking-widest font-mono">Final Conclusion</div>
              <p className="text-lg text-white font-medium leading-relaxed font-mono border-l-2 border-white pl-4">
                "{result.finalNote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SignalRow({ label, value }: { label: string, value: string }) {
  let color = "text-gray-500";
  if (['High', 'Strong'].includes(value)) color = "text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]";
  if (['Medium', 'Moderate'].includes(value)) color = "text-gray-300";
  if (['Low', 'Weak'].includes(value)) color = "text-gray-600";

  return (
    <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded transition-colors -mx-2">
      <span className="text-gray-400 text-xs font-mono uppercase tracking-wide group-hover:text-white transition-colors">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{value.toUpperCase()}</span>
    </div>
  );
}

function RiskRow({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded transition-colors -mx-2">
      <span className="text-gray-400 text-xs font-mono uppercase tracking-wide group-hover:text-white transition-colors">{label}</span>
      <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold font-mono uppercase tracking-wider ${
        active 
          ? "bg-red-500/10 text-red-400 border border-red-500/30" 
          : "bg-green-500/10 text-green-400 border border-green-500/30"
      }`}>
        {active ? 'DETECTED' : 'SECURE'}
      </span>
    </div>
  );
}

function WhaleRadar({ data }: { data?: { buyWall: number; sellWall: number; largeTrades: number } }) {
  // Use passed data or fallback to zeros
  const whaleData = data || { buyWall: 0, sellWall: 0, largeTrades: 0 };
  
  // Always show, even if empty (Removed hidden check)

  return (
    <div className="glass-panel p-6 rounded-lg bg-[#0A0A0A] border border-[#333] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Whale Radar (Order Book Analysis)
            </h3>
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-mono">
                CLOB DATA LIVE
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
            {/* Buy Walls */}
            <div className="bg-white/5 p-4 rounded border border-white/5 flex flex-col items-center justify-center group hover:border-green-500/30 transition-colors">
                <div className="text-2xl font-bold text-white font-mono mb-1 group-hover:text-green-400 transition-colors">
                    {whaleData.buyWall}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Buy Walls ($10k+)</div>
            </div>

            {/* Sell Walls */}
            <div className="bg-white/5 p-4 rounded border border-white/5 flex flex-col items-center justify-center group hover:border-red-500/30 transition-colors">
                <div className="text-2xl font-bold text-white font-mono mb-1 group-hover:text-red-400 transition-colors">
                    {whaleData.sellWall}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Sell Walls ($10k+)</div>
            </div>

            {/* Large Trades */}
            <div className="bg-white/5 p-4 rounded border border-white/5 flex flex-col items-center justify-center group hover:border-blue-500/30 transition-colors">
                <div className="text-2xl font-bold text-white font-mono mb-1 group-hover:text-blue-400 transition-colors">
                    {whaleData.largeTrades}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Large Trades (24h)</div>
            </div>
        </div>
    </div>
  );
}
