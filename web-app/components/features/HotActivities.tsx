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
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/hot-activities');
      const data = await res.json();
      
      // Sort activities by Absolute Change descending (Biggest movers)
      const sorted = (data.activities || []).sort((a: HotActivity, b: HotActivity) => Math.abs(b.change) - Math.abs(a.change));
      
      setActivities(sorted.slice(0, 10)); // Show top 10 for horizontal scroll
    } catch (error) {
      console.error('Failed to fetch hot activities', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-32 bg-[#0A0A0A] border border-white/5 flex items-center justify-center rounded-xl">
         <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Loading Feed...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Market Flow</span>
         </div>
         <span className="text-[10px] font-mono text-gray-500">Live Movers</span>
      </div>

      {/* Horizontal List */}
      <div className="flex overflow-x-auto custom-scrollbar pb-4 gap-4 -mx-2 px-2 md:mx-0 md:px-0">
        {activities.map((item, idx) => {
            const isPositive = item.change >= 0;
            
            return (
              <div 
                key={item.id || idx}
                onClick={() => onSelect && onSelect(item.url)}
                className="min-w-[240px] md:min-w-[280px] group relative p-4 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                    isPositive ? 'from-green-500/5 to-transparent' : 'from-red-500/5 to-transparent'
                }`}></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                              <span>{isPositive ? '+' : ''}{item.change.toFixed(1)}%</span>
                        </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate mb-1">
                        {item.option}
                    </h3>
                    <p className="text-[10px] text-gray-500 truncate">{item.market}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-mono text-gray-600 uppercase">Price</span>
                    <span className="text-sm font-mono font-bold text-white">{(item.price * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
