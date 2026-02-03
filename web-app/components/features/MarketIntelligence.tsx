import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Primitives';

interface MarketIntelligenceProps {
  topic: string;
  sentimentScore: number;
}

interface NewsItem {
    id: string;
    source: string;
    handle: string;
    headline: string;
    summary: string;
    time: string;
    timestamp: string;
    impact: "High" | "Medium" | "Low";
    sentiment: "Bullish" | "Bearish" | "Neutral";
    link: string;
    category: string;
}

export const MarketIntelligence = ({ topic, sentimentScore }: MarketIntelligenceProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minRate, setMinRate] = useState<string>('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let url = `/api/news?topic=${encodeURIComponent(topic)}`;
        if (minRate) {
            url += `&minRate=${minRate}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setNewsItems(data.news || []);
        }
      } catch (e) {
        console.error("Failed to fetch news", e);
      } finally {
        setLoading(false);
      }
    };

    if (topic) {
      fetchNews();
    }
  }, [topic, minRate]);

  // Statistics
  const stats = {
      positive: sentimentScore > 0.3 ? 75 : 45,
      neutral: 20,
      negative: sentimentScore < -0.3 ? 60 : 15,
      smartMoneyFlow: sentimentScore > 0 ? "+$2.4M" : "-$1.2M",
      volatilityIndex: Math.abs(sentimentScore) > 0.5 ? "High" : "Moderate",
      newsVolume: loading ? "Scanning..." : "Active"
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border border-white/5 relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A]/50 backdrop-blur-sm z-10">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                Intelligence Feed
            </h3>
            <div className="flex items-center gap-3">
                 <input 
                    type="number" 
                    placeholder="MIN RATE %" 
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                    className="bg-transparent border-b border-white/10 text-[10px] text-white w-20 py-1 focus:outline-none focus:border-white/40 font-mono text-right placeholder-white/20 transition-colors"
                />
            </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 border-b border-white/5 bg-white/[0.02]">
            <StatItem label="SMART MONEY" value={stats.smartMoneyFlow} />
            <StatItem label="VOLATILITY" value={stats.volatilityIndex} />
            <StatItem label="STATUS" value={stats.newsVolume} />
        </div>

        {/* Sentiment Signal Bar (Restored) */}
        <div className="p-4 border-b border-white/5">
             <div className="flex justify-between items-end mb-2">
                 <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Signal Strength</div>
                 <div className="text-[9px] font-mono text-white/60">
                    {stats.positive}% BULLISH
                 </div>
             </div>
             <div className="h-1 w-full flex bg-white/5 rounded-full overflow-hidden">
                 <div style={{ width: `${stats.positive}%` }} className="h-full bg-white opacity-90"></div>
                 <div style={{ width: `${stats.neutral}%` }} className="h-full bg-white opacity-40"></div>
                 <div style={{ width: `${stats.negative}%` }} className="h-full bg-white opacity-10"></div>
             </div>
        </div>
            
        {/* Feed Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-4 h-4 border border-white/10 border-t-white rounded-full animate-spin"></div>
                    <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Decrypting Signals...</div>
                </div>
            ) : newsItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-white/20 text-xs font-mono mb-2">NO SIGNALS DETECTED</div>
                    <p className="text-white/10 text-[10px] max-w-[200px]">
                        Filters may be too strict. Adjust parameters to expand search radius.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {newsItems.map((item) => (
                        <div key={item.id} className="group p-4 hover:bg-white/[0.02] transition-colors relative">
                             <a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
                             
                             <div className="flex justify-between items-start mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{item.source}</span>
                                    <span className="text-[9px] font-mono text-white/30">{item.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.impact === 'High' && (
                                        <span className="text-[9px] font-mono text-white tracking-wider border border-white/10 px-1">IMPACT</span>
                                    )}
                                </div>
                             </div>

                             <h4 className="text-sm font-light text-white/90 mb-3 leading-relaxed group-hover:text-white transition-colors">
                                {item.headline}
                             </h4>

                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono text-white/30 uppercase">{item.category}</span>
                                    <div className={`text-[9px] font-mono flex items-center gap-1 ${
                                        item.sentiment === 'Bullish' ? 'text-white/80' : 
                                        item.sentiment === 'Bearish' ? 'text-white/60' : 'text-white/40'
                                    }`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                            item.sentiment === 'Bullish' ? 'bg-white' : 
                                            item.sentiment === 'Bearish' ? 'bg-white/40' : 'bg-white/20'
                                        }`}></span>
                                        {item.sentiment.toUpperCase()}
                                    </div>
                                </div>
                                <span className="text-[10px] text-white/0 group-hover:text-white/40 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    ?
                                </span>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
    <div className="py-3 px-4 border-r border-white/5 last:border-r-0">
        <div className="text-[9px] text-white/30 font-mono mb-1">{label}</div>
        <div className="text-xs text-white/80 font-mono tracking-wide">{value}</div>
    </div>
);
