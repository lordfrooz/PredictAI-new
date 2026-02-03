import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBar } from '../ui/NotificationBar';

interface Market {
    title: string;
    slug: string;
    volume: string;
    change: number;
    image?: string;
    topOutcomes?: { name: string, prob: number, change?: number }[];
}

export const TrendingMarkets = ({ onSelect }: { onSelect: (url: string) => void }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const storedFavs = localStorage.getItem('marketFavorites');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));
    fetchTrending();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, slug: string, title: string) => {
      e.stopPropagation();
      let newFavs;
      if (favorites.includes(slug)) {
          newFavs = favorites.filter(f => f !== slug);
      } else {
          newFavs = [...favorites, slug];
          setNotification(`Saved to watchlist`);
      }
      setFavorites(newFavs);
      localStorage.setItem('marketFavorites', JSON.stringify(newFavs));
  };

  const fetchTrending = async () => {
    setLoading(true);
    try {
        const res = await fetch(`/api/trending`);
        if (res.ok) {
            const data = await res.json();
            setMarkets(data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const sortedMarkets = [...markets].sort((a, b) => {
      const aFav = favorites.includes(a.slug);
      const bFav = favorites.includes(b.slug);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
  });

  return (
    <div className="w-full relative">
        {notification && (
            <NotificationBar message={notification} onClose={() => setNotification(null)} />
        )}

        <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Market Movers
            </h2>
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Live Data
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMarkets.map((market, i) => {
                    const isFavorite = favorites.includes(market.slug);
                    const topOutcome = market.topOutcomes?.[0];

                    return (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSelect(`https://polymarket.com/event/${market.slug}`)}
                        className="group relative h-full bg-[#0A0A0A] border border-white/5 hover:border-white/10 rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 overflow-hidden"
                    >
                        {/* Glass Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Favorite Action */}
                        <button 
                            onClick={(e) => toggleFavorite(e, market.slug, market.title)}
                            className="absolute top-5 right-5 z-20 text-gray-600 hover:text-white transition-colors"
                        >
                            <svg className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'text-blue-500 fill-blue-500' : 'opacity-0 group-hover:opacity-100'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>

                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {market.image ? (
                                            <img src={market.image} alt="icon" className="w-10 h-10 rounded-xl object-cover shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <span className="text-xs text-gray-500 font-mono">#</span>
                                            </div>
                                        )}
                                        {/* Status Dot */}
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0A0A0A] rounded-full flex items-center justify-center">
                                            <div className={`w-1.5 h-1.5 rounded-full ${market.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Volume</span>
                                        <span className="text-xs font-medium text-gray-300">{market.volume}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium text-white leading-snug pr-4 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                                    {market.title}
                                </h3>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5">
                                {topOutcome ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 font-mono uppercase">Top Prediction</span>
                                                <span className="text-sm font-medium text-white">{topOutcome.name}</span>
                                            </div>
                                            <div className="text-xl font-bold font-mono text-white">{topOutcome.prob}%</div>
                                        </div>
                                        {/* Premium Progress Bar */}
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${topOutcome.prob}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-600 font-mono">No data available</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )})}
            </div>
        )}
        
        {!loading && markets.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-20 font-light border border-white/5 rounded-3xl bg-white/[0.02]">
                No markets currently trending
            </div>
        )}
    </div>
  );
};
