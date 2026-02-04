import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Market {
    title: string;
    slug: string;
    volume: string;
    change: number | string;
    image?: string;
    topOutcomes?: { name: string, prob: number, change?: number }[];
}

export const TrendingMarkets = ({ onSelect }: { onSelect: (url: string) => void }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<'trending' | 'new'>('trending');

  const toggleFavorite = (e: React.MouseEvent, slug: string) => {
      e.stopPropagation();
      let newFavs;
      if (favorites.includes(slug)) {
          newFavs = favorites.filter(f => f !== slug);
      } else {
          newFavs = [...favorites, slug];
          setNotification(`Added to watchlist`);
      }
      setFavorites(newFavs);
      localStorage.setItem('marketFavorites', JSON.stringify(newFavs));
      
      // Clear notification after 2s
      setTimeout(() => setNotification(null), 2000);
  };

  const fetchTrending = React.useCallback(async () => {
    setLoading(true);
    try {
        const res = await fetch(`/api/trending?filter=${filter}`);
        if (res.ok) {
            const data = await res.json();
            setMarkets(data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const storedFavs = localStorage.getItem('marketFavorites');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));
    fetchTrending();
  }, [fetchTrending]);

  const sortedMarkets = [...markets].sort((a, b) => {
      // Logic for different filters can be added here
      // Default prioritization: Favorites -> Volume
      const aFav = favorites.includes(a.slug);
      const bFav = favorites.includes(b.slug);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
  });

  return (
    <div className="w-full relative mt-12">
        {notification && (
            <div className="fixed bottom-8 right-8 z-50">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {notification}
                </motion.div>
            </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-4">
            <div>
                 <h2 className="text-xl font-semibold text-white flex items-center gap-3 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                    Market Opportunities
                </h2>
                <p className="text-sm text-gray-500 font-light ml-5 max-w-[64ch]">
                    High volume markets with significant probability divergence.
                </p>
            </div>
            
            <div className="flex p-1 bg-[#0A0A0A] border border-white/10 rounded-lg">
                {(['trending', 'new'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                            filter === f 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="space-y-3">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse border border-white/5" />
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-3">
                {sortedMarkets.map((market, i) => {
                    const isFavorite = favorites.includes(market.slug);
                    const changeValue = Number.isFinite(Number(market.change)) ? Number(market.change) : 0;
                    const absChange = Math.abs(changeValue);
                    const rawText = absChange >= 1 ? changeValue.toFixed(1) : changeValue.toFixed(2);
                    const changeText = rawText.replace(/\.?0+$/, '');
                    const isPositive = changeValue >= 0;
                    const outcomes = (market.topOutcomes || []).slice(0, 2);

                    return (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSelect(`https://polymarket.com/event/${market.slug}`)}
                        className="group relative bg-[#0A0A0A] hover:bg-[#0F0F0F] border border-white/5 hover:border-white/10 rounded-xl p-4 cursor-pointer transition-all duration-300 flex items-center justify-between gap-6 overflow-hidden"
                    >
                        {/* Hover Gradient Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isPositive ? 'from-emerald-500/[0.05]' : 'from-red-500/[0.05]'} to-transparent`}></div>

                        {/* Left: Identity */}
                        <div className="flex items-center gap-5 flex-1 min-w-0 z-10">
                            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                                {market.image ? (
                                    <img src={market.image} alt={market.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <span className="text-xs text-gray-600 font-mono">#</span>
                                )}
                            </div>
                            <div className="min-w-0 space-y-1">
                                <h3 className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors truncate pr-4 leading-snug">
                                    {market.title}
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wide">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/5">
                                        <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {market.volume}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                        <span>{changeValue > 0 ? '+' : ''}{changeText}%</span>
                                        <span className="text-white/30">(24h)</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Middle: Pro Bars */}
                        <div className="hidden md:flex flex-col gap-2 w-[340px] z-10">
                            {outcomes.length > 0 ? (
                                outcomes.map((outcome, idx) => (
                                    <div key={`${outcome.name}-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                            <span className="text-gray-400 uppercase tracking-wider truncate max-w-[240px]">{outcome.name}</span>
                                            <span className="text-gray-200 font-bold">{outcome.prob}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, Math.max(0, outcome.prob))}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className={`h-full ${idx === 0 ? 'bg-emerald-500/80' : 'bg-sky-500/70'}`}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-600 font-mono">No outcome data</div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 z-10">
                             <button 
                                onClick={(e) => toggleFavorite(e, market.slug)}
                                aria-label={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
                                className={`p-2.5 rounded-lg border border-transparent hover:bg-white/5 transition-all ${isFavorite ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-gray-600 hover:text-white'}`}
                            >
                                 <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelect(`https://polymarket.com/event/${market.slug}`); }}
                                className="hidden md:flex px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-600/20 transition-all items-center gap-2 group/btn"
                            >
                                <span>Analyze</span>
                                <svg className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                )})}
            </div>
        )}
        
        {!loading && markets.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-20 font-medium border border-white/5 rounded-2xl bg-slate-900/50">
                No trending markets found at the moment.
            </div>
        )}
    </div>
  );
};
