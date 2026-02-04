import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trader {
    rank: number;
    name: string;
    address: string;
    volume: number;
    pnl: number;
    winRate: number;
    avatarColor: string;
    image?: string;
}

export const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState<'month' | 'all'>('month');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchLeaderboard = async () => {
          setLoading(true);
          try {
              // Map our filter to API params
              const windowParam = timeFilter; // 'month' or 'all' matches API expectation
              const res = await fetch(`/api/leaderboard?window=${windowParam}&limit=50`);
              
              if (res.ok) {
                  const data = await res.json();
                  setTraders(data);
              }
          } catch (error) {
              console.error("Failed to fetch leaderboard:", error);
          } finally {
              setLoading(false);
          }
      };

      fetchLeaderboard();
  }, [timeFilter]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...traders].sort((a: any, b: any) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const formatPnL = (val: number) => {
    const formatted = formatCurrency(Math.abs(val));
    return val >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-2"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Top Traders</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs text-green-400 font-mono uppercase tracking-widest">Live from Polymarket</p>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                <button 
                    onClick={() => setTimeFilter('month')}
                    className={`px-6 py-2 rounded-md text-xs font-bold transition-all duration-300 ${
                        timeFilter === 'month' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setTimeFilter('all')}
                    className={`px-6 py-2 rounded-md text-xs font-bold transition-all duration-300 ${
                        timeFilter === 'all' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    All Time
                </button>
            </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <table className="w-full relative z-10">
                <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-5 text-left text-[10px] font-mono text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('rank')}>
                            Rank {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '?' : '?')}
                        </th>
                        <th className="px-6 py-5 text-left text-[10px] font-mono text-gray-500 uppercase tracking-widest">Trader</th>
                        <th className="px-6 py-5 text-right text-[10px] font-mono text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('volume')}>
                            Volume {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '?' : '?')}
                        </th>
                        <th className="px-6 py-5 text-right text-[10px] font-mono text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pnl')}>
                            PnL {sortConfig.key === 'pnl' && (sortConfig.direction === 'asc' ? '?' : '?')}
                        </th>
                        <th className="px-6 py-5 text-right text-[10px] font-mono text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('winRate')}>
                            Win Rate {sortConfig.key === 'winRate' && (sortConfig.direction === 'asc' ? '?' : '?')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {loading ? (
                        /* Loading Skeletons */
                        [...Array(10)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-6 py-4"><div className="h-8 w-8 bg-white/5 rounded animate-pulse"></div></td>
                                <td className="px-6 py-4"><div className="flex gap-4"><div className="h-10 w-10 rounded-full bg-white/5 animate-pulse"></div><div className="h-4 w-32 bg-white/5 rounded animate-pulse my-auto"></div></div></td>
                                <td className="px-6 py-4"><div className="h-4 w-20 bg-white/5 rounded animate-pulse ml-auto"></div></td>
                                <td className="px-6 py-4"><div className="h-4 w-20 bg-white/5 rounded animate-pulse ml-auto"></div></td>
                                <td className="px-6 py-4"><div className="h-4 w-12 bg-white/5 rounded animate-pulse ml-auto"></div></td>
                            </tr>
                        ))
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {sortedData.map((user, index) => (
                                <motion.tr 
                                    key={user.address || user.name}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="group hover:bg-white/[0.03] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                                            user.rank === 1 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                                            user.rank === 2 ? 'bg-gray-300/10 text-gray-300 border-gray-300/20' :
                                            user.rank === 3 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-white/5 text-gray-500 border-transparent'
                                        }`}>
                                            {user.rank}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.avatarColor} p-[1px] relative shrink-0`}>
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-black rounded-full m-[1px] flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white uppercase">{user.name.substring(0, 2)}</span>
                                                    </div>
                                                )}
                                                {user.rank <= 3 && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
                                                        <span className="text-[8px]">??</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate max-w-[150px]">{user.name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{user.address ? user.address.substring(0,6) + '...' + user.address.substring(38) : 'Unknown'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-mono text-gray-300">{formatCurrency(user.volume)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`text-sm font-mono font-bold ${user.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatPnL(user.pnl)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm font-mono text-white">{user.winRate}%</span>
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                                <div 
                                                    className={`h-full rounded-full ${user.winRate >= 70 ? 'bg-green-500' : user.winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${user.winRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    )}
                </tbody>
            </table>
            
            {!loading && sortedData.length === 0 && (
                <div className="p-12 text-center text-gray-500 font-mono text-sm">
                    No traders found for this period.
                </div>
            )}
        </div>
    </div>
  );
};
