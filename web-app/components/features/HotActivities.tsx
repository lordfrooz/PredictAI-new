import React, { useEffect, useState } from 'react';

interface HotActivity {
  id: string;
  market: string;
  option: string;
  price: number;
  change: number;
  timestamp: string;
  url: string;
}

export const HotActivities = ({ onSelect }: { onSelect?: (url: string) => void }) => {
  const [activities, setActivities] = useState<HotActivity[]>([]);
  const [allActivities, setAllActivities] = useState<HotActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/hot-activities');
      const data = await res.json();
      
      // Sort activities by Absolute Change descending (Biggest movers)
      const sorted = (data.activities || []).sort((a: HotActivity, b: HotActivity) => Math.abs(b.change) - Math.abs(a.change));
      
      setAllActivities(sorted);
      setActivities(sorted.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch hot activities', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle view
  const toggleShowAll = () => {
      setShowAll(!showAll);
      if (!showAll) {
          setActivities(allActivities);
      } else {
          setActivities(allActivities.slice(0, 5));
      }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full bg-[#0A0A0A] border border-white/5 flex items-center justify-center rounded-[2rem]">
         <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Loading Feed...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-white/[0.03] via-black/40 to-black/60 border border-white/10 relative overflow-hidden group rounded-[2.25rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-[90px]"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-[90px]"></div>
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-70"></div>
      
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/90">Market Flow</h3>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest">Live movers</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-white/40">{activities.length} Events</span>
            <div className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-white/60">
              Hot
            </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-[420px] overflow-y-auto custom-scrollbar relative z-10 p-2 space-y-2">
        {activities.map((item, idx) => {
            const isPositive = item.change >= 0;
            const intensity = Math.min(Math.abs(item.change) * 1.5, 100); // Visual intensity based on change magnitude
            
            return (
              <div 
                key={item.id || idx}
                onClick={() => onSelect && onSelect(item.url)}
                className="group relative p-4 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10"
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                    isPositive ? 'from-green-500/5 to-transparent' : 'from-red-500/5 to-transparent'
                }`}></div>

                <div className="relative z-10 flex justify-between items-center gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider truncate max-w-[100px]">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/10"></div>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider truncate max-w-[120px]">
                                {item.market}
                            </span>
                        </div>
                        <div className="text-sm text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                            {item.option}
                        </div>
                    </div>

                    {/* Right: Price Action */}
                    <div className="text-right shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-mono font-bold text-white">
                              {(item.price * 100).toFixed(0)}%
                            </span>
                            <div className={`flex items-center gap-1 text-[10px] font-mono ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                              <span>{isPositive ? '^' : 'v'}</span>
                              <span>{Math.abs(item.change).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Micro Chart / Bar */}
                <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden flex justify-end">
                    <div 
                        style={{ width: `${intensity}%` }} 
                        className={`h-full shadow-[0_0_8px_currentColor] ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    ></div>
                </div>
              </div>
            );
        })}
      </div>

      {/* Footer / Load More */}
      <div className="p-3 border-t border-white/5 bg-[#0A0A0A] relative z-10">
          <button 
              onClick={toggleShowAll}
              className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[9px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
          >
              <span>{showAll ? 'Collapse Feed' : 'Load Historical Data'}</span>
              <svg className={`w-3 h-3 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
          </button>
      </div>
    </div>
  );
};
