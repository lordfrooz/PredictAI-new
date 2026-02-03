import React, { useEffect, useState } from 'react';

interface NewsFeedProps {
  topic: string;
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

export const NewsFeed = ({ topic }: NewsFeedProps) => {
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

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-white/[0.04] via-black/50 to-black/70 border border-white/10 relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-[90px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-[90px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

        {/* Header with Filter */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/90">Relevant News</h3>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">Precision filtered</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-white/60">
                    Min %
                </div>
                <input 
                    type="number" 
                    placeholder="0" 
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                    className="bg-transparent border-b border-white/10 text-[10px] text-white w-14 py-1 focus:outline-none focus:border-white/40 font-mono text-right placeholder-white/20 transition-colors"
                />
            </div>
        </div>

        {/* News Feed */}
        <div className="max-h-[520px] overflow-y-auto custom-scrollbar relative z-10">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-4 h-4 border border-white/10 border-t-white rounded-full animate-spin"></div>
                    <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Fetching Data...</div>
                </div>
            ) : newsItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-white/20 text-xs font-mono mb-2">NO NEWS FOUND</div>
                    <p className="text-white/10 text-[10px] max-w-[200px]">
                        Try adjusting your filters or check back later.
                    </p>
                </div>
            ) : (
                <div className="p-3 space-y-3">
                    {newsItems.map((item) => (
                    <a 
                        key={item.id} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-500/5 via-transparent to-transparent"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{item.source}</span>
                                    <span className="text-[9px] font-mono text-white/40">{item.time}</span>
                                </div>
                                {item.impact === 'High' && (
                                    <span className="text-[9px] font-mono text-white/90 tracking-widest border border-white/10 bg-white/5 px-2 py-0.5 rounded-full">IMPACT</span>
                                )}
                            </div>
                            
                            <h4 className="text-sm font-medium text-white/90 mb-3 leading-relaxed group-hover:text-white transition-colors">
                                {item.headline}
                            </h4>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-[9px]">
                                    <span className="text-white/40 font-mono uppercase tracking-wider">{item.category}</span>
                                    <span className={`font-mono uppercase tracking-wider ${
                                        item.sentiment === 'Bullish' ? 'text-green-400' : 
                                        item.sentiment === 'Bearish' ? 'text-red-400' : 'text-white/50'
                                    }`}>
                                        {item.sentiment}
                                    </span>
                                </div>
                                <div className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 font-mono text-[9px]">
                                    <span>Open</span>
                                    <span className="w-3 h-3 border border-white/30 rounded-full flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
                </div>
            )}
        </div>
    </div>
  );
};
