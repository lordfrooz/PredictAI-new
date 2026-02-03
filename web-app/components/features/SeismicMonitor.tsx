import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/Primitives';

// Type for Seismic Event
interface SeismicEvent {
    id: string;
    market: string;
    type: string;
    intensity: number;
    magnitude: string;
    volume: string;
    rawVolume: number;
    reason: string;
    timestamp: string;
    slug: string;
}

export const SeismicMonitor = ({ onClose, onAnalyze }: { onClose: () => void, onAnalyze: (url: string) => void }) => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXTREME' | 'HIGH' | 'MODERATE'>('ALL');
    const [events, setEvents] = useState<SeismicEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVolume, setTotalVolume] = useState('$0');
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch Logic
    const fetchSeismicData = async () => {
        try {
            const res = await fetch('/api/seismic');
            if (res.ok) {
                const data: SeismicEvent[] = await res.json();
                setEvents(data);
                
                // Calculate Total Volume
                const vol = data.reduce((acc, curr) => acc + curr.rawVolume, 0);
                setTotalVolume(`$${(vol / 1000000).toFixed(1)}M`);
            }
        } catch (error) {
            console.error("Failed to fetch seismic data", error);
        } finally {
            setLoading(false);
        }
    };

    // Initialize & Poll
    useEffect(() => {
        fetchSeismicData(); // Initial load
        
        pollingInterval.current = setInterval(() => {
            fetchSeismicData(); // 7/24 Monitoring (10s interval)
        }, 10000);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);
    
    // Filter Logic
    const filteredEvents = events.filter(event => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'EXTREME') return event.intensity >= 7.5;
        if (activeFilter === 'HIGH') return event.intensity >= 5.0 && event.intensity < 7.5;
        if (activeFilter === 'MODERATE') return event.intensity >= 2.5 && event.intensity < 5.0;
        return true;
    });

    const handleFullReport = (slug: string) => {
        onClose(); // Close monitor
        // Use real Polymarket URL format based on slug
        const url = `https://polymarket.com/event/${slug}`;
        onAnalyze(url);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl pointer-events-auto transition-opacity duration-500" 
                onClick={onClose}
            ></div>

            {/* Monitor UI */}
            <div className="w-full max-w-6xl h-[85vh] bg-[#050505] border border-[#222] rounded-2xl relative shadow-2xl pointer-events-auto flex overflow-hidden animate-fade-in-up">
                
                {/* Sidebar Controls */}
                <div className="w-64 border-r border-[#222] p-6 flex flex-col bg-[#080808]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">Seismic<span className="text-gray-600">.Live</span></h2>
                    </div>

                    <div className="space-y-2 mb-8">
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-2">Intensity Filter</div>
                        {['ALL', 'EXTREME', 'HIGH', 'MODERATE'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={`w-full text-left px-3 py-2 rounded text-[10px] font-mono transition-colors ${
                                    activeFilter === filter ? 'bg-white/10 text-white border-l-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {filter} {filter === 'EXTREME' && '??'}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="p-3 bg-white/5 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400 font-mono mb-1">Global Volume (24h)</div>
                            <div className="text-xl font-bold text-white font-mono">{totalVolume}</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded border border-white/5">
                            <div className="text-[10px] text-gray-400 font-mono mb-1">Active Earthquakes</div>
                            <div className="text-xl font-bold text-red-400 font-mono">{events.length}</div>
                        </div>
                    </div>
                </div>

                {/* Main Radar View */}
                <div className="flex-1 flex flex-col relative">
                    {/* Radar Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none"></div>

                    {/* Header */}
                    <div className="p-6 border-b border-[#222] flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-white">Market Activity Radar</h3>
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30 font-mono text-[10px]">
                                {loading ? 'SCANNING NETWORK...' : 'SYSTEM ONLINE'}
                            </Badge>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Events Grid */}
                    <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 relative z-10">
                        {loading ? (
                            <div className="col-span-2 flex flex-col items-center justify-center h-full">
                                <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <div className="text-red-500 font-mono text-xs animate-pulse">DETECTING SEISMIC ACTIVITY...</div>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="col-span-2 flex flex-col items-center justify-center h-full text-gray-500">
                                <div className="text-4xl mb-2">??</div>
                                <div className="font-mono text-xs">No significant movements detected in this range.</div>
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <div key={event.id} className="bg-[#0A0A0A]/80 backdrop-blur border border-[#222] hover:border-white/20 transition-colors p-5 rounded-xl group relative overflow-hidden">
                                    {/* Intensity Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-800 to-transparent group-hover:via-blue-500 transition-all duration-500"></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${
                                                event.intensity >= 8 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' :
                                                event.intensity >= 6 ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                                                'bg-blue-500/10 border-blue-500/30 text-blue-500'
                                            }`}>
                                                {event.intensity}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-gray-500 font-mono uppercase">{event.type}</div>
                                                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate pr-2" title={event.market}>
                                                    {event.market}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-sm font-mono font-bold ${event.magnitude.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                {event.magnitude}
                                            </div>
                                            <div className="text-[10px] text-gray-600 flex items-center justify-end gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                {event.timestamp}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-[#222] border-b border-[#222] bg-black/20 rounded">
                                        <div className="text-center">
                                            <div className="text-[9px] text-gray-600 uppercase">Volume</div>
                                            <div className="text-xs text-gray-300 font-mono">{event.volume}</div>
                                        </div>
                                        <div className="text-center border-l border-[#222]">
                                            <div className="text-[9px] text-gray-600 uppercase">Trigger</div>
                                            <div className="text-xs text-white font-mono truncate px-1">{event.reason}</div>
                                        </div>
                                        <div className="text-center border-l border-[#222]">
                                            <div className="text-[9px] text-gray-600 uppercase">Status</div>
                                            <div className="text-xs text-blue-400 font-mono">Active</div>
                                        </div>
                                    </div>

                                    {/* PredictlyAI Action */}
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="text-[10px] text-gray-500 italic">PredictlyAI Agent is calculating impact...</div>
                                        <button 
                                            onClick={() => handleFullReport(event.slug)}
                                            className="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Full Report
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
