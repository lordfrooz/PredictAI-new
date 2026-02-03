import React, { useEffect, useState } from 'react';

interface SocialSentimentProps {
  topic: string;
  sentimentScore: number;
}

interface PulseItem {
    id: string;
    user: string;
    handle: string;
    text: string;
    time: string;
    timestamp: string;
    sentiment: "positive" | "negative" | "neutral";
    likes: number;
    retweets: number;
    replies: number;
    link: string;
    category: string;
    source?: string;
}

export const SocialSentiment = ({ topic, sentimentScore }: SocialSentimentProps) => {
    const [items, setItems] = useState<PulseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
            positive: 0,
            neutral: 0,
            negative: 0,
            engagementRate: '0.0',
            reach: '0K',
            shares: '0'
    });

    useEffect(() => {
        const fetchPulse = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/social-pulse?topic=${encodeURIComponent(topic)}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items || []);
                    if (data.stats) {
                        setStats(data.stats);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch social pulse', e);
            } finally {
                setLoading(false);
            }
        };

        if (topic) {
            fetchPulse();
        }
    }, [topic]);

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-white/[0.04] via-black/50 to-black/70 border border-white/10 relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-[90px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-[90px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-black/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/90">Social Pulse</h3>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">Live sentiment scan</p>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-white/10 relative z-10">
            <StatItem label="Engagement" value={stats.engagementRate} />
            <StatItem label="Reach" value={stats.reach} />
            <StatItem label="Shares" value={stats.shares} />
        </div>

        {/* Sentiment Analysis */}
        <div className="p-4 border-b border-white/10 relative z-10">
             <div className="flex items-center justify-between mb-3">
                 <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Sentiment Distribution</div>
                 <div className="text-[10px] font-mono text-white/40">Last 24h</div>
             </div>
             <div className="space-y-3">
                 <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-green-400 uppercase w-16">Positive</span>
                     <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                         <div style={{ width: `${stats.positive}%` }} className="h-full bg-green-400"></div>
                     </div>
                     <span className="text-[10px] font-mono text-white/70 w-10 text-right">{stats.positive}%</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-white/60 uppercase w-16">Neutral</span>
                     <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                         <div style={{ width: `${stats.neutral}%` }} className="h-full bg-white/50"></div>
                     </div>
                     <span className="text-[10px] font-mono text-white/70 w-10 text-right">{stats.neutral}%</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-red-400 uppercase w-16">Negative</span>
                     <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                         <div style={{ width: `${stats.negative}%` }} className="h-full bg-red-400"></div>
                     </div>
                     <span className="text-[10px] font-mono text-white/70 w-10 text-right">{stats.negative}%</span>
                 </div>
             </div>
        </div>

        {/* Pulse Feed */}
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar relative z-10">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                    <div className="w-4 h-4 border border-white/10 border-t-white rounded-full animate-spin"></div>
                    <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Scanning Sources...</div>
                </div>
            ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <div className="text-white/30 text-[10px] font-mono uppercase tracking-widest">No signals found</div>
                    <div className="text-white/20 text-[10px]">Try a different topic or check back later.</div>
                </div>
            ) : (
                <div className="p-3 space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-white">
                                            {item.user[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-white/90">{item.user}</span>
                                                <span className="text-[10px] text-white/40">{item.handle}</span>
                                            </div>
                                            <span className="text-[9px] text-white/30 uppercase tracking-widest">{item.source || 'Pulse'}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono text-white/30">{item.time}</span>
                                </div>

                                <p className="text-sm font-light text-white/80 leading-relaxed pl-10 mb-3">
                                    {item.text}
                                </p>

                                <div className="pl-10 flex items-center gap-6">
                                    <Metric label="Likes" value={item.likes} />
                                    <Metric label="Reposts" value={item.retweets} />
                                    <div className="ml-auto text-[9px] font-mono text-white/30 uppercase tracking-wider">
                                        {item.category}
                                    </div>
                                </div>
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
    <div className="py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
        <div className="text-[9px] text-white/40 font-mono mb-1 uppercase tracking-widest">{label}</div>
        <div className="text-sm text-white/90 font-mono font-light">{value}</div>
    </div>
);

const Metric = ({ label, value }: { label: string, value: number }) => (
    <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white/70 transition-colors">
        <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono">{value > 1000 ? (value/1000).toFixed(1) + 'k' : value}</span>
    </div>
);
